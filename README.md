# Scholarship Radar

Bachelor's and master's scholarships for international students, where every single link goes to the page of the university or government that is actually giving the money.

That constraint is the whole project. Search for a scholarship today and you will spend most of your evening on sites that exist to sit between you and a university — reposting an award with a referral link, sometimes charging for the privilege, very often advertising something whose deadline passed eight months ago. This has none of them in it, and it cannot have: a URL that is not on a registered institution's own domain is rejected by the collector before it ever becomes a listing.

---

## What it does

**Links you straight to the source.** Every card opens the university's own page, in a new tab, on their own domain — shown on the card so you can see it before you click. Official government programmes get in too, on their own official domains, because a national scholarship agency publishing its own scheme *is* the primary source. Everything else is banned.

There is one deliberate exception, and it is labelled on the card rather than hidden. Hundreds of American public universities keep their whole scholarship catalogue on a tenant of a hosted platform — `<university>.academicworks.com` — and that tenant is the university's own system, the place the application is actually made, in the same way a company's job board can live on a hosted recruiting platform and still be that company's job board. Excluding those would delete those universities' funding from the index entirely, which helps nobody. A tenant only gets in when its subdomain resolves to an institution already in the registry, and the card says plainly whose system it is. The line is not the vendor; it is who the page belongs to and who takes a fee. Commercial recruitment agents that charge students for access to scholarships they could apply for directly are on the banned list by name.

**Only shows what you can still apply for.** A scholarship whose deadline has gone is not a scholarship, it is a history lesson. Deadlines are re-checked daily and anything closed drops off the main list. What is closed but real moves to its own page with the month it is expected to reopen, so nothing is lost and nothing is stale.

**Tells you what it is worth before you click.** Fully funded, full tuition, a percentage off, a fixed sum, living costs only, a fee waiver — and the awkward middle cases nobody else categorises, like an award that covers your first two years but not your third, or one that renews only if you keep a 3.0.

**Aims at ordinary applicants.** Most scholarship sites are a shop window for awards that go to people with a national prize and a research publication. This ranks by whether you could actually get it, using what the page itself says: how many awards exist, whether there is a plain grade bar or a lot of adjectives about exceptional candidates, and whether you are considered automatically or have to write essays. The genuinely elite ones are still in here, just not in front of you by default.

**Asks for your passport, and means it kindly.** Country restrictions are the commonest reason a promising scholarship turns out to be a dead end, and nobody thinks to check their own nationality against a list. Tell it once and the ones you cannot have stop appearing — and it says how many it hid, and will show them if you ask.

**Reads pages that are not in English.** A great many Chinese, German, Hungarian and Japanese universities publish their funding pages only in their own language, and every English-language aggregator quietly skips them. This reads them, extracts the facts, and puts them on an English card — then still sends you to the original.

**Quotes the page.** Nothing on a card is claimed unless a sentence on the official page says it. That sentence is on the card, and if the page does not state something, the card says "not stated" rather than guessing.

**Reads in Arabic.** The whole interface switches to Arabic and to a right-to-left layout, with Arabic type, Arabic country and month names, and copy written for Arabic readers rather than run through a translator — including the plural forms, which Arabic does five different ways depending on the number and which are the clearest possible tell that a page was machine translated.

What does not switch is the name of an award and the sentence quoted from the page it came from. Those are the institution's own words, and producing an Arabic version of a sentence a university never wrote would be inventing evidence — the one thing this project cannot do. So the card is Arabic and the quote is whatever the university published, marked as such.

**Remembers what you did.** Save, mark as preparing, submitted, heard back. Export the deadlines to your calendar. It all lives in your browser — there is no account, because there is no server.

---

## Using it

1. **Answer six questions** on the front page — level, nationality, where, subject, how much you need covered, roughly what your grades are. All optional except the first, and skipping one widens the search rather than narrowing it.
2. **Or just browse**, if you would rather poke at filters yourself. The questions and the filters write to the same place, so they can never disagree.
3. **Save what is worth an application.** The deadline comes with it.

On a phone, open it in Safari or Chrome and add it to your home screen. It then runs like an app and works offline.

---

## How the index is built

A scheduled job crawls a registry of around six thousand universities across forty-nine countries, plus a hand-checked list of government programmes.

**Finding the pages.** Sitemaps first, which is far and away the best route where one exists — it reaches funding pages buried four clicks deep that a link crawl would never see. Where there is no sitemap, a short list of the paths universities actually use, and failing that, links off the homepage and off whichever subdomain the international office lives on. That last one matters more than it sounds: Chinese universities put their international admissions on `iso.`, `isd.`, `sie.`, `istudy.` and a dozen other prefixes, and guessing `en.` finds barely half of them.

**Splitting the pages into awards.** Most university funding pages are not one scholarship, they are thirty, stacked in an accordion or a table under a single URL. Indexing that page as one record would be accurate and useless, so the extractor tries a series of splitters — hosted scholarship platforms first, then accordions, then tables, then headings — and takes the first that finds more than one award.

**Reading the facts.** Amounts, deadlines, levels, grade bars, whether there is a separate application, how many awards exist, which countries can apply. Each one is matched against the phrasings institutions really use, in each language, and each one keeps the sentence it was read from.

**Deciding what is still open.** Deliberately willing to call something closed on thin evidence. Showing a passed deadline as though it were live is the failure that makes every other scholarship site untrustworthy, and it is a worse mistake than omitting a listing.

**Being a good guest.** One request at a time per host, a real delay between them, robots.txt obeyed including its crawl delay, and a user agent that says plainly what this is and links to this page. Identifying honestly costs some coverage, because a number of sites block anything that admits to being automated. That trade is deliberate.

Institutions are crawled several at a time, which is not in tension with that: the rate limiting is per host, so each server still sees one request at a time with a gap between. Doing it strictly one institution after another was the first version and it does not survive a real registry — a university with no sitemap and no robots.txt makes forty requests that mostly time out, and there are thousands of those, so a full pass would never have finished. Speculative requests also get a shorter deadline than real ones, because a page that exists answers quickly or not at all.

### The repository never grows

The index is not committed. Each run fetches the currently published copy back from the live site, updates it, and republishes — so the collector has its memory (when each award was first seen, everything found on the days this run is not revisiting) without a single data commit ever entering git.

Data is published one file per country, with a content hash in the filename, and the site loads only the countries you are looking at.

---

## Running it locally

```
npm install
npm run registry     # builds the institution list, run occasionally
npm run collect      # crawls and writes public/data — takes a while
npm run dev
```

For a quick pass while developing, `node pipeline/index.mjs --cc=GB,IE --limit=10` crawls ten institutions from each of those countries, and `--probe` writes what it found without publishing anything.

Built with Vite, React, TypeScript, Tailwind and three.js. No backend, no database, no analytics, no third-party requests at runtime — the fonts are self-hosted for the same reason everything else is: a page that pulls an asset from someone else's CDN tells that CDN who is reading it, and nobody looking for a scholarship needs that.

---

## What it does not do

It does not have every scholarship in the world, and it is not trying to. Precision is worth more than volume here: a smaller list where every link is real and every deadline is live beats a huge one where a third of it wastes your afternoon. Universities that block automated visitors are listed as unreachable rather than quietly dropped, so you can see the gaps.

It does not rank you, score you, or read your CV. It has no opinion about whether you are a good candidate.

It does not know things the pages do not say. A lot of funding pages are vague about money, and where one is, the card says so instead of inventing a number.

## Licence

MIT.
