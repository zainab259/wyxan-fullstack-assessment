# 4–5 minute walkthrough

**0:00–0:25 — Introduction**  
“This is The Small Web, a fictional web of pages stored in MongoDB and a browser implemented with Next.js and NestJS. Readers choose a name; there are no accounts or roles. I’ll show the pages, navigation, search, publishing, and the isolation used for submitted HTML.”

**0:25–1:10 — Browse four pages**  
Choose Avery and enter `nature.zz`. Follow the links to `science.zz`, `books.zz`, and `music.zz`. Point out that the address bar follows the link and each successful arrival appears in Avery’s history. Try the intentionally broken `madeup.zz` link if time permits.

**1:10–1:55 — Back, Forward, and restoration**  
Press Back twice to return to `science.zz`, then Forward once to `books.zz`. Explain that each entry stores a page snapshot, and the active stack has a current position. Go Back and enter `travel.zz` to show that the old forward branch is discarded. Mention that a later edit to a site does not replace an earlier entry’s saved snapshot.

**1:55–2:35 — Search and return**  
Search for “tide pools” or “observatory”. Open a result, then press Back to return to the same captured results. Explain that search checks the title and extracted readable prose, rather than searching HTML tags.

**2:35–3:15 — Publish**  
Choose Publish and add a new `.zz` address, a title, and simple HTML such as `<h1>Garden notes</h1><p>Bees visit the lavender at noon.</p>`. Publish and open it. Explain that the selected reader becomes its author, duplicate addresses return a conflict, and the new content can be searched.

**3:15–3:45 — Missing address and people**  
Try `nowhere.zz` and show the missing-page state. Change the selected reader and show that the history and active navigation session are separate.

**3:45–4:35 — Data and security**  
“MongoDB holds users, sites, and visits. Visit records include a person, address, timestamp, and navigation method. Published HTML is displayed in an iframe with a sandbox that omits same-origin and top-navigation privileges. The display removes script elements and refresh tags; a strict CSP blocks event-handler scripts, external connections, and embedded resources. A small nonce-authorized bridge reports only valid fictional link addresses to the parent browser. This keeps the parent application isolated, while the allowed page authoring format intentionally excludes scripts, images, external resources, and forms.”

**4:35–4:55 — Scope**  
“I left out authentication, roles, tabs, bookmarks, downloads, hosted assets, and real internet browsing because the assessment describes a small simulated web. The source, seed command, and run commands are in the repository.”
