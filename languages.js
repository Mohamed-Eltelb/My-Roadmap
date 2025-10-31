import { languageIcons, languageInfo } from "./languagesData.js";

// Minimal theme setup (reuse storage key and [data-theme] convention)
const themeToggle = document.getElementById("themeToggle");
function applyTheme(theme) {
  const root = document.documentElement;
  root.setAttribute("data-theme", theme === "dark" ? "dark" : "light");
  if (themeToggle) {
    const isDark = theme === "dark";
    themeToggle.setAttribute("aria-pressed", String(isDark));
    themeToggle.title = isDark ? "Switch to light mode" : "Switch to dark mode";
  }
}
function getPreferredTheme() {
  const stored = localStorage.getItem("theme");
  if (stored === "light" || stored === "dark") return stored;
  const prefersDark =
    window.matchMedia &&
    window.matchMedia("(prefers-color-scheme: dark)").matches;
  return prefersDark ? "dark" : "light";
}
(function setupTheme() {
  applyTheme(getPreferredTheme());
  if (themeToggle) {
    themeToggle.addEventListener("click", () => {
      const current =
        document.documentElement.getAttribute("data-theme") === "dark"
          ? "dark"
          : "light";
      const next = current === "dark" ? "light" : "dark";
      applyTheme(next);
      try {
        localStorage.setItem("theme", next);
      } catch (_) {}
    });
  }
  if (window.matchMedia) {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = (e) => {
      const stored = localStorage.getItem("theme");
      if (stored !== "light" && stored !== "dark")
        applyTheme(e.matches ? "dark" : "light");
    };
    media.addEventListener
      ? media.addEventListener("change", onChange)
      : media.addListener(onChange);
  }
})();

// Alias mapping similar to main page for icon resolution
const aliasMap = {
  "react.js": "react",
  reactjs: "react",
  "react native": "react-native",
  next: "nextjs",
  "next.js": "nextjs",
  nuxt: "nuxtjs",
  "nuxt.js": "nuxtjs",
  solid: "solidjs",
  three: "threejs",
  d3: "d3js",
  "node.js": "node",
  nodejs: "node",
  ts: "typescript",
  js: "javascript",
  postgres: "postgresql",
  postgre: "postgresql",
  mongo: "mongodb",
  sqlite3: "sqlite",
  tailwindcss: "tailwind",
  "material-ui": "materialui",
  mui: "materialui",
  cpp: "c++",
  csharp: "c#",
  "f#": "fsharp",
  "objective c": "objective-c",
  dotnet: ".net",
  "asp.net": "aspnet",
};
function iconFor(key) {
  if (!key) return languageIcons.general ?? "";
  const norm = String(key).trim().toLowerCase();
  if (languageIcons[norm]) return languageIcons[norm];
  const aliased = aliasMap[norm];
  if (aliased && languageIcons[aliased]) return languageIcons[aliased];
  return languageIcons.general ?? "";
}

// Group by section and sort
const groups = new Map();
for (const [key, info] of Object.entries(languageInfo)) {
  const section = (info.section || "Other").trim();
  if (!groups.has(section)) groups.set(section, []);
  groups.get(section).push({ key, ...info });
}
const sortedSections = Array.from(groups.keys()).sort((a, b) =>
  a.localeCompare(b)
);

// Build a slug/id map for sections
const sectionIdMap = new Map();
function slugify(label) {
  return label
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}
for (const s of sortedSections) {
  const base = slugify(s);
  let id = `sec-${base || "section"}`;
  let i = 2;
  while ([...sectionIdMap.values()].includes(id)) {
    id = `sec-${base}-${i++}`;
  }
  sectionIdMap.set(s, id);
}

const container = document.getElementById("catalogContainer");
const sectionsNav = document.getElementById("sectionsNav");
function cardTemplate(item) {
  const icon = iconFor(item.key);
  const name = item.name || item.key;
  const desc = item.description || "No description available.";
  const type = item.type || "";
  const learnHref = `${window.location.origin}/learn/${encodeURIComponent(
    item.key
  )}`;
  return `
        <article class="catalog-card" data-key="${item.key}">
          <div class="catalog-header">
            <div class="item-icon">${icon}</div>
            <div class="catalog-titles">
              <h3 class="item-name">${name}</h3>
              ${type ? `<span class="item-type">${type}</span>` : ""}
            </div>
          </div>
          <p class="item-desc">${desc}</p>
          <div class="catalog-actions">
            <a class="btn btn-outline" href="${
              item.resources[0].docs
            }" target="_blank" rel="noopener noreferrer">
            View resources
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path fill="currentColor" fill-rule="evenodd" d="M13.47 5.47a.75.75 0 0 1 1.06 0l6 6a.75.75 0 0 1 0 1.06l-6 6a.75.75 0 1 1-1.06-1.06l4.72-4.72H4a.75.75 0 0 1 0-1.5h14.19l-4.72-4.72a.75.75 0 0 1 0-1.06" clip-rule="evenodd"/></svg>
            </a>
          </div>
        </article>
      `;
}

// Render sections nav
if (sectionsNav) {
  sectionsNav.innerHTML = sortedSections
    .map((s) => {
      const id = sectionIdMap.get(s);
      return `<a class="section-link" href="#${id}" data-target="${id}">${s}</a>`;
    })
    .join("");
}

// Render sections
for (const section of sortedSections) {
  const items = groups
    .get(section)
    .slice()
    .sort((a, b) => (a.name || a.key).localeCompare(b.name || b.key));
  const sectionEl = document.createElement("section");
  sectionEl.className = "catalog-section";
  sectionEl.id = sectionIdMap.get(section);
  sectionEl.innerHTML = `
        <div class="section-header">
          <h2>${section}</h2>
          <span class="count">${items.length}</span>
        </div>
        <div class="catalog-grid">
          ${items.map(cardTemplate).join("")}
        </div>
      `;
  container.appendChild(sectionEl);
}

// Active link sync with scrolling (deterministic, top-anchored)
if (sectionsNav) {
  const links = Array.from(sectionsNav.querySelectorAll(".section-link"));
  const linkById = new Map(links.map((a) => [a.dataset.target, a]));
  const sectionEls = sortedSections
    .map((s) => document.getElementById(sectionIdMap.get(s)))
    .filter(Boolean);

  let currentActive = null;
  let rafScheduled = false;

  function setActive(id) {
    if (!id || id === currentActive) return;
    links.forEach((l) => l.classList.remove("active"));
    const link = linkById.get(id);
    if (link) {
      link.classList.add("active");
      scrollNavToLink(link);
    }
    currentActive = id;
  }

  // Keep the active nav button visible (and roughly centered) in a horizontal nav
  function scrollNavToLink(link, smooth = true) {
    if (!sectionsNav || !link) return;
    const nav = sectionsNav;
    // Calculate target scrollLeft to center the link
    const target = link.offsetLeft - (nav.clientWidth - link.offsetWidth) / 2;
    const clamped = Math.max(
      0,
      Math.min(target, nav.scrollWidth - nav.clientWidth)
    );
    if (Math.abs(nav.scrollLeft - clamped) > 4) {
      nav.scrollTo({ left: clamped, behavior: smooth ? "smooth" : "auto" });
    }
  }

  function setActiveByScroll() {
    const offset = 100; // match sticky header/nav height
    let candidate = sectionEls[0] ? sectionEls[0].id : null;
    for (const el of sectionEls) {
      const top = el.getBoundingClientRect().top;
      if (top - offset <= 0) candidate = el.id;
      else break;
    }
    setActive(candidate);
  }

  // rAF-throttled scroll spy
  window.addEventListener(
    "scroll",
    () => {
      if (rafScheduled) return;
      rafScheduled = true;
      requestAnimationFrame(() => {
        rafScheduled = false;
        setActiveByScroll();
      });
    },
    { passive: true }
  );

  // Allow horizontal scrolling of the sections nav using the mouse wheel
  sectionsNav.addEventListener(
    "wheel",
    (e) => {
      // If vertical scroll is dominant, translate it into horizontal scroll for the nav
      const horizontal = Math.abs(e.deltaX);
      const vertical = Math.abs(e.deltaY);
      if (vertical >= horizontal) {
        sectionsNav.scrollLeft += e.deltaY;
        e.preventDefault();
      } else if (horizontal > 0) {
        sectionsNav.scrollLeft += e.deltaX;
        e.preventDefault();
      }
    },
    { passive: false }
  );

  // Click: set active early (scroll will confirm)
  links.forEach((l) =>
    l.addEventListener("click", (e) => {
      const id = l.getAttribute("data-target");
      setActive(id);
      scrollNavToLink(l);
    })
  );

  // Initial state
  setActiveByScroll();
}

(function () {
  const btn = document.getElementById("scrollTopBtn");
  if (!btn) return;
  const showAt = 200; // px
  const onScroll = () => {
    if (window.scrollY > showAt) btn.classList.add("visible");
    else btn.classList.remove("visible");
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();
  btn.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
  
})();
