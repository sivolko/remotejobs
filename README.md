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
├── index.html          # markup + filter rail + ledger
├── assets/
│   ├── style.css        # design tokens + layout
│   └── app.js            # data loading, filtering, rendering
├── data/
│   └── companies.json   # the dataset (104 companies)
└── LICENSE
```

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
  "blurb": "Builds the container platform most dev teams use to ship software."
}
```

`category` drives the colored facet dot — see `CATEGORY_COLORS` in `assets/app.js` if you add a new category and want it color-coded.

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
