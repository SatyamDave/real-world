# Naming: "Real World" trademark, domains and SEO

- Date: 2026-10-11
- Area: product
- Confidence: low on trademark and SEO (the search budget ran out and the USPTO search tool needs a browser); medium on domains (checked directly with DNS, whois and HTTP)

## Answer

"Real World" is a bad primary brand. It is two common words, famous from MTV's "The Real World", used by a music label and studio, and the best domains are taken. We could not confirm USPTO records or Google rankings, so treat the trademark and SEO points as likely but unverified. Keep "Real World" as the product's working and spoken name, but launch on a distinctive brand or a qualified name (for example "Real World Sim") and clear it with a lawyer before the YC application on Nov 2.

## Findings

Trademark (could not verify the registry):
- The USPTO search page at tmsearch.uspto.gov loads only in a browser. A fetch returned an empty shell, so we have no record numbers, owners or classes. A web search was not possible this run (budget exhausted). This is the main gap.
- MTV's "The Real World" ran May 21, 1992 to Jan 4, 2017 on MTV, then 33rd season on Facebook Watch in 2019 (June 13 to Aug 29), then three Paramount+ "Homecoming" seasons in 2021-22. 33 seasons, 614 episodes. Paramount+ removed those seasons in 2023. [Wikipedia](https://en.wikipedia.org/wiki/The_Real_World_(TV_series)). Entertainment marks are usually registered in entertainment classes. That does not automatically block software, but it makes the phrase famous, and fame widens the "likelihood of confusion" argument.
- Real World Records (Peter Gabriel and WOMAD, 1989) and Real World Studios in Box, Wiltshire (also 1989) use the name in music. [Wikipedia](https://en.wikipedia.org/wiki/Real_World_Records). Music classes are far from forecasting software, so this is a lower risk.
- "RealWorld" is an unrelated open-source demo app project (a Medium.com clone in 100+ frameworks), 84.3k GitHub stars, with hosted API at api.realworld.show. [GitHub](https://github.com/gothinkster/realworld). Not a trademark risk, but it will crowd developer search for "realworld".
- From memory, not verified this run: the USPTO base application fee is $350 per class since Jan 18, 2025, and first examination takes many months. The fee pages returned 404 or 403 to us. A registration will not exist before the Oct 27 launch. We would be filing intent-to-use at best.

Domains (checked 2026-10-11 by DNS, whois and HTTP):
- realworld.com: registered 1997-07-29 at Network Solutions, expires 2033-07-28, status client transfer prohibited ([Verisign RDAP](https://rdap.verisign.com/com/v1/domain/realworld.com)). Nameservers are worldnic. The site refused our connection. Not realistically buyable.
- realworld.ai: registered 2017-12-16 at Namecheap, expires 2027-08-17. It is listed for sale on Spaceship with a "Make offer" form and a hidden minimum ([page](https://realworld.ai)). Price unknown. This is the one worth an anonymous offer.
- real-world.ai: whois returns "Domain not found". It appears unregistered. We have not confirmed the registry's premium pricing.
- realworld.io redirects to the RealWorld GitHub project. realworld.org, realworld.app, realworld.dev and realworld.world are all registered. real-world.com is registered (frei.net nameservers).
- realworldlabs.com is registered and serves "Realworld Labs", an existing business. realworldsim.com is registered (Namecheap nameservers); we did not see what it hosts.
- theworld.ai is for sale via PowerfulBrands.com ([page](https://theworld.ai)). Price unknown.

SEO (not measured):
- The exact phrase "real world" is a generic term, and the top results will be MTV, dictionaries and "real world" idioms. We expect "Real World AI" to be somewhat better but still contested, with the RealWorld repo and the Peter Gabriel label in the mix. We did not run a SERP check, so this is judgment, not data.

## What it means for Real World

- For the product: The name reads well in sentences ("fork the Real World"), which is a real asset. It reads badly as a search term and as a handle. Pick one canonical short form for the API, SDK package names and the site, and write it once in a shared constants file.
- For the engineering: Reserve package and org names now: npm and PyPI for the SDKs, the GitHub org, and the API host. Do not hard-code the brand in code paths. Put the display name and base URL in one config so a rename costs minutes.
- For the business: A YC application and a public launch under a name we may have to drop is a rework risk. A rename after Oct 27 loses the public hashed track record's brand, which is the moat. Decide the name before the first forecast hash is published.

## Recommendations

1. This week: run a real USPTO search for REAL WORLD in classes 9, 35, 36, 42 and 41 in a browser, and record owners and status in this repo. Owner: whoever has a browser. 30 minutes.
2. Pay a trademark lawyer for a one-hour knockout opinion on "Real World" and two alternates. Do this before Oct 27, not before Nov 2.
3. Make an anonymous offer on realworld.ai through the Spaceship form, with a cap decided in advance. Treat it as optional. If the ask is above the cap, walk away.
4. Register real-world.ai now if it is truly unregistered (confirm at a registrar), as a cheap hedge. Also grab a qualified name such as realworldsim.* if free.
5. Prepare two fallback names that carry the product meaning, for example a "world model" or "forecast" word, and check each (domain, USPTO, GitHub, npm) before Oct 20. Switch if the lawyer flags risk or if realworld.ai costs more than the cap.
6. Launch with a qualified brand ("Real World Sim" or similar) and the full phrase in copy, and use "realworld" only as a short handle. Avoid any MTV-style visuals or the "The Real World" phrasing.
7. File an intent-to-use application for the final name after the knockout search. Budget a few hundred dollars per class (unverified fee).

## Open questions

- Who owns REAL WORLD marks in software and forecasting classes? Find out with the USPTO search and a lawyer.
- What does realworld.ai cost? Find out by submitting an offer.
- Does anything in AI forecasting already call itself "Real World"? We did not get to search. Check Crunchbase, Product Hunt and Google News.
- How hard is "real world ai" on Google? Check with a keyword tool or a manual SERP review.
- What is on realworldsim.com and realworld.com? The first was not fetched; the second refused connections.

## Sources

- [The Real World (TV series), Wikipedia](https://en.wikipedia.org/wiki/The_Real_World_(TV_series)), accessed 2026-10-11
- [Real World Records, Wikipedia](https://en.wikipedia.org/wiki/Real_World_Records), accessed 2026-10-11
- [gothinkster/realworld, GitHub](https://github.com/gothinkster/realworld), accessed 2026-10-11
- [Verisign RDAP for realworld.com](https://rdap.verisign.com/com/v1/domain/realworld.com), accessed 2026-10-11
- [realworld.ai sale page (Spaceship)](https://realworld.ai), accessed 2026-10-11
- [theworld.ai](https://theworld.ai), accessed 2026-10-11
- [USPTO trademark search guidance](https://www.uspto.gov/trademarks/search), accessed 2026-10-11 (no fees or timelines on this page; USPTO search tool not usable by fetch)
- Local whois and DNS lookups for the listed domains, run 2026-10-11
