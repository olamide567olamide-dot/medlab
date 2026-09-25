const express = require('express');
const fetch = require('node-fetch');
const bodyParser = require('body-parser');
const { fetchFromSource } = require('./extractors');
const { validateAndExtractFacts, isMedicallyRelevant, removeLinks } = require('./validator');

const app = express();
app.use(bodyParser.json());

// Whitelist of allowed sources (only these will be queried)
const ALLOWED_SOURCES = ['PubMed','WHO','CDC','NICE','NHS','MayoClinic','Google','NHI'];

// Main endpoint: accepts { question: string, sources?: string[] }
app.post('/api/trusted-query', async (req, res) => {
  try {
    const { question, sources } = req.body;
    if (!question || typeof question !== 'string') {
      return res.status(400).json({ error: 'Missing question string' });
    }

    const requested = Array.isArray(sources) && sources.length ? sources : ALLOWED_SOURCES;
    const toQuery = requested.filter(s => ALLOWED_SOURCES.includes(s));
    if (!toQuery.length) return res.status(400).json({ error: 'No valid sources requested' });

    // Fetch concurrently from chosen trusted sources
    const fetchPromises = toQuery.map(s => fetchFromSource(s, question).catch(err => ({ source: s, error: err.message })) );
    const rawResults = await Promise.all(fetchPromises);

    // Validate and extract medically relevant facts from results
    const factsPerSource = rawResults.map(r => {
      if (!r || r.error) return { source: r && r.source ? r.source : 'unknown', facts: [] };
      const facts = validateAndExtractFacts(r.content || r.text || '', r.source);
      return { source: r.source, facts };
    });

    // Merge facts, dedupe, and keep highest-confidence snippets
    const mergedFacts = [];
    const seen = new Set();
    for (const s of factsPerSource) {
      for (const f of s.facts) {
        const key = f.text.slice(0, 240).trim();
        if (!seen.has(key) && isMedicallyRelevant(f.text)) {
          seen.add(key);
          mergedFacts.push({ source: s.source, text: f.text, confidence: f.confidence || 0.8 });
        }
      }
    }

    // Build a compact evidence block for the AI chain (no URLs)
    const evidenceBlock = mergedFacts.map((f,i) => `${i+1}. [${f.source}] ${removeLinks(f.text)}`).join('\n');

    // Prepare the updated prompt for the AI reasoning chain
    const aiPrompt = `You are a medical reasoning assistant. Answer the user's question ONLY using the verified evidence below. Do NOT invent facts, do not cite URLs, and be concise. If evidence is insufficient, say so and recommend seeking a clinician.

Evidence:
${evidenceBlock}

User question: ${question}

Answer:`;

    // Call into the existing AI backend or LLM chain. Replace this with your app's AI call.
    // Example: POST to /api/ai-complete which implements your AI logic. It must accept { prompt } and return { completion }.
    const aiResponse = await callLocalAI(aiPrompt);

    // Ensure no external links are included in the final answer
    const safeAnswer = removeLinks(aiResponse).trim();

    return res.json({ answer: safeAnswer });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error' });
  }
});

async function callLocalAI(prompt) {
  // Placeholder: adapt to your AI logic. The important part is we pass the prompt with evidence.
  // Example using local AI endpoint:
  if (process.env.LOCAL_AI_ENDPOINT) {
    const r = await fetch(process.env.LOCAL_AI_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt })
    });
    const j = await r.json();
    return j.completion || j.answer || '';
  }
  // If no local AI endpoint, return a safe placeholder explaining missing integration.
  return 'AI backend not configured. Please set LOCAL_AI_ENDPOINT to your AI completion endpoint.';
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Trusted proxy listening on ${PORT}`));
