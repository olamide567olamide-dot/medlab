Trusted-source reasoning proxy

Overview
- backend/trusted_proxy.js: Express proxy that queries a whitelist of trusted sources, extracts medically relevant facts, and prepares a prompt for your AI chain.
- backend/extractors.js: Source-specific fetchers (PubMed, WHO, CDC, Google, NHS, NICE, MayoClinic, NHI placeholder).
- backend/validator.js: Simple heuristics to validate and extract facts and remove links.

How it works
1. Frontend POSTs { question } to `/api/trusted-query`.
2. Server fetches data from allowed sources (server-side only), extracts relevant sentences, and builds an evidence block.
3. Server updates the AI prompt to include only extracted facts and calls your AI completion endpoint (`LOCAL_AI_ENDPOINT`).
4. Server strips any URLs from the returned answer and sends `{ answer }` back to the frontend. The frontend should display the answer inside the app UI.

Integration
- Set environment variables from `.env.example`.
- Ensure `LOCAL_AI_ENDPOINT` points to your existing AI reasoning service that accepts a `prompt` and returns a `completion` or `answer`.
- Do NOT return source URLs to users. If you need to audit provenance, log locally (server-side) for compliance but never expose links to the user-facing response.

Security notes
- Keep API keys in environment variables. Do not commit secrets.
- Rate-limit queries and cache results where possible.
- For sources that require a license or prohibit scraping (Mayo Clinic, NICE, NHS), prefer official dataset downloads or API access and respect terms of service.

Next steps
- Wire `callLocalAI` in `trusted_proxy.js` to your AI backend.
- Optionally add caching (Redis) and request quotas per-user.
