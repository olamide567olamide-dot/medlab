const express = require('express');
const { body, validationResult } = require('express-validator');
const { trustedSourceFetch } = require('../utils/sourceFetch');
const { extractMedicalFacts, stripUrls } = require('../utils/medicalUtils');
const { callAILogic } = require('../utils/aiLogic');

const router = express.Router();

const ALLOWED_SOURCES = ['NHI', 'NICE', 'PubMed', 'NHS', 'CDC', 'WHO', 'MayoClinic', 'Google'];

router.post(
  '/trusted-query',
  body('question').trim().isLength({ min: 10, max: 500 }).escape(),
  body('sources').optional().isArray({ max: 8 }),
  body('sources.*').isIn(ALLOWED_SOURCES),
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

      const question = req.body.question;
      const sources = req.body.sources && req.body.sources.length ? req.body.sources : ALLOWED_SOURCES;

      const rawSourceResults = await Promise.all(
        sources.map(src => trustedSourceFetch(src, question).catch(err => ({ source: src, error: err.message })))
      );

      const validatedFacts = rawSourceResults.flatMap(result => {
        if (result.error || !result.content) return [];
        return extractMedicalFacts(result.content, result.source);
      });

      if (!validatedFacts.length) {
        return res.status(502).json({ error: 'No medically relevant trusted data available for this question.' });
      }

      const evidence = validatedFacts
        .slice(0, 12)
        .map((fact, index) => `${index + 1}. [${fact.source}] ${stripUrls(fact.text)}`)
        .join('\n');

      const prompt = `You are a responsible medical assistant. Use ONLY the evidence below to answer the user question. Do not invent new information and do not include external source links.

Evidence:
${evidence}

User question: ${question}

Answer:`;

      const answer = await callAILogic(prompt);
      const safeAnswer = stripUrls(answer).trim();

      return res.json({ answer: safeAnswer });
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;
