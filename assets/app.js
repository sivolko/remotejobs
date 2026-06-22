/* ===========================================================
   REMOTE//INDEX — app logic
   Loads data/companies.json, renders faceted filters
   (category / location / company type) + a live search,
   and re-numbers the ledger as filters change.
   =========================================================== */

(function () {
  "use strict";

  const CATEGORY_COLORS = {
    "Developer Tools & Infrastructure": "#2563EB",
    "Cloud & DevOps": "#0891B2",
    "Cybersecurity": "#DC2626",
    "Blockchain & Crypto": "#65A30D",
    "FinTech": "#7C3AED",
    "Marketing & Sales SaaS": "#4338CA",
    "Productivity & Collaboration": "#C026D3",
    "EdTech": "#0EA5E9",
    "AI & Data": "#EA580C",
    "E-commerce & Retail": "#B45309",
    "Consulting & IT Services": "#475569",
    "Gaming & Media": "#E11D48",
    "Travel & Hospitality": "#92400E",
    "HealthTech": "#DB2777"
  };
  const DEFAULT_DOT = "#5C6B66";

  const FACETS = [
    { key: "category", el: "list-category" },
    { key: "location", el: "list-location" },
    { key: "companyType", el: "list-companyType" }
  ];

  const state = {
    all: [],
    search: "",
    sort: "index",
    selected: { category: new Set(), location: new Set(), companyType: new Set() }
  };

  const $ = (sel) => document.querySelector(sel);

  function dotColor(category) {
    return CATEGORY_COLORS[category] || DEFAULT_DOT;
  }

  function matchesFacetsExcept(item, exceptKey) {
    for (const f of FACETS) {
      if (f.key === exceptKey) continue;
      const set = state.selected[f.key];
      if (set.size && !set.has(item[f.key])) return false;
    }
    return true;
  }

  function matchesSearch(item) {
    if (!state.search) return true;
    const q = state.search.toLowerCase();
    return (
      item.name.toLowerCase().includes(q) ||
      item.category.toLowerCase().includes(q) ||
      item.location.toLowerCase().includes(q) ||
      item.companyType.toLowerCase().includes(q) ||
      item.region.toLowerCase().includes(q) ||
      item.blurb.toLowerCase().includes(q)
    );
  }

  function fullyMatches(item) {
    for (const f of FACETS) {
      const set = state.selected[f.key];
      if (set.size && !set.has(item[f.key])) return false;
    }
    return matchesSearch(item);
  }

  function getVisible() {
    let list = state.all.filter(fullyMatches);
    if (state.sort === "name") {
      list = list.slice().sort((a, b) => a.name.localeCompare(b.name));
    }
    return list;
  }

  function countActiveFilters() {
    return FACETS.reduce((n, f) => n + state.selected[f.key].size, 0) + (state.search ? 1 : 0);
  }

  function renderFacets() {
    for (const f of FACETS) {
      const container = document.getElementById(f.el);
      container.innerHTML = "";

      // counts computed against everything EXCEPT this facet group (and search),
      // so picking a value in another group narrows these counts live.
      const counts = new Map();
      state.all.forEach((item) => {
        if (!matchesFacetsExcept(item, f.key) || !matchesSearch(item)) return;
        counts.set(item[f.key], (counts.get(item[f.key]) || 0) + 1);
      });

      const values = Array.from(new Set(state.all.map((i) => i[f.key]))).sort(
        (a, b) => a.localeCompare(b)
      );

      values.forEach((value) => {
        const count = counts.get(value) || 0;
        const isSelected = state.selected[f.key].has(value);
        const isDisabled = count === 0 && !isSelected;
        const id = `facet-${f.key}-${value.replace(/\W+/g, "-")}`;
        const row = document.createElement("label");
        row.className = "facetRow" + (isDisabled ? " isDisabled" : "");
        row.setAttribute("for", id);

        const cb = document.createElement("input");
        cb.type = "checkbox";
        cb.id = id;
        cb.checked = isSelected;
        cb.disabled = isDisabled;
        cb.addEventListener("change", () => {
          if (cb.checked) state.selected[f.key].add(value);
          else state.selected[f.key].delete(value);
          renderAll();
        });

        row.appendChild(cb);

        if (f.key === "category") {
          const dot = document.createElement("span");
          dot.className = "facetDot";
          dot.style.background = dotColor(value);
          row.appendChild(dot);
        }

        const label = document.createElement("span");
        label.className = "facetLabel";
        label.textContent = value;
        row.appendChild(label);

        const countEl = document.createElement("span");
        countEl.className = "facetCount";
        countEl.textContent = count;
        row.appendChild(countEl);

        container.appendChild(row);
      });
    }

    const badge = $("#activeFilterBadge");
    const n = countActiveFilters();
    badge.hidden = n === 0;
    badge.textContent = n;
  }

  function renderRows() {
    const visible = getVisible();
    const rowsEl = $("#rows");
    const emptyEl = $("#emptyState");
    rowsEl.innerHTML = "";

    $("#resultsCount").textContent = `Showing ${visible.length} of ${state.all.length} companies`;

    if (!visible.length) {
      emptyEl.hidden = false;
      return;
    }
    emptyEl.hidden = true;

    const frag = document.createDocumentFragment();
    visible.forEach((item, i) => {
      const row = document.createElement("div");
      row.className = "row";
      row.setAttribute("role", "listitem");

      const idx = document.createElement("div");
      idx.className = "rowIndex";
      idx.textContent = String(i + 1).padStart(3, "0");
      row.appendChild(idx);

      const main = document.createElement("div");
      main.className = "rowMain";

      const link = document.createElement("a");
      link.className = "rowName";
      link.href = item.website;
      link.target = "_blank";
      link.rel = "noopener";
      link.innerHTML = `${escapeHtml(item.name)} <span class="arrow">↗</span>`;
      main.appendChild(link);

      const blurb = document.createElement("p");
      blurb.className = "rowBlurb";
      blurb.textContent = item.blurb;
      main.appendChild(blurb);

      row.appendChild(main);

      const tags = document.createElement("div");
      tags.className = "rowTags";

      const catTag = document.createElement("span");
      catTag.className = "tagCategory";
      catTag.innerHTML = `<span class="facetDot" style="background:${dotColor(
        item.category
      )}"></span>${escapeHtml(item.category)}`;
      tags.appendChild(catTag);

      const metaTag = document.createElement("span");
      metaTag.className = "tagMeta";
      metaTag.textContent = `${item.location} · ${item.companyType}`;
      tags.appendChild(metaTag);

      if (item.status === "broken" || item.status === "unreachable" || item.status === "changed") {
        const statusTag = document.createElement("span");
        statusTag.className = "tagStatus tagStatus-" + item.status;
        statusTag.textContent =
          item.status === "changed" ? "↻ site changed" : "⚠ link check failed";
        statusTag.title = item.lastChecked ? `Last checked ${item.lastChecked}` : "";
        tags.appendChild(statusTag);
      }

      row.appendChild(tags);
      frag.appendChild(row);
    });
    rowsEl.appendChild(frag);
  }

  function escapeHtml(str) {
    return str.replace(/[&<>"']/g, (c) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    }[c]));
  }

  function renderAll() {
    renderFacets();
    renderRows();
  }

  function wireStaticControls() {
    $("#searchInput").addEventListener("input", (e) => {
      state.search = e.target.value.trim();
      renderAll();
    });

    $("#sortSelect").addEventListener("change", (e) => {
      state.sort = e.target.value;
      renderRows();
    });

    const clearAll = () => {
      FACETS.forEach((f) => state.selected[f.key].clear());
      state.search = "";
      $("#searchInput").value = "";
      renderAll();
    };
    $("#clearFilters").addEventListener("click", clearAll);
    $("#emptyClear").addEventListener("click", clearAll);

    const rail = $("#rail");
    const scrim = $("#scrim");
    const toggle = $("#filtersToggle");
    const openRail = () => {
      rail.classList.add("isOpen");
      scrim.hidden = false;
      toggle.setAttribute("aria-expanded", "true");
    };
    const closeRail = () => {
      rail.classList.remove("isOpen");
      scrim.hidden = true;
      toggle.setAttribute("aria-expanded", "false");
    };
    toggle.addEventListener("click", () => {
      rail.classList.contains("isOpen") ? closeRail() : openRail();
    });
    scrim.addEventListener("click", closeRail);
  }

  async function init() {
    wireStaticControls();
    try {
      const res = await fetch("data/companies.json");
      state.all = await res.json();
    } catch (err) {
      $("#rows").innerHTML =
        '<p style="padding:20px;color:var(--muted)">Could not load company data. Open this page over a local server instead of file:// (e.g. <code>python3 -m http.server</code>), or check data/companies.json.</p>';
      return;
    }
    $("#totalCount").textContent = state.all.length;
    renderLastVerified();
    renderAll();
  }

  function renderLastVerified() {
    const dates = state.all.map((c) => c.lastChecked).filter(Boolean);
    const note = $("#lastVerifiedNote");
    if (!dates.length) {
      note.hidden = true;
      return;
    }
    const latest = dates.sort().slice(-1)[0];
    note.hidden = false;
    note.textContent = `Links checked daily · last run ${latest}`;
  }

  init();
})();
