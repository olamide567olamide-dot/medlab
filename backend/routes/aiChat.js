const express = require('express');
const { body, validationResult } = require('express-validator');
const { normalizeSymptoms, searchDiseaseDatabase } = require('../utils/symptomNormalizer');
const { trustedSourceFetch } = require('../utils/sourceFetch');
const { extractMedicalFacts, stripUrls } = require('../utils/medicalUtils');
const { callAILogic } = require('../utils/aiLogic');
const { cacheMiddleware } = require('../utils/cache');

const router = express.Router();

const ALLOWED_SOURCES = ['NHI', 'NICE', 'PubMed', 'NHS', 'CDC', 'WHO', 'MayoClinic', 'Google'];

router.post(
  '/chat',
  cacheMiddleware,
  body('message').trim().isLength({ min: 5, max: 600 }).escape(),
  body('voice').optional().isBoolean(),
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

      const question = req.body.message;
      const voice = req.body.voice === true;

      const normalized = normalizeSymptoms(question);
      const diseaseInfo = searchDiseaseDatabase(normalized.topic);

      const diseaseContext = `Internal disease summary:\n- Topic: ${diseaseInfo.title}\n- Likely conditions: ${diseaseInfo.conditions.join(', ')}\n- Red flags: ${diseaseInfo.redFlags.join(', ')}\n- Self-care: ${diseaseInfo.selfCare.join(', ')}\n`;

      const sources = ALLOWED_SOURCES;
      const rawSourceResults = await Promise.all(
        sources.map(src => trustedSourceFetch(src, question).catch(err => ({ source: src, error: err.message })))
      );

      const trustedFacts = rawSourceResults.flatMap(result => {
        if (result.error || !result.content) return [];
        return extractMedicalFacts(result.content, result.source);
      });

      if (!trustedFacts.length) {
        return res.status(502).json({ error: 'Unable to retrieve trusted medical evidence at this time.' });
      }

      const evidence = trustedFacts
        .sort((a, b) => b.confidence - a.confidence)
        .slice(0, 10)
        .map((fact, index) => `${index + 1}. [${fact.source}] ${stripUrls(fact.text)}`)
        .join('\n');

      const aiPrompt = `You are a senior clinical reasoning assistant. Answer the user using ONLY the following approved trusted medical sources: NHI, NICE, PubMed, NHS, CDC, WHO, Mayo Clinic, and Google snippets. Do not use any other sources. Use the internal disease summary only to support reasoning. Do not include external URLs. Focus on clinical reasoning, ranking likely conditions, and safety advice.

Approved trusted sources:
${sources.join(', ')}

Internal disease database context:
${diseaseContext}

Trusted medical evidence extracted from those sources:
${evidence}

User message: ${question}

Answer:`;

      const aiResponse = await callAILogic(aiPrompt);
      const safeAnswer = stripUrls(aiResponse).trim();

      return res.json({ answer: safeAnswer, topic: normalized.topic, voice });
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;
