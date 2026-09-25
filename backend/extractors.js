const fetch = require('node-fetch');

// Each fetcher returns { source: 'PubMed', content: '...', meta: {...} }
// Replace API endpoints and parameters with your real credentials and ensure you have permission to use each source.

async function fetchPubMed(query) {
  // Use NCBI Entrez E-utilities (esearch + efetch/summary). Requires polite usage and API key (NCBI_API_KEY)
  const apiKey = process.env.NCBI_API_KEY; // optional
  const esearch = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pubmed&retmax=3&retmode=json&term=${encodeURIComponent(query)}${apiKey?`&api_key=${apiKey}`:''}`;
  const sResp = await fetch(esearch);
  const sJson = await sResp.json();
  const ids = sJson.esearchresult && sJson.esearchresult.idlist ? sJson.esearchresult.idlist : [];
  if (!ids.length) return { source: 'PubMed', content: '' };
  const efetch = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi?db=pubmed&id=${ids.join(',')}&retmode=text&rettype=abstract${apiKey?`&api_key=${apiKey}`:''}`;
  const eResp = await fetch(efetch);
  const text = await eResp.text();
  return { source: 'PubMed', content: text, meta: { ids } };
}

async function fetchWHO(query) {
  // WHO API (example): https://www.who.int/data/gho/info/gho-odata-api
  const url = `https://www.who.int/search?&query=${encodeURIComponent(query)}`; // limited; recommend using official OData datasets
  const r = await fetch(url);
  const html = await r.text();
  return { source: 'WHO', content: html };
}

async function fetchCDC(query) {
  // CDC data portal or guidelines API depending on topic. Here we call the public search endpoint as an example.
  const url = `https://wwwn.cdc.gov/search/index?query=${encodeURIComponent(query)}`;
  const r = await fetch(url);
  const html = await r.text();
  return { source: 'CDC', content: html };
}

async function fetchGoogle(query) {
  // Use Google Custom Search JSON API (requires API key & CX). Only fetch snippets, do not expose URLs to users.
  const key = process.env.GOOGLE_API_KEY;
  const cx = process.env.GOOGLE_CX;
  if (!key || !cx) return { source: 'Google', content: '' };
  const url = `https://www.googleapis.com/customsearch/v1?key=${key}&cx=${cx}&q=${encodeURIComponent(query)}&num=3`;
  const r = await fetch(url);
  const j = await r.json();
  const snippets = (j.items||[]).map(it => it.snippet).join('\n\n');
  return { source: 'Google', content: snippets, meta: { items: j.items||[] } };
}

async function fetchNHS(query) {
  // NHS provides some APIs via NHS Digital; many require registration. Use official endpoints when available.
  // Placeholder: try the public search
  const url = `https://www.nhs.uk/search?q=${encodeURIComponent(query)}`;
  const r = await fetch(url);
  const html = await r.text();
  return { source: 'NHS', content: html };
}

async function fetchNICE(query) {
  // NICE content often behind CMS; check their API/document dumps for programmatic use.
  const url = `https://www.nice.org.uk/search/all?search=${encodeURIComponent(query)}`;
  const r = await fetch(url);
  const html = await r.text();
  return { source: 'NICE', content: html };
}

async function fetchMayoClinic(query) {
  // Mayo Clinic does not offer a public API for clinical content. Use licensed datasets or their published patient education content per their terms.
  const url = `https://www.mayoclinic.org/search/search-results?q=${encodeURIComponent(query)}`;
  const r = await fetch(url);
  const html = await r.text();
  return { source: 'MayoClinic', content: html };
}

async function fetchNHI(query) {
  // Placeholder for NHI/NIH or other national health institute. Wire in the proper API URL and key.
  const url = process.env.NHI_API_URL ? `${process.env.NHI_API_URL}?q=${encodeURIComponent(query)}` : '';
  if (!url) return { source: 'NHI', content: '' };
  const r = await fetch(url, { headers: { Authorization: `Bearer ${process.env.NHI_API_KEY || ''}` } });
  const text = await r.text();
  return { source: 'NHI', content: text };
}

async function fetchFromSource(source, query) {
  switch (source) {
    case 'PubMed': return await fetchPubMed(query);
    case 'WHO': return await fetchWHO(query);
    case 'CDC': return await fetchCDC(query);
    case 'Google': return await fetchGoogle(query);
    case 'NHS': return await fetchNHS(query);
    case 'NICE': return await fetchNICE(query);
    case 'MayoClinic': return await fetchMayoClinic(query);
    case 'NHI': return await fetchNHI(query);
    default: throw new Error('Unsupported source');
  }
}

module.exports = { fetchFromSource };