# Remote//Index

A filterable directory of remote-friendly tech companies — browse by **category**, **location**, and **company type**, with live search and faceted counts. Static site, no build step, no framework.

Inspired by [A-Hemeda/Remote-Jobs-List](https://github.com/A-Hemeda/Remote-Jobs-List), reshaped from a single markdown table into a faceted, searchable index with a curated dataset.

**Live demo:** `https://sivolko.github.io/remotejobs/` (enable GitHub Pages first — see below)

## Features

- **Facets**: Category, Location, Company type — each checkbox shows a live count based on the other active filters.
- **Search**: matches name, category, location, company type, and the one-line blurb.
- **Sort**: by index or name (A–Z).
- **Responsive**: filter rail collapses into a mobile drawer under 880px.
- **Accessible**: real checkboxes/labels, visible focus rings, `prefers-reduced-motion` respected.
- **No dependencies**: vanilla HTML/CSS/JS + Google Fonts (IBM Plex Mono/Sans). Works from any static host.

## Project structure

```
.
├── index.html               # markup + filter rail + ledger
├── assets/
│   ├── style.css             # design tokens + layout
│   └── app.js                  # data loading, filtering, rendering
├── data/
│   ├── companies.json        # the dataset (104 companies)
│   └── flags.json              # written daily by the freshness check
├── scripts/
│   └── freshness-check.mjs   # daily link/content check, no dependencies
├── .github/workflows/
│   └── freshness-check.yml   # cron + manual trigger, opens an issue on flags — add this one yourself, see note below
└── LICENSE
```

## Daily freshness check

> **Setup note:** GitHub blocks third-party apps from writing to `.github/workflows/` directly (a permissions scope only repo admins/direct git pushes have). The workflow file couldn't be pushed automatically — add it yourself, see below.

A GitHub Actions workflow (`.github/workflows/freshness-check.yml`) runs once a day and:

1. Visits each company's own `website` URL (no third-party APIs, no upstream repo — your data is the source).
2. Records `lastChecked`, `status` (`ok` / `changed` / `broken` / `unreachable`), and a content hash per company in `data/companies.json`.
3. Commits the update if anything changed.
4. Opens or updates a single GitHub issue (label `freshness-check`) listing flagged companies, and closes it automatically once everything's clear.

This keeps the *existing* list honest (dead links, sites that changed) — it doesn't discover new companies, since that needs either a live feed or manual curation. New entries still come in via PR (see Contributing below).

Run it manually: **Actions → Daily freshness check → Run workflow**. Trigger it locally with `node scripts/freshness-check.mjs`.

Some sites with bot protection will false-positive as `broken`/`unreachable` — treat flags as a prompt to check, not as ground truth.

## Data schema

Each entry in `data/companies.json`:

```json
{
  "id": "docker",
  "name": "Docker",
  "website": "https://www.docker.com",
  "category": "Developer Tools & Infrastructure",
  "location": "North America",
  "companyType": "Enterprise",
  "region": "United States only",
  "blurb": "Builds the container platform most dev teams use to ship software.",
  "lastChecked": "2026-06-23",
  "status": "ok",
  "contentHash": "8f2909675c5e1c57"
}
```

`category` drives the colored facet dot — see `CATEGORY_COLORS` in `assets/app.js` if you add a new category and want it color-coded. `lastChecked`/`status`/`contentHash` are managed by the freshness-check workflow — leave them out when adding a new company by hand; the next daily run fills them in.

## Run locally

No build step. Just serve the folder (fetch() needs http, not file://):

```bash
git clone https://github.com/sivolko/remotejobs.git
cd remotejobs
python3 -m http.server 8080
# open http://localhost:8080
```

## Deploy on GitHub Pages

1. Repo **Settings → Pages**
2. Source: **Deploy from a branch**
3. Branch: **main**, folder: **/ (root)**
4. Save — the site publishes at `https://<username>.github.io/<repo>/`

## Contributing

Add a company by appending an object to `data/companies.json` following the schema above. Keep `blurb` to one factual sentence. Open a PR — no other code changes needed for a data-only addition.

## Credit

Company list curated in the spirit of [A-Hemeda/Remote-Jobs-List](https://github.com/A-Hemeda/Remote-Jobs-List). Verify each company's current remote policy and openings directly before applying — directories age faster than hiring pages.

## License

MIT — see [LICENSE](LICENSE).
