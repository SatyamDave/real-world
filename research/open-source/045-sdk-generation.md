# SDK generation from OpenAPI

- Date: 2026-10-11
- Area: open-source
- Confidence: medium. Prices and customer logos come from vendor pages opened today. The web-search budget ran out, so I could not cross-check with third-party comparisons, and several pages (Fern pricing, Speakeasy pricing) did not render.

## Answer

Use Stainless on its free tier for the Python and TypeScript SDKs, if the API stays under its free-plan limits. It is what the top AI API companies are shown using, and the output is Apache 2.0 and owned by us. Fall back to openapi-generator (Apache-2.0, free) or hey-api (MIT, TypeScript, plus a Python package) if we hit a paywall. Do not hand-write SDKs, and do not spend launch week comparing generators. The OpenAPI spec is the real deliverable.

## Findings

**Stainless.**
- Free plan: $0, up to 5 generators (SDK, docs site or MCP server), 5 seats, and an OpenAPI spec of up to 25 endpoints. Preview builds in CI: 100 a month. Private SDKs are in early access and free. [Stainless pricing](https://www.stainless.com/pricing)
- The Starter, Pro and Enterprise prices are not shown on the page. The FAQ also mentions a Business plan that is not in the tabs. Overage is charged per live SDK, endpoint and month.
- Generated SDKs are Apache 2.0 and owned by the customer, per the same FAQ.
- Languages on the home page: TypeScript, Python, Go, Java, Kotlin, Ruby, Terraform, C#, PHP. [Stainless home](https://www.stainless.com/)
- The pricing page names OpenAI, Cloudflare, Replicate, Lithic, Modern Treasury, MUX, Turbopuffer, Weights & Biases and Letta as case studies. Its logo wall includes Anthropic, Google DeepMind, Perplexity, Groq, LangChain, Together AI and Scale. This is the vendor's own claim.
- I could not confirm Stainless authorship from the SDK repos themselves. The openai-python and anthropic-sdk repos carry generated-looking files (`.stats.yml`, `api.md`) but never name Stainless. The Anthropic `.stats.yml` holds only `configured_endpoints: 309`. The OpenAI README says the SDK is "generated from our OpenAPI specification". [openai-python](https://github.com/openai/openai-python), [anthropic-sdk-typescript](https://github.com/anthropics/anthropic-sdk-typescript)
- Reference repos for what a good output looks like: openai-python has 31.8k stars (Apache-2.0). anthropic-sdk-python has 4.0k stars (MIT, Python 3.10+). anthropic-sdk-typescript has 2.1k stars (MIT, Node 20+, Deno, Bun, Workers).

**Speakeasy.** The pricing page shows only "Enterprise: tailored", and only for its MCP product. I could not get SDK prices. The CLI repo has 452 stars, with the license not stated on the page. Its languages are TypeScript, Python, Go, Java, C#, PHP, Ruby, Unity and Terraform. Customers shown: Google, Mistral, Cisco, Vercel, PlanetScale, Polar, MoonPay. The home page has a "Deploy for free" button, but I could not see its terms. [Speakeasy pricing](https://www.speakeasy.com/pricing), [repo](https://github.com/speakeasy-api/speakeasy), [home](https://www.speakeasy.com/)

**Fern.** The repo has 3.8k stars, Apache-2.0. The README lists TypeScript, Python, Java, Go, Ruby, PHP and C#, and the generator table adds Swift and Rust. Docs customers: ElevenLabs, LaunchDarkly, Hume AI. I could not load Fern's pricing or home page, so cost is unknown. [Fern repo](https://github.com/fern-api/fern)

**openapi-generator.** 26.8k stars, Apache-2.0, release 7.26.0, about 40 client targets. It has more than 5,000 open issues and 619 open PRs. OpenAPI 3.1 support is labelled beta. Minor releases carry breaking changes. The README tells you to review untrusted specs before generating. This is the fallback, but the output is less idiomatic than Stainless. That is general experience, not something I measured today. [openapi-generator](https://github.com/OpenAPITools/openapi-generator)

**hey-api.** MIT, 5.5k stars. Used by Vercel, PayPal, AWS and Autodesk per the README. TypeScript only for `openapi-ts`. A separate `openapi-python` package generates Python SDKs and Pydantic models. It has 20+ plugins (Zod, TanStack Query, Fetch, Axios). It is pre-1.0 and needs Node 22+, and the docs say to pin an exact version because breaking releases happen. Run it with `npx @hey-api/openapi-ts -i spec -o src/client`. [hey-api repo](https://github.com/hey-api/openapi-ts), [docs](https://heyapi.dev/openapi-ts/get-started)

## What it means for Real World

- For the product: the SDKs are the second API surface after `POST /v1/simulate`. Typed outputs, segments, ensemble spread and trace are the selling point, so the SDK types must come out clean. A generator will only be as good as the spec we feed it.
- For the engineering: we have 22 days. Write the spec first (from FastAPI or Hono, or by hand), generate Python and TypeScript only, and put generation in CI. Two SDKs at launch is enough. Streaming for 7-day runs and ensemble results is where generators go wrong, so test that path by hand. Do not add Go, Java or Ruby until someone asks.
- For the business: free tiers cover a launch-size API. The 25-endpoint cap fits us. Paid tiers are unpriced on the page, so assume a quote call before relying on them. We own the generated code, so leaving later costs only regeneration.

## Recommendations

1. Day 1-3: freeze the OpenAPI 3.1 spec for `/v1/simulate`, `/v1/forks`, `/v1/receipts`. Keep it under 25 endpoints. Owner: engineer.
2. Sign up for Stainless free. Generate Python and TypeScript from the spec and diff the typed outputs against what a PM expects in the docs. Timebox: one day.
3. In parallel, run `openapi-python` and `@hey-api/openapi-ts` on the same spec as the fallback and compare output size and type quality. Half a day.
4. Wire regeneration into CI so a spec change fails the build if the SDKs drift. Check generated code into the repo, with the spec as the single source of truth.
5. Hand-write only a thin quickstart (10 lines each) and one streaming example. Publish to PyPI and npm under a name we control before launch day.
6. Do not buy a paid tier before Oct 27. Revisit after YC, when endpoint count is known.

## Open questions

- Stainless Starter and Pro prices and overage rates. Ask sales or open the dashboard after signup.
- Whether Stainless generated the OpenAI and Anthropic SDKs. Likely, but unconfirmed here. Check each repo's CONTRIBUTING.md or the Stainless case studies.
- Fern and Speakeasy SDK pricing, and the Speakeasy license. Pages did not load.
- How each generator handles SSE streaming and polymorphic ensemble outputs. Only a test on our own spec will answer this.
- Star counts are as shown on GitHub on 2026-10-11 and will change.

## Sources

- [Stainless pricing](https://www.stainless.com/pricing), accessed 2026-10-11
- [Stainless home](https://www.stainless.com/), accessed 2026-10-11
- [Speakeasy pricing](https://www.speakeasy.com/pricing), accessed 2026-10-11
- [Speakeasy home](https://www.speakeasy.com/), accessed 2026-10-11
- [speakeasy-api/speakeasy](https://github.com/speakeasy-api/speakeasy), accessed 2026-10-11
- [fern-api/fern](https://github.com/fern-api/fern), accessed 2026-10-11
- [OpenAPITools/openapi-generator](https://github.com/OpenAPITools/openapi-generator), accessed 2026-10-11
- [hey-api/openapi-ts](https://github.com/hey-api/openapi-ts), accessed 2026-10-11
- [hey-api docs](https://heyapi.dev/openapi-ts/get-started), accessed 2026-10-11
- [openai/openai-python](https://github.com/openai/openai-python), accessed 2026-10-11
- [anthropics/anthropic-sdk-typescript](https://github.com/anthropics/anthropic-sdk-typescript), accessed 2026-10-11
- [anthropics/anthropic-sdk-python](https://github.com/anthropics/anthropic-sdk-python), accessed 2026-10-11
