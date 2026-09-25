const stopWords = new Set(['the','and','a','of','in','to','is','are']);

// Basic heuristic: medical keywords list (extend for your domain)
const MEDICAL_KEYWORDS = ['diagnosis','symptom','treatment','randomized','trial','mortality','morbidity','risk','efficacy','placebo','dose','side effect','adverse','prevalence','incidence','guideline','recommendation','meta-analysis','systematic review','case report','study','cohort','clinical'];

function isMedicallyRelevant(text) {
  if (!text || text.length < 50) return false;
  const low = text.toLowerCase();
  let hits = 0;
  for (const k of MEDICAL_KEYWORDS) if (low.includes(k)) hits++;
  return hits >= 1; // at least one medical keyword
}

function extractSentences(text) {
  return text
    .replace(/\r/g,' ') // normalize
    .split(/[\.\n]+/)
    .map(s => s.trim())
    .filter(Boolean);
}

function validateAndExtractFacts(rawText, source) {
  const sentences = extractSentences(rawText);
  const facts = [];
  for (const s of sentences) {
    if (s.length < 40) continue;
    if (isMedicallyRelevant(s)) {
      // simple confidence heuristic: more keywords -> higher confidence
      let conf = 0.5;
      for (const k of MEDICAL_KEYWORDS) if (s.toLowerCase().includes(k)) conf += 0.08;
      facts.push({ text: s, confidence: Math.min(conf, 0.99) });
    }
  }
  // Return top N facts
  return facts.slice(0, 12);
}

function removeLinks(text) {
  if (!text) return '';
  return text.replace(/https?:\/\/[\w\-./?&=%#]+/g,'').replace(/www\.[\w\-./?&=%#]+/g,'');
}

module.exports = { isMedicallyRelevant, validateAndExtractFacts, removeLinks };
const stopWords = new Set(['the','and','a','of','in','to','is','are']);

// Basic heuristic: medical keywords list (extend for your domain)
const MEDICAL_KEYWORDS = ['diagnosis','symptom','treatment','randomized','trial','mortality','morbidity','risk','efficacy','placebo','dose','side effect','adverse','prevalence','incidence','guideline','recommendation','meta-analysis','systematic review','case report','study','cohort','clinical'];

function isMedicallyRelevant(text) {
  if (!text || text.length < 50) return false;
  const low = text.toLowerCase();
  let hits = 0;
  for (const k of MEDICAL_KEYWORDS) if (low.includes(k)) hits++;
  return hits >= 1; // at least one medical keyword
}

function extractSentences(text) {
  return text
    .replace(/\r/g,' ') // normalize
    .split(/[\.\n]+/)
    .map(s => s.trim())
    .filter(Boolean);
}

function validateAndExtractFacts(rawText, source) {
  const sentences = extractSentences(rawText);
  const facts = [];
  for (const s of sentences) {
    if (s.length < 40) continue;
    if (isMedicallyRelevant(s)) {
      // simple confidence heuristic: more keywords -> higher confidence
      let conf = 0.5;
      for (const k of MEDICAL_KEYWORDS) if (s.toLowerCase().includes(k)) conf += 0.08;
      facts.push({ text: s, confidence: Math.min(conf, 0.99) });
    }
  }
  // Return top N facts
  return facts.slice(0, 12);
}

function removeLinks(text) {
  if (!text) return '';
  return text.replace(/https?:\/\/[\w\-./?&=%#]+/g,'').replace(/www\.[\w\-./?&=%#]+/g,'');
}

module.exports = { isMedicallyRelevant, validateAndExtractFacts, removeLinks };