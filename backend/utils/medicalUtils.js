const MEDICAL_KEYWORDS = [
  'diagnosis', 'symptom', 'treatment', 'randomized', 'trial', 'mortality', 'morbidity', 'risk',
  'efficacy', 'placebo', 'dose', 'side effect', 'adverse', 'prevalence', 'incidence',
  'guideline', 'recommendation', 'meta-analysis', 'systematic review', 'case report', 'study',
  'cohort', 'clinical', 'infection', 'vaccine', 'diagnostic', 'therapy', 'management'
];

function stripUrls(text) {
  if (!text) return '';
  return text.replace(/https?:\/\/[\w\-./?&=%#]+/g, '').replace(/www\.[\w\-./?&=%#]+/g, '');
}

function textSentences(text) {
  return stripUrls(text)
    .replace(/\r/g, ' ')
    .split(/(?<=[.!?])\s+/)
    .map(s => s.trim())
    .filter(s => s.length > 40);
}

function isRelevantSentence(sentence) {
  const lower = sentence.toLowerCase();
  return MEDICAL_KEYWORDS.some(keyword => lower.includes(keyword));
}

function extractMedicalFacts(rawContent, source) {
  const sentences = textSentences(rawContent);
  const facts = [];
  for (const sentence of sentences) {
    if (!isRelevantSentence(sentence)) continue;
    const confidence = Math.min(0.5 + MEDICAL_KEYWORDS.reduce((sum, keyword) => sum + (sentence.toLowerCase().includes(keyword) ? 0.05 : 0), 0), 0.99);
    facts.push({ source, text: sentence, confidence });
  }
  return facts.slice(0, 20);
}

module.exports = { extractMedicalFacts, stripUrls };
