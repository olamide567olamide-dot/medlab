const { diseaseDatabase } = require('../data/diseaseDB');

function normalizeSymptoms(question) {
  const lower = question.toLowerCase();
  const normalized = { topic: 'default', matchedKeywords: [], score: 0 };

  for (const entry of diseaseDatabase) {
    const matches = entry.keywords.filter(keyword => lower.includes(keyword));
    if (matches.length > normalized.score) {
      normalized.topic = entry.topic;
      normalized.matchedKeywords = matches;
      normalized.score = matches.length;
    }
  }

  return normalized;
}

function searchDiseaseDatabase(topic) {
  return diseaseDatabase.find(entry => entry.topic === topic) || diseaseDatabase.find(entry => entry.topic === 'default');
}

module.exports = { normalizeSymptoms, searchDiseaseDatabase };
