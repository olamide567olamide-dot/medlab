const axios = require('axios');
const { parse } = require('node-html-parser');

const SOURCE_CONFIG = {
  NHI: { type: 'structured', endpoint: process.env.NHI_API_URL, apiKey: process.env.NHI_API_KEY },
  NICE: { type: 'html', endpoint: 'https://www.nice.org.uk/search/all', queryParam: 'search' },
  PubMed: { type: 'pubmed' },
  NHS: { type: 'html', endpoint: 'https://www.nhs.uk/search', queryParam: 'q' },
  CDC: { type: 'html', endpoint: 'https://wwwn.cdc.gov/search/index', queryParam: 'query' },
  WHO: { type: 'html', endpoint: 'https://www.who.int/search', queryParam: 'query' },
  MayoClinic: { type: 'html', endpoint: 'https://www.mayoclinic.org/search/search-results', queryParam: 'q' },
  Google: { type: 'google', apiKey: process.env.GOOGLE_API_KEY, cx: process.env.GOOGLE_CX }
};

async function trustedSourceFetch(source, query) {
  const config = SOURCE_CONFIG[source];
  if (!config) throw new Error(`Unsupported source ${source}`);

  if (config.type === 'structured') {
    if (!config.endpoint) throw new Error('Missing structured API endpoint');
    const response = await axios.get(config.endpoint, {
      params: { q: query },
      headers: { Authorization: config.apiKey ? `Bearer ${config.apiKey}` : undefined }
    });
    return { source, content: JSON.stringify(response.data) };
  }

  if (config.type === 'pubmed') {
    return await fetchPubMed(query);
  }

  if (config.type === 'google') {
    if (!config.apiKey || !config.cx) throw new Error('Google API credentials not configured');
    const url = 'https://www.googleapis.com/customsearch/v1';
    const response = await axios.get(url, {
      params: { key: config.apiKey, cx: config.cx, q: query, num: 3 }
    });
    const snippets = (response.data.items || []).map(i => i.snippet).join('\n\n');
    return { source, content: snippets };
  }

  const url = config.endpoint;
  const response = await axios.get(url, { params: { [config.queryParam]: query } });
  const html = response.data;
  const parsed = parse(html);
  const text = parsed.querySelectorAll('p, li, span, div').map(node => node.text.trim()).join(' ');
  return { source, content: text };
}

async function fetchPubMed(query) {
  const apiKey = process.env.NCBI_API_KEY;
  const esearchUrl = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi';
  const esearch = await axios.get(esearchUrl, {
    params: { db: 'pubmed', term: query, retmax: 3, retmode: 'json', api_key: apiKey }
  });
  const ids = esearch.data.esearchresult?.idlist || [];
  if (!ids.length) return { source: 'PubMed', content: '' };

  const efetchUrl = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi';
  const efetch = await axios.get(efetchUrl, {
    params: { db: 'pubmed', id: ids.join(','), retmode: 'text', rettype: 'abstract', api_key: apiKey }
  });
  return { source: 'PubMed', content: efetch.data };
}

module.exports = { trustedSourceFetch };
