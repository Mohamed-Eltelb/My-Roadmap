import { languageIcons, languageInfo } from "./languagesData.js";

const icons = [];
const keys = Object.keys(languageIcons);

for (let i = 0; i < 4; i++) {
  let randomKey;

  do {
    randomKey = keys[Math.floor(Math.random() * keys.length)];
  } while (randomKey === "custom" || randomKey === "general");

  const icon = languageIcons[randomKey];
  icons.push(icon);
}

document.addEventListener("DOMContentLoaded", function () {
  // DOM Elements
  const roadmapItems = document.getElementById("roadmapItems");
  const emptyState = document.getElementById("emptyState");
  const addItemForm = document.getElementById("addItemForm");
  const itemForm = document.getElementById("itemForm");
  const languageSelect = document.getElementById("languageSelect");
  const languageSuggestions = document.getElementById("languageSuggestions");
  const progressFill = document.getElementById("progressFill");
  const progressPercent = document.getElementById("progressPercent");
  const addItemBtn = document.getElementById("addItemBtn");
  const themeToggle = document.getElementById("themeToggle");
  const addItemModal = document.getElementById("addItemModal");
  const errorLog = document.getElementById("errorLog");
  const closeModalBtn = document.getElementById("closeModalBtn");
  const languageIcon = document.querySelector(".language-icon");
  const searchInput = document.getElementById("searchInput");
  const changeViewBtn = document.getElementById("changeViewBtn");
  const exportRoadmapBtn = document.getElementById("exportRoadmapBtn");
  const exportFormattedRoadmapBtn = document.getElementById(
    "exportFormattedRoadmapBtn"
  );
  const swapModeBtn = document.getElementById("swapModeBtn");
  const hideCompletedBtn = document.getElementById("hideCompletedBtn");
  const completedStat = document.getElementById("completedStat");
  const inProgressStat = document.getElementById("inProgressStat");
  const totalItems = document.getElementById("totalItems");
  const completedItems = document.getElementById("completedItems");
  const inProgressItems = document.getElementById("inProgressItems");
  // Details modal elements
  const detailsModal = document.getElementById("detailsModal");
  const closeDetailsBtn = document.getElementById("closeDetailsBtn");
  const detailsTitle = document.getElementById("detailsTitle");
  const detailsIcon = document.getElementById("detailsIcon");
  const detailsName = document.getElementById("detailsName");
  const detailsMeta = document.getElementById("detailsMeta");
  const detailsBody = document.getElementById("detailsBody");
  const detailsLinks = document.getElementById("detailsLinks");
  const floatingIcons = document.getElementById("floatingIcons");
  const expectedDateInput = document.getElementById("itemExpectedDate");
  const customDatePicker = document.getElementById("customDate");
  let draggingId = null;
  let searchQuery = "";
  let defaultEmptyHTML = null;
  let editingItemId = null;
  let swapOnDrop = false;
  let hideCompleted = localStorage.getItem("hideCompleted") === "true" || false;

  // Data
  const STORAGE_KEY = "my-roadmap-items";
  let items = [];

  // Language icons mapping
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

  // Helper to resolve icon by language/framework name, with light normalization and aliases
  function iconForLanguage(name) {
    if (!name) return languageIcons.custom;
    const raw = String(name).trim();
    const key = raw.toLowerCase();
    if (languageIcons[key]) return languageIcons[key];

    const aliased = aliasMap[key];
    if (aliased && languageIcons[aliased]) return languageIcons[aliased];
    return languageIcons.custom;
  }

  document.addEventListener("keydown", (e) => {
    // Alt+N pressed
    if (e.altKey && !e.ctrlKey && !e.metaKey && e.key.toLowerCase() === "n") {
      // don't hijack while user types in text fields
      const active = document.activeElement;
      const typingTags = ["INPUT", "TEXTAREA"];
      if (
        active &&
        (typingTags.includes(active.tagName) || active.isContentEditable)
      )
        return;

      // don't hijack while user is editing an item
      if (editingItemId || addItemModal.classList.contains("open")) return;

      e.preventDefault();
      const btn = document.getElementById("addItemBtn");
      if (!btn) return;

      if (!btn.hasAttribute("tabindex")) btn.setAttribute("tabindex", "0");
      // btn.focus();
      btn.click();
    }
  });

  if (languageSelect)
    languageSelect.addEventListener("input", function () {
      const val = this.value;
      const icon = iconForLanguage(val);
      languageIcon.innerHTML = icon;
      languageSuggestions.innerHTML = "";
      if (!val) {
        languageSuggestions.style.display = "none";
        return;
      } else {
        languageSuggestions.style.display = "block";

        const suggestions = Object.entries(languageInfo)
          .filter(
            ([key, info]) =>
              info.name.toLowerCase().includes(val.toLowerCase()) &&
              key !== "custom" &&
              key !== "general"
          )
          .sort(([keyA, infoA], [keyB, infoB]) => {
            const nameA = infoA.name.toLowerCase();
            const nameB = infoB.name.toLowerCase();
            const search = val.toLowerCase();

            const aStarts = nameA.startsWith(search);
            const bStarts = nameB.startsWith(search);

            if (aStarts && !bStarts) return -1;
            if (!aStarts && bStarts) return 1;

            return nameA.localeCompare(nameB);
          })
          .map(([key]) => key); // return only the keys (same as before)

        if (suggestions.length === 0) {
          // languageSuggestions.style.display = "none";
          languageSuggestions.innerHTML =
            "<p class='no-suggestions'>Language not found</p>";
          return;
        }
        suggestions.forEach((suggestion) => {
          const icon = iconForLanguage(suggestion);
          const name = getLangName(suggestion);
          const div = document.createElement("div");
          div.classList.add("suggestion");
          div.innerHTML += `${icon} ${name || suggestion}`;
          div.addEventListener("click", () => {
            languageSelect.value = name || suggestion;
            languageSuggestions.innerHTML = "";
            languageSuggestions.style.display = "none";
            languageIcon.innerHTML = icon;
          });
          languageSuggestions.appendChild(div);
        });
      }
    });

  if (exportRoadmapBtn)
    exportRoadmapBtn.addEventListener("click", () => {
      const filteredItems = items.map(({ id, ...rest }) => rest);

      const dataStr = JSON.stringify(filteredItems, null, 2); // formatted JSON
      const blob = new Blob([dataStr], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      downloadFile(url);
    });

  exportFormattedRoadmapBtn.addEventListener("click", () => {
    // Convert each item into readable text
    const formatted = items
      .map(
        (item) =>
          `Name: ${item.title}\nLanguage: ${item.language}\nStatus: ${
            item.completed ? "Completed" : "In Progress"
          }`
      )
      .join("\n\n");

    const blob = new Blob([formatted], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    downloadFile(url);
  });

  function downloadFile(url) {
    const a = document.createElement("a");
    a.href = url;
    a.download = "Roadmap.txt";
    a.click();
    URL.revokeObjectURL(url);
  }

  // Initialize the app
  function init() {
    setupTheme();
    // Capture default empty state markup for later reuse
    if (emptyState && defaultEmptyHTML === null)
      defaultEmptyHTML = emptyState.innerHTML;
    // Load items (from storage or defaults)
    items = loadItems();

    renderItems();
    updateProgress();
    updateStats();
    if (roadmapItems) roadmapItems.setAttribute("role", "list");
    const savedView = localStorage.getItem("viewMode") || "list";
    updateBtnsStates(changeViewBtn, savedView !== "grid", "toggleView");
    updateBtnsStates(hideCompletedBtn, hideCompleted, "hideCompleted");

    if (savedView === "grid") {
      roadmapItems.classList.add("grid-view");
    } else {
      roadmapItems.classList.remove("grid-view");
    }

    // Open modal when Add Item button is clicked
    if (addItemBtn && addItemModal) {
      addItemBtn.addEventListener("click", function () {
        openAddModal();
      });
    }
    // Support hero CTA button(s)
    document.querySelectorAll("[data-open-add]").forEach((btn) => {
      btn.addEventListener("click", () => openAddModal());
    });

    // Handle form submission
    if (itemForm) {
      itemForm.addEventListener("submit", function (e) {
        e.preventDefault();
        addNewItem();
      });
    }
    // Language select toggle for custom name
    if (languageSelect) {
      languageSelect.addEventListener("change", function () {
        handleLanguageChange(this.value);
      });
      // Initialize visibility on load
      handleLanguageChange(languageSelect.value);
    }

    // Close modal events
    if (closeModalBtn) closeModalBtn.addEventListener("click", closeModal);
    if (addItemModal) {
      addItemModal.addEventListener("click", (e) => {
        if (e.target && e.target.hasAttribute("data-close")) closeModal();
      });
    }

    if (floatingIcons)
      floatingIcons.querySelectorAll(".bubble").forEach((b, i) => {
        b.innerHTML = icons[i];
      });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        if (isModalOpen()) closeModal();
        if (isDetailsOpen()) closeDetailsModal();
      }
    });

    // Close open menus on outside click
    document.addEventListener("click", (e) => {
      const target = e.target;
      if (!target.closest) return;
      const isMore = target.closest(".more-wrapper");
      if (!isMore) closeAllMoreMenus();
    });

    // Details modal close handlers
    if (closeDetailsBtn)
      closeDetailsBtn.addEventListener("click", closeDetailsModal);
    if (detailsModal) {
      detailsModal.addEventListener("click", (e) => {
        if (
          e.target &&
          e.target.hasAttribute &&
          e.target.hasAttribute("data-close")
        ) {
          closeDetailsModal();
        }
      });
    }

    // Search filter
    if (searchInput) {
      searchInput.addEventListener("input", (e) => {
        searchQuery = String(e.target.value || "")
          .trim()
          .toLowerCase();
        renderItems();
      });
    }

    const today = new Date();
    today.setDate(today.getDate() + 1);
    const minDate = today.toISOString().split("T")[0];
    expectedDateInput.min = minDate;

    document.getElementById("expandBtn").addEventListener("click", function () {
      this.parentElement.classList.toggle("expanded");
    });

    customDatePicker.addEventListener("click", () => {
      expectedDateInput.showPicker();
    });

    expectedDateInput.addEventListener("change", (e) => {
      let val = e.target.value;
      if (!val) {
        customDatePicker.querySelector("#customDateText").textContent =
          "MM/DD/YYYY";
        return;
      }
      const formatted = new Date(val).toLocaleDateString("en-US");

      customDatePicker.querySelector("#customDateText").textContent = formatted;
    });
  }

  // THEME: setup and toggle
  function applyTheme(theme) {
    const root = document.documentElement;
    if (theme === "dark") {
      root.setAttribute("data-theme", "dark");
      if (themeToggle) {
        themeToggle.setAttribute("aria-pressed", "true");
        themeToggle.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="currentColor" d="M17 12a5 5 0 1 1-10 0a5 5 0 0 1 10 0"/><path fill="currentColor" fill-rule="evenodd" d="M12 1.25a.75.75 0 0 1 .75.75v2a.75.75 0 0 1-1.5 0V2a.75.75 0 0 1 .75-.75M3.669 3.716a.75.75 0 0 1 1.06-.047L6.95 5.7a.75.75 0 1 1-1.012 1.107L3.716 4.776a.75.75 0 0 1-.047-1.06m16.662 0a.75.75 0 0 1-.047 1.06l-2.222 2.031A.75.75 0 0 1 17.05 5.7l2.222-2.031a.75.75 0 0 1 1.06.047M1.25 12a.75.75 0 0 1 .75-.75h2a.75.75 0 0 1 0 1.5H2a.75.75 0 0 1-.75-.75m18 0a.75.75 0 0 1 .75-.75h2a.75.75 0 0 1 0 1.5h-2a.75.75 0 0 1-.75-.75m-2.224 5.025a.75.75 0 0 1 1.06 0l2.222 2.223a.75.75 0 0 1-1.06 1.06l-2.222-2.222a.75.75 0 0 1 0-1.06m-10.051 0a.75.75 0 0 1 0 1.061l-2.223 2.222a.75.75 0 0 1-1.06-1.06l2.222-2.223a.75.75 0 0 1 1.06 0M12 19.25a.75.75 0 0 1 .75.75v2a.75.75 0 0 1-1.5 0v-2a.75.75 0 0 1 .75-.75" clip-rule="evenodd"/></svg>`;
        themeToggle.title = "Switch to light mode";
        themeToggle.setAttribute("aria-label", "Switch to light mode");
      }
    } else {
      root.setAttribute("data-theme", "light");
      if (themeToggle) {
        themeToggle.setAttribute("aria-pressed", "false");
        themeToggle.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="currentColor" d="M19.9 2.307a.483.483 0 0 0-.9 0l-.43 1.095a.48.48 0 0 1-.272.274l-1.091.432a.486.486 0 0 0 0 .903l1.091.432a.48.48 0 0 1 .272.273L19 6.81c.162.41.74.41.9 0l.43-1.095a.48.48 0 0 1 .273-.273l1.091-.432a.486.486 0 0 0 0-.903l-1.091-.432a.48.48 0 0 1-.273-.274zM16.033 8.13a.483.483 0 0 0-.9 0l-.157.399a.48.48 0 0 1-.272.273l-.398.158a.486.486 0 0 0 0 .903l.398.157c.125.05.223.148.272.274l.157.399c.161.41.739.41.9 0l.157-.4a.48.48 0 0 1 .272-.273l.398-.157a.486.486 0 0 0 0-.903l-.398-.158a.48.48 0 0 1-.272-.273z"/><path fill="currentColor" d="M12 22c5.523 0 10-4.477 10-10c0-.463-.694-.54-.933-.143a6.5 6.5 0 1 1-8.924-8.924C12.54 2.693 12.463 2 12 2C6.477 2 2 6.477 2 12s4.477 10 10 10"/></svg>`;
        themeToggle.title = "Switch to dark mode";
        themeToggle.setAttribute("aria-label", "Switch to dark mode");
      }
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

  function setupTheme() {
    const initial = getPreferredTheme();
    applyTheme(initial);
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

    // React to system changes if user hasn't set explicit choice
    if (window.matchMedia) {
      const media = window.matchMedia("(prefers-color-scheme: dark)");
      const onChange = (e) => {
        const stored = localStorage.getItem("theme");
        if (stored !== "light" && stored !== "dark") {
          applyTheme(e.matches ? "dark" : "light");
        }
      };
      if (media.addEventListener) media.addEventListener("change", onChange);
      else if (media.addListener) media.addListener(onChange);
    }
  }

  changeViewBtn.addEventListener("click", toggleView);

  hideCompletedBtn.addEventListener("click", () => {
    hideCompleted = !hideCompleted;
    localStorage.setItem("hideCompleted", hideCompleted);
    updateBtnsStates(hideCompletedBtn, hideCompleted, "hideCompleted");

    renderItems();
    updateStats();
    updateProgress();
  });

  function toggleView() {
    if (!roadmapItems) return;
    let isGridView = roadmapItems.classList.contains("grid-view");
    roadmapItems.classList.toggle("grid-view");
    localStorage.setItem("viewMode", isGridView ? "list" : "grid");
    // Update button icon
    updateBtnsStates(changeViewBtn, isGridView, "toggleView");
  }

  function updateBtnsStates(element, state, elName) {
    switch (elName) {
      case "toggleView":
        element.innerHTML = state
          ? `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path fill="currentColor" d="M8 5.5h8a3 3 0 0 0 3-3a.5.5 0 0 0-.5-.5h-13a.5.5 0 0 0-.5.5a3 3 0 0 0 3 3m-3 6c0-1.886 0-2.828.586-3.414S7.114 7.5 9 7.5h6c1.886 0 2.828 0 3.414.586S19 9.614 19 11.5v1c0 1.886 0 2.828-.586 3.414S16.886 16.5 15 16.5H9c-1.886 0-2.828 0-3.414-.586S5 14.386 5 12.5zm11 7H8a3 3 0 0 0-3 3a.5.5 0 0 0 .5.5h13a.5.5 0 0 0 .5-.5a3 3 0 0 0-3-3"/></svg>`
          : `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
          <path fill="currentColor"
              d="M2 6.5c0-2.121 0-3.182.659-3.841S4.379 2 6.5 2s3.182 0 3.841.659S11 4.379 11 6.5s0 3.182-.659 3.841S8.621 11 6.5 11s-3.182 0-3.841-.659S2 8.621 2 6.5m11 11c0-2.121 0-3.182.659-3.841S15.379 13 17.5 13s3.182 0 3.841.659S22 15.379 22 17.5s0 3.182-.659 3.841S19.621 22 17.5 22s-3.182 0-3.841-.659S13 19.621 13 17.5m-11 0c0-2.121 0-3.182.659-3.841S4.379 13 6.5 13s3.182 0 3.841.659S11 15.379 11 17.5s0 3.182-.659 3.841S8.621 22 6.5 22s-3.182 0-3.841-.659S2 19.621 2 17.5m11-11c0-2.121 0-3.182.659-3.841S15.379 2 17.5 2s3.182 0 3.841.659S22 4.379 22 6.5s0 3.182-.659 3.841S19.621 11 17.5 11s-3.182 0-3.841-.659S13 8.621 13 6.5" />
      </svg>`;
        break;
      case "hideCompleted":
        element.innerHTML = state
          ? '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path fill="currentColor" fill-rule="evenodd" d="M1.606 6.08a1 1 0 0 1 1.313.526L2 7l.92-.394v-.001l.003.009l.021.045l.094.194c.086.172.219.424.4.729a13.4 13.4 0 0 0 1.67 2.237a12 12 0 0 0 .59.592C7.18 11.8 9.251 13 12 13a8.7 8.7 0 0 0 3.22-.602c1.227-.483 2.254-1.21 3.096-1.998a13 13 0 0 0 2.733-3.725l.027-.058l.005-.011a1 1 0 0 1 1.838.788L22 7l.92.394l-.003.005l-.004.008l-.011.026l-.04.087a14 14 0 0 1-.741 1.348a15.4 15.4 0 0 1-1.711 2.256l.797.797a1 1 0 0 1-1.414 1.415l-.84-.84a12 12 0 0 1-1.897 1.256l.782 1.202a1 1 0 1 1-1.676 1.091l-.986-1.514c-.679.208-1.404.355-2.176.424V16.5a1 1 0 0 1-2 0v-1.544c-.775-.07-1.5-.217-2.177-.425l-.985 1.514a1 1 0 0 1-1.676-1.09l.782-1.203c-.7-.37-1.332-.8-1.897-1.257l-.84.84a1 1 0 0 1-1.414-1.414l.797-.797a15.4 15.4 0 0 1-1.87-2.519a14 14 0 0 1-.591-1.107l-.033-.072l-.01-.021l-.002-.007l-.001-.002v-.001C1.08 7.395 1.08 7.394 2 7l-.919.395a1 1 0 0 1 .525-1.314" clip-rule="evenodd"/></svg>'
          : '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path fill="currentColor" d="M9.75 12a2.25 2.25 0 1 1 4.5 0a2.25 2.25 0 0 1-4.5 0" /><path fill="currentColor" fill-rule="evenodd"d="M2 12c0 1.64.425 2.191 1.275 3.296C4.972 17.5 7.818 20 12 20s7.028-2.5 8.725-4.704C21.575 14.192 22 13.639 22 12c0-1.64-.425-2.191-1.275-3.296C19.028 6.5 16.182 4 12 4S4.972 6.5 3.275 8.704C2.425 9.81 2 10.361 2 12m10-3.75a3.75 3.75 0 1 0 0 7.5a3.75 3.75 0 0 0 0-7.5"clip-rule="evenodd" /></svg>';
        break;
      default:
        break;
    }
  }

  swapModeBtn.addEventListener("click", () => {
    swapOnDrop = !swapOnDrop;
    swapModeBtn.classList.toggle("active");
    // swapModeBtn.setAttribute("title", swapOnDrop ? "Swap on drop" : "Move on drop");
    // swapModeBtn.innerHTML = swapOnDrop
    //   ? '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path fill="currentColor" fill-rule="evenodd" d="M8.716 3.203a.7.7 0 0 1 .987 0l1.86 1.846c.2.198.26.496.151.754a.7.7 0 0 1-.644.428H9.21C5.997 6.23 3.394 8.814 3.394 12S6 17.77 9.21 17.77h.464c.386 0 .698.31.698.692a.695.695 0 0 1-.698.692H9.21C5.228 19.154 2 15.95 2 12s3.228-7.154 7.21-7.154h.175l-.669-.664a.69.69 0 0 1 0-.98m4.912 2.336c0-.382.312-.692.698-.692h.465C18.772 4.846 22 8.05 22 12s-3.228 7.154-7.21 7.154h-.175l.669.664a.69.69 0 0 1 0 .98a.7.7 0 0 1-.987 0l-1.86-1.847a.69.69 0 0 1-.151-.754a.7.7 0 0 1 .644-.428h1.86c3.212 0 5.815-2.583 5.815-5.769s-2.603-5.77-5.814-5.77h-.465a.695.695 0 0 1-.698-.692" clip-rule="evenodd"/><path fill="none" d="M5.488 12c0-2.04 1.666-3.692 3.721-3.692h5.582c2.055 0 3.72 1.653 3.72 3.692s-1.665 3.692-3.72 3.692H9.209c-2.055 0-3.72-1.653-3.72-3.692"/></svg>'
    //   : '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path fill="currentColor" fill-rule="evenodd" d="M8.716 3.203a.7.7 0 0 1 .987 0l1.86 1.846c.2.198.26.496.151.754a.7.7 0 0 1-.644.428H9.21C5.997 6.23 3.394 8.814 3.394 12S6 17.77 9.21 17.77h.464c.386 0 .698.31.698.692a.695.695 0 0 1-.698.692H9.21C5.228 19.154 2 15.95 2 12s3.228-7.154 7.21-7.154h.175l-.669-.664a.69.69 0 0 1 0-.98m4.912 2.336c0-.382.312-.692.698-.692h.465C18.772 4.846 22 8.05 22 12s-3.228 7.154-7.21 7.154h-.175l.669.664a.69.69 0 0 1 0 .98a.7.7 0 0 1-.987 0l-1.86-1.847a.69.69 0 0 1-.151-.754a.7.7 0 0 1 .644-.428h1.86c3.212 0 5.815-2.583 5.815-5.769s-2.603-5.77-5.814-5.77h-.465a.695.695 0 0 1-.698-.692" clip-rule="evenodd"/><path fill="currentColor" d="M5.488 12c0-2.04 1.666-3.692 3.721-3.692h5.582c2.055 0 3.72 1.653 3.72 3.692s-1.665 3.692-3.72 3.692H9.209c-2.055 0-3.72-1.653-3.72-3.692"/></svg>';
  });

  // swapModeBtn.addEventListener("click", () => {
  //   swapOnDrop = !swapOnDrop;
  //   swapModeBtn.setAttribute("title", swapOnDrop ? "Swap on drop" : "Move on drop");
  //   swapModeBtn.innerHTML = swapOnDrop
  //     ? '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path fill="currentColor" d="m20.312 12.647l.517-1.932c.604-2.255.907-3.382.68-4.358a4 4 0 0 0-1.162-2.011c-.731-.685-1.859-.987-4.114-1.591c-2.255-.605-3.383-.907-4.358-.68a4 4 0 0 0-2.011 1.162c-.587.626-.893 1.543-1.348 3.209l-.244.905l-.517 1.932c-.605 2.255-.907 3.382-.68 4.358a4 4 0 0 0 1.162 2.011c.731.685 1.859.987 4.114 1.592c2.032.544 3.149.843 4.064.73q.15-.019.294-.052a4 4 0 0 0 2.011-1.16c.685-.732.987-1.86 1.592-4.115"/><path fill="currentColor" d="M16.415 17.975a4 4 0 0 1-1.068 1.677c-.731.685-1.859.987-4.114 1.591s-3.383.907-4.358.679a4 4 0 0 1-2.011-1.161c-.685-.731-.988-1.859-1.592-4.114l-.517-1.932c-.605-2.255-.907-3.383-.68-4.358a4 4 0 0 1 1.162-2.011c.731-.685 1.859-.987 4.114-1.592q.638-.172 1.165-.309l-.244.906l-.517 1.932c-.605 2.255-.907 3.382-.68 4.358a4 4 0 0 0 1.162 2.011c.731.685 1.859.987 4.114 1.592c2.032.544 3.149.843 4.064.73" opacity="0.5"/></svg>'
  //     : '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path fill="currentColor" d="M8 5.5h8a3 3 0 0 0 3-3a.5.5 0 0 0-.5-.5h-13a.5.5 0 0 0-.5.5a3 3 0 0 0 3 3m-3 6c0-1.886 0-2.828.586-3.414S7.114 7.5 9 7.5h6c1.886 0 2.828 0 3.414.586S19 9.614 19 11.5v1c0 1.886 0 2.828-.586 3.414S16.886 16.5 15 16.5H9c-1.886 0-2.828 0-3.414-.586S5 14.386 5 12.5zm11 7H8a3 3 0 0 0-3 3a.5.5 0 0 0 .5.5h13a.5.5 0 0 0 .5-.5a3 3 0 0 0-3-3"/></svg>';
  // });

  // Render all roadmap items (respects search filter)
  function renderItems() {
    let list = getFilteredItems();
    if (hideCompleted) list = list.filter((item) => !item.completed);

    roadmapItems.innerHTML = "";

    if (list.length === 0) {
      if (items.length === 0) {
        // Truly empty data
        if (emptyState) {
          emptyState.innerHTML = defaultEmptyHTML || emptyState.innerHTML;
          emptyState.classList.remove("hidden");
          roadmapItems.appendChild(emptyState);
        }
      } else {
        // No results for search
        if (emptyState) {
          emptyState.classList.remove("hidden");
          emptyState.innerHTML = `
            <i class="fas fa-search"></i>
            <h3>No items match</h3>
            <p>Try another search or clear the filter</p>
          `;
          roadmapItems.appendChild(emptyState);
        }
      }
      return;
    }

    if (emptyState) emptyState.classList.add("hidden");

    list.forEach((item) => {
      const itemElement = createItemElement(item);
      roadmapItems.appendChild(itemElement);
    });
  }

  function getFilteredItems() {
    if (!searchQuery) return items.slice();
    return items.filter((it) => {
      const hay = `${it.title} ${it.language}`.toLowerCase();
      return hay.includes(searchQuery);
    });
  }

  // Create a roadmap item element
  function createItemElement(item) {
    const expired =
      item.expectedBy &&
      item.expectedBy !== "" &&
      !item.completed &&
      new Date(item.expectedBy).getTime() < Date.now()
        ? true
        : false;
    const itemDiv = document.createElement("div");
    itemDiv.className = `roadmap-item ${
      !expired ? (item.completed ? "completed" : "") : "expired"
    }`;
    itemDiv.dataset.id = item.id;
    itemDiv.setAttribute("role", "listitem");
    itemDiv.setAttribute("aria-grabbed", "false");
    itemDiv.draggable = true;

    if (expired) {
      itemDiv.classList.add("expired");
    }

    const iconHTML = iconForLanguage(item.language);
    function formatDate(date) {
      return new Date(date).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    }
    itemDiv.innerHTML = `
                    <div class="item-header">
                        <div class="item-icon">${iconHTML}</div>
                        <div class="item-content">
                            <div class="item-title">${item.title}</div>
                            <div class="item-status">${
                              (!expired
                                ? item.completed
                                  ? "Completed"
                                  : `${
                                      item.expectedBy
                                        ? `Due by ${formatDate(
                                            item.expectedBy
                                          )}`
                                        : "In Progress"
                                    }`
                                : "Expired") +
                              (item.completedAt || expired
                                ? ` at ${formatDate(
                                    item.completedAt || item.expectedBy
                                  )}`
                                : "")
                            }</div>
                        </div>
                    </div>
                    <div class="item-actions">
                    ${
                      !expired
                        ? `
                        <button class="btn btn-outline" data-action="toggle">
                            ${
                              item.completed
                                ? `<svg style="enable-background:new 0 0 512 512;" version="1.1" viewBox="-90 -70 560 560" width="512px" xml:space="preserve"
                                      xmlns="http://www.w3.org/2000/svg"
                                      xmlns:xlink="http://www.w3.org/1999/xlink">
                                      <g id="D_-_26_x2C__Puzzle_x2C__parts_x2C__strategy_x2C__teamwork">
                                          <g>
                                              <path fill="currentcolor" d="M407.555,272.497c0,28.278-23.007,51.285-51.285,51.285c-28.221,0-51.178-23.007-51.178-51.285    c0-3.993,0.46-7.945,1.371-11.812h-45.777v52.091c0,1.537-0.754,2.977-2.018,3.852c-1.262,0.875-2.874,1.077-4.313,0.536    c-4.781-1.793-9.778-2.702-14.853-2.702c-23.112,0-41.914,18.755-41.914,41.808c0,23.111,18.802,41.914,41.914,41.914    c5.146,0,10.116-0.935,14.773-2.778c0.18-0.071,0.363-0.131,0.549-0.179c0.927-0.239,1.9-0.189,2.79,0.137    c0.355,0.131,0.698,0.306,1.019,0.523c1.284,0.873,2.052,2.323,2.052,3.875v52.092H388.3c35.043,0,63.554-28.511,63.554-63.554    V260.686h-45.699C407.085,264.513,407.555,268.464,407.555,272.497z"/>
                                              <path fill="currentcolor" d="M188.218,356.27c0-28.221,23.007-51.178,51.285-51.178c3.993,0,7.945,0.46,11.812,1.371v-45.777h-52.09    c-1.345,0-2.614-0.576-3.498-1.567c-0.126-0.142-0.244-0.291-0.353-0.449c-0.876-1.264-1.077-2.875-0.537-4.313    c1.792-4.78,2.701-9.777,2.701-14.853c0-23.112-18.754-41.914-41.807-41.914c-23.111,0-41.914,18.802-41.914,41.914    c0,5.146,0.934,10.117,2.777,14.773c0.571,1.443,0.391,3.075-0.481,4.358c-0.763,1.124-1.969,1.852-3.299,2.016    c-0.189,0.024-0.381,0.036-0.575,0.036H60.147V388.3c0,35.043,28.51,63.554,63.553,63.554h127.614v-45.698    c-3.826,0.93-7.778,1.399-11.812,1.399C211.225,407.555,188.218,384.548,188.218,356.27z"/>
                                              <path fill="currentcolor" d="M104.446,239.503c0-28.278,23.006-51.285,51.285-51.285c28.22,0,51.178,23.007,51.178,51.285    c0,3.994-0.459,7.946-1.371,11.812h45.777v-53.59c0-1.662,0.88-3.198,2.313-4.04s3.203-0.861,4.654-0.053    c6.094,3.397,12.973,5.192,19.894,5.192c23.052,0,41.807-19.331,41.807-43.092c0-23.761-18.755-43.092-41.807-43.092    c-7.095,0-13.956,1.785-19.843,5.163c-1.449,0.832-3.232,0.828-4.68-0.01c-1.447-0.837-2.337-2.383-2.337-4.054V60.147H123.7    c-35.043,0-63.553,28.51-63.553,63.553v127.614h45.698C104.915,247.488,104.446,243.537,104.446,239.503z" transform="translate(-40,-40) rotate(-45 100 256)"/>
                                              <path fill="currentcolor" d="M388.3,60.147H260.686v46.238c5.504-2.052,11.436-3.117,17.489-3.117c28.22,0,51.178,23.534,51.178,52.463    c0,28.928-22.958,52.463-51.178,52.463c-5.962,0-11.897-1.082-17.489-3.163v46.283h52.092c1.535,0,2.976,0.754,3.85,2.017    c0.877,1.263,1.076,2.875,0.537,4.314c-1.793,4.78-2.701,9.777-2.701,14.852c0,23.111,18.754,41.914,41.807,41.914    c23.111,0,41.914-18.803,41.914-41.914c0-5.145-0.935-10.115-2.779-14.772c-0.143-0.361-0.238-0.733-0.287-1.109    c-0.15-1.128,0.115-2.286,0.77-3.249s1.634-1.635,2.738-1.912c0.367-0.092,0.749-0.14,1.137-0.14h52.092V123.7    C451.854,88.657,423.343,60.147,388.3,60.147z"/>
                                          </g>
                                      </g>
                                      <g id="Layer_1"/>
                                  </svg>`
                                : `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="currentColor" fill-rule="evenodd" d="M2 5.75A.75.75 0 0 1 2.75 5h18a.75.75 0 0 1 0 1.5h-18A.75.75 0 0 1 2 5.75m0 4A.75.75 0 0 1 2.75 9h18a.75.75 0 0 1 0 1.5h-18A.75.75 0 0 1 2 9.75m18.211 2.909a.75.75 0 0 1 .13 1.052l-3.9 5a.75.75 0 0 1-1.165.021l-2.1-2.5a.75.75 0 1 1 1.148-.964l1.504 1.79l3.33-4.27a.75.75 0 0 1 1.053-.13M2 13.75a.75.75 0 0 1 .75-.75h7a.75.75 0 0 1 0 1.5h-7a.75.75 0 0 1-.75-.75m0 4a.75.75 0 0 1 .75-.75h7a.75.75 0 0 1 0 1.5h-7a.75.75 0 0 1-.75-.75" clip-rule="evenodd" stroke-width="0.5" stroke="currentColor"/></svg>`
                            }
                            ${
                              item.completed
                                ? "Mark Incomplete"
                                : "Mark Complete"
                            }
                        </button>`
                        : `
                        <button class="btn btn-outline" data-action="restart">
                          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
                            <path fill="currentColor" d="M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10s-4.477 10-10 10m4.82-4.924a7 7 0 1 0-1.853 1.266l-.974-1.755A5 5 0 1 1 17 12h-3z" />
                          </svg>
                          Restart
                        </button>`
                    }
                        <div class="more-wrapper">
                            <button class="btn btn-outline more-btn" style="" data-action="more" aria-haspopup="true" aria-expanded="false" aria-label="More options">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="1.5" d="M20 7H4m16 5H4m16 5H4"/></svg>
                            </button>
                            <div class="more-options" role="menu">
                            ${
                              !expired
                                ? `
                                <button class="more-item" data-action="edit" role="menuitem">
                                    <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor" xmlns="http://www.w3.org/2000/svg" class="icon" aria-hidden="true">
                                        <path d="M2.6687 11.333V8.66699C2.6687 7.74455 2.66841 7.01205 2.71655 6.42285C2.76533 5.82612 2.86699 5.31731 3.10425 4.85156L3.25854 4.57617C3.64272 3.94975 4.19392 3.43995 4.85229 3.10449L5.02905 3.02149C5.44666 2.84233 5.90133 2.75849 6.42358 2.71582C7.01272 2.66769 7.74445 2.66797 8.66675 2.66797H9.16675C9.53393 2.66797 9.83165 2.96586 9.83179 3.33301C9.83179 3.70028 9.53402 3.99805 9.16675 3.99805H8.66675C7.7226 3.99805 7.05438 3.99834 6.53198 4.04102C6.14611 4.07254 5.87277 4.12568 5.65601 4.20313L5.45581 4.28906C5.01645 4.51293 4.64872 4.85345 4.39233 5.27149L4.28979 5.45508C4.16388 5.7022 4.08381 6.01663 4.04175 6.53125C3.99906 7.05373 3.99878 7.7226 3.99878 8.66699V11.333C3.99878 12.2774 3.99906 12.9463 4.04175 13.4688C4.08381 13.9833 4.16389 14.2978 4.28979 14.5449L4.39233 14.7285C4.64871 15.1465 5.01648 15.4871 5.45581 15.7109L5.65601 15.7969C5.87276 15.8743 6.14614 15.9265 6.53198 15.958C7.05439 16.0007 7.72256 16.002 8.66675 16.002H11.3337C12.2779 16.002 12.9461 16.0007 13.4685 15.958C13.9829 15.916 14.2976 15.8367 14.5447 15.7109L14.7292 15.6074C15.147 15.3511 15.4879 14.9841 15.7117 14.5449L15.7976 14.3447C15.8751 14.128 15.9272 13.8546 15.9587 13.4688C16.0014 12.9463 16.0017 12.2774 16.0017 11.333V10.833C16.0018 10.466 16.2997 10.1681 16.6667 10.168C17.0339 10.168 17.3316 10.4659 17.3318 10.833V11.333C17.3318 12.2555 17.3331 12.9879 17.2849 13.5771C17.2422 14.0993 17.1584 14.5541 16.9792 14.9717L16.8962 15.1484C16.5609 15.8066 16.0507 16.3571 15.4246 16.7412L15.1492 16.8955C14.6833 17.1329 14.1739 17.2354 13.5769 17.2842C12.9878 17.3323 12.256 17.332 11.3337 17.332H8.66675C7.74446 17.332 7.01271 17.3323 6.42358 17.2842C5.90135 17.2415 5.44665 17.1577 5.02905 16.9785L4.85229 16.8955C4.19396 16.5601 3.64271 16.0502 3.25854 15.4238L3.10425 15.1484C2.86697 14.6827 2.76534 14.1739 2.71655 13.5771C2.66841 12.9879 2.6687 12.2555 2.6687 11.333ZM13.4646 3.11328C14.4201 2.334 15.8288 2.38969 16.7195 3.28027L16.8865 3.46485C17.6141 4.35685 17.6143 5.64423 16.8865 6.53613L16.7195 6.7207L11.6726 11.7686C11.1373 12.3039 10.4624 12.6746 9.72827 12.8408L9.41089 12.8994L7.59351 13.1582C7.38637 13.1877 7.17701 13.1187 7.02905 12.9707C6.88112 12.8227 6.81199 12.6134 6.84155 12.4063L7.10132 10.5898L7.15991 10.2715C7.3262 9.53749 7.69692 8.86241 8.23218 8.32715L13.2791 3.28027L13.4646 3.11328ZM15.7791 4.2207C15.3753 3.81702 14.7366 3.79124 14.3035 4.14453L14.2195 4.2207L9.17261 9.26856C8.81541 9.62578 8.56774 10.0756 8.45679 10.5654L8.41772 10.7773L8.28296 11.7158L9.22241 11.582L9.43433 11.543C9.92426 11.432 10.3749 11.1844 10.7322 10.8271L15.7791 5.78027L15.8552 5.69629C16.185 5.29194 16.1852 4.708 15.8552 4.30371L15.7791 4.2207Z">
                                        </path>
                                    </svg>
                                    Edit
                                </button>
                                `
                                : ""
                            }
                                <button class="more-item" data-action="delete" role="menuitem">
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="currentColor" d="M3 6.524c0-.395.327-.714.73-.714h4.788c.006-.842.098-1.995.932-2.793A3.68 3.68 0 0 1 12 2a3.68 3.68 0 0 1 2.55 1.017c.834.798.926 1.951.932 2.793h4.788c.403 0 .73.32.73.714a.72.72 0 0 1-.73.714H3.73A.72.72 0 0 1 3 6.524"/><path fill="currentColor" fill-rule="evenodd" d="M11.596 22h.808c2.783 0 4.174 0 5.08-.886c.904-.886.996-2.34 1.181-5.246l.267-4.187c.1-1.577.15-2.366-.303-2.866c-.454-.5-1.22-.5-2.753-.5H8.124c-1.533 0-2.3 0-2.753.5s-.404 1.289-.303 2.866l.267 4.188c.185 2.906.277 4.36 1.182 5.245c.905.886 2.296.886 5.079.886m-1.35-9.811c-.04-.434-.408-.75-.82-.707c-.413.043-.713.43-.672.864l.5 5.263c.04.434.408.75.82.707c.413-.044.713-.43.672-.864zm4.329-.707c.412.043.713.43.671.864l-.5 5.263c-.04.434-.409.75-.82.707c-.413-.044-.713-.43-.672-.864l.5-5.264c.04-.433.409-.75.82-.707" clip-rule="evenodd"/></svg>
                                    Delete
                                </button>
                                <button class="more-item" data-action="resources" role="menuitem">
                                      <svg viewBox="0 0 20 20" fill="currentColor" xmlns="http://www.w3.org/2000/svg" data-rtl-flip="" class="icon" aria-label="">
                                          <path d="M16.3965 5.01128C16.3963 4.93399 16.3489 4.87691 16.293 4.85406L16.2354 4.84332C13.9306 4.91764 12.5622 5.32101 10.665 6.34722V16.3716C11.3851 15.9994 12.0688 15.7115 12.7861 15.5015C13.8286 15.1965 14.9113 15.0633 16.2402 15.0435L16.2979 15.0308C16.353 15.0063 16.3965 14.9483 16.3965 14.8755V5.01128ZM3.54492 14.8765C3.54492 14.9725 3.62159 15.0422 3.70117 15.0435L4.19629 15.0562C5.94062 15.1247 7.26036 15.4201 8.65918 16.0484C8.05544 15.1706 7.14706 14.436 6.17871 14.1109V14.1099C5.56757 13.9045 5.16816 13.3314 5.16797 12.6988V4.98882C4.86679 4.93786 4.60268 4.8999 4.28223 4.87457L3.72754 4.84429C3.62093 4.84079 3.54505 4.92417 3.54492 5.01226V14.8765ZM17.7266 14.8755C17.7266 15.6314 17.1607 16.2751 16.4121 16.3628L16.2598 16.3736C15.0122 16.3922 14.0555 16.5159 13.1602 16.7779C12.2629 17.0404 11.3966 17.4508 10.3369 18.0738C10.129 18.1959 9.87099 18.1958 9.66309 18.0738C7.71455 16.9283 6.31974 16.4689 4.12988 16.3853L3.68164 16.3736C2.85966 16.3614 2.21484 15.6838 2.21484 14.8765V5.01226C2.21497 4.15391 2.93263 3.4871 3.77246 3.51519L4.39844 3.54937C4.67996 3.57191 4.92258 3.60421 5.16797 3.64214V2.51031C5.16797 1.44939 6.29018 0.645615 7.31055 1.15679L7.31152 1.15582C8.78675 1.89511 10.0656 3.33006 10.5352 4.91461C12.3595 3.98907 13.8688 3.58817 16.1924 3.51324L16.3506 3.51714C17.1285 3.5741 17.7264 4.23496 17.7266 5.01128V14.8755ZM6.49805 12.6988C6.49824 12.7723 6.5442 12.8296 6.60254 12.8492L6.96289 12.9859C7.85245 13.3586 8.68125 13.9846 9.33496 14.7496V5.5816C9.08794 4.37762 8.13648 3.1566 6.95801 2.47613L6.71582 2.34527C6.67779 2.32617 6.6337 2.32502 6.58301 2.35796C6.52946 2.39279 6.49805 2.44863 6.49805 2.51031V12.6988Z">
                                          </path>
                                      </svg>
                                       Resources
                                </button>
                                <button class="more-item" data-action="details" role="menuitem">
                                      <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor" xmlns="http://www.w3.org/2000/svg" class="icon-lg shrink-0 text-token-text-secondary"><path d="M10 9.25C10.4142 9.25002 10.75 9.5858 10.75 10V13.333C10.75 13.7472 10.4142 14.083 10 14.083C9.58579 14.083 9.25 13.7472 9.25 13.333V10C9.25 9.58579 9.58579 9.25 10 9.25Z"></path><path d="M10 5.83301C10.5293 5.83303 10.958 6.26273 10.958 6.79199C10.9578 7.3211 10.5291 7.74998 10 7.75C9.47084 7.75 9.04217 7.32111 9.04199 6.79199C9.04199 6.26272 9.47073 5.83301 10 5.83301Z"></path><path fill-rule="evenodd" clip-rule="evenodd" d="M10 2.08496C14.3713 2.08496 17.915 5.62867 17.915 10C17.915 14.3713 14.3713 17.915 10 17.915C5.62867 17.915 2.08496 14.3713 2.08496 10C2.08496 5.62867 5.62867 2.08496 10 2.08496ZM10 3.41504C6.3632 3.41504 3.41504 6.3632 3.41504 10C3.41504 13.6368 6.3632 16.585 10 16.585C13.6368 16.585 16.585 13.6368 16.585 10C16.585 6.3632 13.6368 3.41504 10 3.41504Z"></path></svg>
                                  Details
                                </button>
                            </div>
                              <div class="more-options-mobile" role="menu">
                              ${
                                !expired
                                  ? `
                                <button class="more-item" data-action="edit" role="menuitem">
                                    <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor" xmlns="http://www.w3.org/2000/svg" class="icon" aria-hidden="true">
                                        <path d="M2.6687 11.333V8.66699C2.6687 7.74455 2.66841 7.01205 2.71655 6.42285C2.76533 5.82612 2.86699 5.31731 3.10425 4.85156L3.25854 4.57617C3.64272 3.94975 4.19392 3.43995 4.85229 3.10449L5.02905 3.02149C5.44666 2.84233 5.90133 2.75849 6.42358 2.71582C7.01272 2.66769 7.74445 2.66797 8.66675 2.66797H9.16675C9.53393 2.66797 9.83165 2.96586 9.83179 3.33301C9.83179 3.70028 9.53402 3.99805 9.16675 3.99805H8.66675C7.7226 3.99805 7.05438 3.99834 6.53198 4.04102C6.14611 4.07254 5.87277 4.12568 5.65601 4.20313L5.45581 4.28906C5.01645 4.51293 4.64872 4.85345 4.39233 5.27149L4.28979 5.45508C4.16388 5.7022 4.08381 6.01663 4.04175 6.53125C3.99906 7.05373 3.99878 7.7226 3.99878 8.66699V11.333C3.99878 12.2774 3.99906 12.9463 4.04175 13.4688C4.08381 13.9833 4.16389 14.2978 4.28979 14.5449L4.39233 14.7285C4.64871 15.1465 5.01648 15.4871 5.45581 15.7109L5.65601 15.7969C5.87276 15.8743 6.14614 15.9265 6.53198 15.958C7.05439 16.0007 7.72256 16.002 8.66675 16.002H11.3337C12.2779 16.002 12.9461 16.0007 13.4685 15.958C13.9829 15.916 14.2976 15.8367 14.5447 15.7109L14.7292 15.6074C15.147 15.3511 15.4879 14.9841 15.7117 14.5449L15.7976 14.3447C15.8751 14.128 15.9272 13.8546 15.9587 13.4688C16.0014 12.9463 16.0017 12.2774 16.0017 11.333V10.833C16.0018 10.466 16.2997 10.1681 16.6667 10.168C17.0339 10.168 17.3316 10.4659 17.3318 10.833V11.333C17.3318 12.2555 17.3331 12.9879 17.2849 13.5771C17.2422 14.0993 17.1584 14.5541 16.9792 14.9717L16.8962 15.1484C16.5609 15.8066 16.0507 16.3571 15.4246 16.7412L15.1492 16.8955C14.6833 17.1329 14.1739 17.2354 13.5769 17.2842C12.9878 17.3323 12.256 17.332 11.3337 17.332H8.66675C7.74446 17.332 7.01271 17.3323 6.42358 17.2842C5.90135 17.2415 5.44665 17.1577 5.02905 16.9785L4.85229 16.8955C4.19396 16.5601 3.64271 16.0502 3.25854 15.4238L3.10425 15.1484C2.86697 14.6827 2.76534 14.1739 2.71655 13.5771C2.66841 12.9879 2.6687 12.2555 2.6687 11.333ZM13.4646 3.11328C14.4201 2.334 15.8288 2.38969 16.7195 3.28027L16.8865 3.46485C17.6141 4.35685 17.6143 5.64423 16.8865 6.53613L16.7195 6.7207L11.6726 11.7686C11.1373 12.3039 10.4624 12.6746 9.72827 12.8408L9.41089 12.8994L7.59351 13.1582C7.38637 13.1877 7.17701 13.1187 7.02905 12.9707C6.88112 12.8227 6.81199 12.6134 6.84155 12.4063L7.10132 10.5898L7.15991 10.2715C7.3262 9.53749 7.69692 8.86241 8.23218 8.32715L13.2791 3.28027L13.4646 3.11328ZM15.7791 4.2207C15.3753 3.81702 14.7366 3.79124 14.3035 4.14453L14.2195 4.2207L9.17261 9.26856C8.81541 9.62578 8.56774 10.0756 8.45679 10.5654L8.41772 10.7773L8.28296 11.7158L9.22241 11.582L9.43433 11.543C9.92426 11.432 10.3749 11.1844 10.7322 10.8271L15.7791 5.78027L15.8552 5.69629C16.185 5.29194 16.1852 4.708 15.8552 4.30371L15.7791 4.2207Z">
                                        </path>
                                    </svg>
                                </button>
                                `
                                  : ""
                              }
                                <button class="more-item" data-action="delete" role="menuitem">
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="currentColor" d="M3 6.524c0-.395.327-.714.73-.714h4.788c.006-.842.098-1.995.932-2.793A3.68 3.68 0 0 1 12 2a3.68 3.68 0 0 1 2.55 1.017c.834.798.926 1.951.932 2.793h4.788c.403 0 .73.32.73.714a.72.72 0 0 1-.73.714H3.73A.72.72 0 0 1 3 6.524"/><path fill="currentColor" fill-rule="evenodd" d="M11.596 22h.808c2.783 0 4.174 0 5.08-.886c.904-.886.996-2.34 1.181-5.246l.267-4.187c.1-1.577.15-2.366-.303-2.866c-.454-.5-1.22-.5-2.753-.5H8.124c-1.533 0-2.3 0-2.753.5s-.404 1.289-.303 2.866l.267 4.188c.185 2.906.277 4.36 1.182 5.245c.905.886 2.296.886 5.079.886m-1.35-9.811c-.04-.434-.408-.75-.82-.707c-.413.043-.713.43-.672.864l.5 5.263c.04.434.408.75.82.707c.413-.044.713-.43.672-.864zm4.329-.707c.412.043.713.43.671.864l-.5 5.263c-.04.434-.409.75-.82.707c-.413-.044-.713-.43-.672-.864l.5-5.264c.04-.433.409-.75.82-.707" clip-rule="evenodd"/></svg>
                                </button>
                                <button class="more-item" data-action="resources" role="menuitem">
                                    <svg viewBox="0 0 20 20" fill="currentColor" xmlns="http://www.w3.org/2000/svg" data-rtl-flip="" class="icon" aria-label="">
                                        <path d="M16.3965 5.01128C16.3963 4.93399 16.3489 4.87691 16.293 4.85406L16.2354 4.84332C13.9306 4.91764 12.5622 5.32101 10.665 6.34722V16.3716C11.3851 15.9994 12.0688 15.7115 12.7861 15.5015C13.8286 15.1965 14.9113 15.0633 16.2402 15.0435L16.2979 15.0308C16.353 15.0063 16.3965 14.9483 16.3965 14.8755V5.01128ZM3.54492 14.8765C3.54492 14.9725 3.62159 15.0422 3.70117 15.0435L4.19629 15.0562C5.94062 15.1247 7.26036 15.4201 8.65918 16.0484C8.05544 15.1706 7.14706 14.436 6.17871 14.1109V14.1099C5.56757 13.9045 5.16816 13.3314 5.16797 12.6988V4.98882C4.86679 4.93786 4.60268 4.8999 4.28223 4.87457L3.72754 4.84429C3.62093 4.84079 3.54505 4.92417 3.54492 5.01226V14.8765ZM17.7266 14.8755C17.7266 15.6314 17.1607 16.2751 16.4121 16.3628L16.2598 16.3736C15.0122 16.3922 14.0555 16.5159 13.1602 16.7779C12.2629 17.0404 11.3966 17.4508 10.3369 18.0738C10.129 18.1959 9.87099 18.1958 9.66309 18.0738C7.71455 16.9283 6.31974 16.4689 4.12988 16.3853L3.68164 16.3736C2.85966 16.3614 2.21484 15.6838 2.21484 14.8765V5.01226C2.21497 4.15391 2.93263 3.4871 3.77246 3.51519L4.39844 3.54937C4.67996 3.57191 4.92258 3.60421 5.16797 3.64214V2.51031C5.16797 1.44939 6.29018 0.645615 7.31055 1.15679L7.31152 1.15582C8.78675 1.89511 10.0656 3.33006 10.5352 4.91461C12.3595 3.98907 13.8688 3.58817 16.1924 3.51324L16.3506 3.51714C17.1285 3.5741 17.7264 4.23496 17.7266 5.01128V14.8755ZM6.49805 12.6988C6.49824 12.7723 6.5442 12.8296 6.60254 12.8492L6.96289 12.9859C7.85245 13.3586 8.68125 13.9846 9.33496 14.7496V5.5816C9.08794 4.37762 8.13648 3.1566 6.95801 2.47613L6.71582 2.34527C6.67779 2.32617 6.6337 2.32502 6.58301 2.35796C6.52946 2.39279 6.49805 2.44863 6.49805 2.51031V12.6988Z">
                                        </path>
                                    </svg>
                                </button>
                                <button class="more-item" data-action="details" role="menuitem">
                                    <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor" xmlns="http://www.w3.org/2000/svg" class="icon-lg shrink-0 text-token-text-secondary"><path d="M10 9.25C10.4142 9.25002 10.75 9.5858 10.75 10V13.333C10.75 13.7472 10.4142 14.083 10 14.083C9.58579 14.083 9.25 13.7472 9.25 13.333V10C9.25 9.58579 9.58579 9.25 10 9.25Z"></path><path d="M10 5.83301C10.5293 5.83303 10.958 6.26273 10.958 6.79199C10.9578 7.3211 10.5291 7.74998 10 7.75C9.47084 7.75 9.04217 7.32111 9.04199 6.79199C9.04199 6.26272 9.47073 5.83301 10 5.83301Z"></path><path fill-rule="evenodd" clip-rule="evenodd" d="M10 2.08496C14.3713 2.08496 17.915 5.62867 17.915 10C17.915 14.3713 14.3713 17.915 10 17.915C5.62867 17.915 2.08496 14.3713 2.08496 10C2.08496 5.62867 5.62867 2.08496 10 2.08496ZM10 3.41504C6.3632 3.41504 3.41504 6.3632 3.41504 10C3.41504 13.6368 6.3632 16.585 10 16.585C13.6368 16.585 16.585 13.6368 16.585 10C16.585 6.3632 13.6368 3.41504 10 3.41504Z"></path></svg>
                                </button>
                            </div>
                        </div>
                    </div>`;

    // Add event listeners to buttons
    const toggleBtn = itemDiv.querySelector('[data-action="toggle"]');
    const deleteBtn = itemDiv.querySelector('[data-action="delete"]');
    const moreBtn = itemDiv.querySelector('[data-action="more"]');
    const moreMenu = itemDiv.querySelector(".more-options");
    const editBtn = itemDiv.querySelector('[data-action="edit"]');
    const resourcesBtn = itemDiv.querySelector('[data-action="resources"]');
    const detailsBtn = itemDiv.querySelector('[data-action="details"]');
    const restartBtn = itemDiv.querySelector('[data-action="restart"]');

    const deleteBtnMobile = itemDiv.querySelector(
      '.more-options-mobile [data-action="delete"]'
    );
    const editBtnMobile = itemDiv.querySelector(
      '.more-options-mobile [data-action="edit"]'
    );
    const detailsBtnMobile = itemDiv.querySelector(
      '.more-options-mobile [data-action="details"]'
    );
    const resourcesBtnMobile = itemDiv.querySelector(
      '.more-options-mobile [data-action="resources"]'
    );

    toggleBtn?.addEventListener("click", function () {
      toggleItemCompletion(item.id);
    });

    [deleteBtn, deleteBtnMobile].forEach((btn) => {
      btn.addEventListener("click", function () {
        deleteItem(item.id);
      });
    });

    if (editBtn) {
      [editBtn, editBtnMobile].forEach((btn) => {
        btn.addEventListener("click", function (e) {
          e.stopPropagation();
          closeAllMoreMenus();
          openEditModal(item);
        });
      });
    }
    if (restartBtn) {
      restartBtn.addEventListener("click", function (e) {
        e.stopPropagation();
        closeAllMoreMenus();
        openEditModal(item, true);
      });
    }
    if (detailsBtn) {
      [detailsBtn, detailsBtnMobile].forEach((btn) => {
        btn.addEventListener("click", function (e) {
          e.stopPropagation();
          closeAllMoreMenus();
          openDetailsModal(item);
        });
      });
    }

    [resourcesBtn, resourcesBtnMobile].forEach((btn) => {
      btn.addEventListener("click", function (e) {
        e.stopPropagation();
        closeAllMoreMenus();
        window.location.href = `${window.location.origin}/learn/${item.language}`;
      });
    });

    if (moreBtn && moreMenu) {
      moreBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        const isOpen = moreMenu.classList.contains("open");
        closeAllMoreMenus();
        if (!isOpen) {
          moreMenu.classList.add("open");
          moreBtn.setAttribute("aria-expanded", "true");
        }
      });
    }

    // Prevent drag initiation from action buttons
    [toggleBtn, deleteBtn].filter(Boolean).forEach((btn) => {
      btn.addEventListener("dragstart", (e) => e.stopPropagation());
    });

    // Drag & drop handlers
    itemDiv.addEventListener("dragstart", (e) => {
      if (e.target && e.target.closest && e.target.closest(".item-actions")) {
        e.preventDefault();
        return;
      }
      draggingId = item.id;
      itemDiv.classList.add("dragging");
      itemDiv.setAttribute("aria-grabbed", "true");
      if (e.dataTransfer) {
        e.dataTransfer.effectAllowed = "move";
        try {
          e.dataTransfer.setData("text/plain", String(item.id));
        } catch (_) {}
      }
    });

    let dragEnterCounter = 0;

    itemDiv.addEventListener("dragenter", (e) => {
      if (Number(itemDiv.dataset.id) === draggingId) return;
      dragEnterCounter++;
      itemDiv.classList.add(swapOnDrop ? "drag-over-swap" : "drag-over");
    });

    itemDiv.addEventListener("dragleave", () => {
      dragEnterCounter--;
      if (dragEnterCounter === 0) {
        itemDiv.classList.remove(swapOnDrop ? "drag-over-swap" : "drag-over");
      }
    });

    itemDiv.addEventListener("dragover", (e) => {
      e.preventDefault();
      if (e.dataTransfer) e.dataTransfer.dropEffect = "move";
    });

    itemDiv.addEventListener("drop", (e) => {
      e.preventDefault();
      dragEnterCounter = 0;
      itemDiv.classList.remove(swapOnDrop ? "drag-over-swap" : "drag-over");

      const srcIdStr =
        (e.dataTransfer && e.dataTransfer.getData("text/plain")) ||
        String(draggingId || "");
      const srcId = parseInt(srcIdStr, 10);
      const targetId = item.id;
      if (!srcId || srcId === targetId) return;
      reorderItems(srcId, targetId);
    });

    itemDiv.addEventListener("dragend", () => {
      itemDiv.classList.remove("dragging");
      itemDiv.setAttribute("aria-grabbed", "false");
      draggingId = null;
      dragEnterCounter = 0;
      document
        .querySelectorAll(
          ".roadmap-item.drag-over, .roadmap-item.drag-over-swap"
        )
        .forEach((el) => el.classList.remove("drag-over", "drag-over-swap"));
    });

    return itemDiv;
  }

  // Details modal helpers
  function isDetailsOpen() {
    return detailsModal && detailsModal.classList.contains("open");
  }

  function openDetailsModal(item) {
    if (!detailsModal) return;
    // Title
    if (detailsTitle) detailsTitle.textContent = "Details";
    // Icon
    if (detailsIcon) detailsIcon.innerHTML = iconForLanguage(item.language);
    // Name and meta
    if (detailsName) detailsName.textContent = `${item.title || "Custom"}`;
    const expired =
      item.expectedBy &&
      item.expectedBy !== "" &&
      !item.completed &&
      new Date(item.expectedBy).getTime() < Date.now()
        ? true
        : false;
    const status = expired
      ? "Expired"
      : item.completed
      ? "Completed"
      : "In Progress";
    const created = item.createdAt
      ? new Date(item.createdAt).toLocaleString()
      : "";
    const completed = item.completedAt
      ? new Date(item.completedAt).toLocaleString()
      : null;
    const expectedBy = (item.expectedBy || "").trim();
    const expectedPretty = expectedBy
      ? new Date(`${expectedBy}T00:00:00`).toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        })
      : null;
    if (detailsMeta) {
      //   detailsMeta.textContent = `${status}${
      //     created ? ` • Created ${created}` : ""
      //   }${completed ? ` • Completed ${completed}` : ""}`;
      detailsMeta.textContent = status;
    }
    // Body
    if (detailsBody) {
      //   const lang = (item.language || "").trim();
      //   const label = lang ? lang[0].toUpperCase() + lang.slice(1) : "Language";
      //   detailsBody.innerHTML = `Quick info about <strong>${label}</strong>. Explore the resources below to deepen your understanding.`;
      detailsBody.innerHTML = `
			<div class="details-card">
				<div class="details-row">
					<span class="label">Start Date:</span>
					<span class="value">${created || "<em>undefined</em>"}</span>
				</div>
        <div class="details-row ${expired ? "expired" : ""}">
          <span class="label">Expected Completion:</span>
          <span class="value">${expectedPretty || "<em>Not Set</em>"}</span>
        </div>
				<div class="details-row">
					<span class="label">Completion Date:</span>
					<span class="value">${completed || "<em>Not Completed Yet</em>"}</span>
				</div>
			
				<div class="details-item">
					<span class="label">Description:</span>
					<span class="value">${
            item.description || "<em>No Description Available</em>"
          }</span>
				</div>
			</div>
			`;
    }

    // <div class="details-item">
    // 	<span class="held-label">Category:</span>
    // 	<span class="held-value">Web Development</span>
    // </div>

    // <div class="details-item">
    // 	<span class="held-label">Difficulty:</span>
    // 	<span class="held-value">Intermediate</span>
    // </div>

    // Links
    // if (detailsLinks) {
    //   detailsLinks.innerHTML = "";
    //   const lang = (item.language || "").toLowerCase();
    //   const links = buildLanguageLinks(lang);
    //   links.forEach(({ href, label }) => {
    //     const a = document.createElement("a");
    //     a.href = href;
    //     a.target = "_blank";
    //     a.rel = "noopener noreferrer";
    //     a.className = "btn btn-outline";
    //     a.textContent = label;
    //     detailsLinks.appendChild(a);
    //   });
    // }

    // Links
    if (detailsLinks) {
      detailsLinks.innerHTML = "";
      if (!expired) {
        //add the edit, delete, and resources buttons
        const editBtn = document.createElement("button");
        editBtn.innerHTML = `<svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor" xmlns="http://www.w3.org/2000/svg" class="icon" aria-hidden="true">
								<path d="M2.6687 11.333V8.66699C2.6687 7.74455 2.66841 7.01205 2.71655 6.42285C2.76533 5.82612 2.86699 5.31731 3.10425 4.85156L3.25854 4.57617C3.64272 3.94975 4.19392 3.43995 4.85229 3.10449L5.02905 3.02149C5.44666 2.84233 5.90133 2.75849 6.42358 2.71582C7.01272 2.66769 7.74445 2.66797 8.66675 2.66797H9.16675C9.53393 2.66797 9.83165 2.96586 9.83179 3.33301C9.83179 3.70028 9.53402 3.99805 9.16675 3.99805H8.66675C7.7226 3.99805 7.05438 3.99834 6.53198 4.04102C6.14611 4.07254 5.87277 4.12568 5.65601 4.20313L5.45581 4.28906C5.01645 4.51293 4.64872 4.85345 4.39233 5.27149L4.28979 5.45508C4.16388 5.7022 4.08381 6.01663 4.04175 6.53125C3.99906 7.05373 3.99878 7.7226 3.99878 8.66699V11.333C3.99878 12.2774 3.99906 12.9463 4.04175 13.4688C4.08381 13.9833 4.16389 14.2978 4.28979 14.5449L4.39233 14.7285C4.64871 15.1465 5.01648 15.4871 5.45581 15.7109L5.65601 15.7969C5.87276 15.8743 6.14614 15.9265 6.53198 15.958C7.05439 16.0007 7.72256 16.002 8.66675 16.002H11.3337C12.2779 16.002 12.9461 16.0007 13.4685 15.958C13.9829 15.916 14.2976 15.8367 14.5447 15.7109L14.7292 15.6074C15.147 15.3511 15.4879 14.9841 15.7117 14.5449L15.7976 14.3447C15.8751 14.128 15.9272 13.8546 15.9587 13.4688C16.0014 12.9463 16.0017 12.2774 16.0017 11.333V10.833C16.0018 10.466 16.2997 10.1681 16.6667 10.168C17.0339 10.168 17.3316 10.4659 17.3318 10.833V11.333C17.3318 12.2555 17.3331 12.9879 17.2849 13.5771C17.2422 14.0993 17.1584 14.5541 16.9792 14.9717L16.8962 15.1484C16.5609 15.8066 16.0507 16.3571 15.4246 16.7412L15.1492 16.8955C14.6833 17.1329 14.1739 17.2354 13.5769 17.2842C12.9878 17.3323 12.256 17.332 11.3337 17.332H8.66675C7.74446 17.332 7.01271 17.3323 6.42358 17.2842C5.90135 17.2415 5.44665 17.1577 5.02905 16.9785L4.85229 16.8955C4.19396 16.5601 3.64271 16.0502 3.25854 15.4238L3.10425 15.1484C2.86697 14.6827 2.76534 14.1739 2.71655 13.5771C2.66841 12.9879 2.6687 12.2555 2.6687 11.333ZM13.4646 3.11328C14.4201 2.334 15.8288 2.38969 16.7195 3.28027L16.8865 3.46485C17.6141 4.35685 17.6143 5.64423 16.8865 6.53613L16.7195 6.7207L11.6726 11.7686C11.1373 12.3039 10.4624 12.6746 9.72827 12.8408L9.41089 12.8994L7.59351 13.1582C7.38637 13.1877 7.17701 13.1187 7.02905 12.9707C6.88112 12.8227 6.81199 12.6134 6.84155 12.4063L7.10132 10.5898L7.15991 10.2715C7.3262 9.53749 7.69692 8.86241 8.23218 8.32715L13.2791 3.28027L13.4646 3.11328ZM15.7791 4.2207C15.3753 3.81702 14.7366 3.79124 14.3035 4.14453L14.2195 4.2207L9.17261 9.26856C8.81541 9.62578 8.56774 10.0756 8.45679 10.5654L8.41772 10.7773L8.28296 11.7158L9.22241 11.582L9.43433 11.543C9.92426 11.432 10.3749 11.1844 10.7322 10.8271L15.7791 5.78027L15.8552 5.69629C16.185 5.29194 16.1852 4.708 15.8552 4.30371L15.7791 4.2207Z">
								</path>
                            </svg> Edit`;
        editBtn.className = "btn btn-outline";
        editBtn.addEventListener("click", () => {
          closeDetailsModal();
          openEditModal(item);
        });
        detailsLinks.appendChild(editBtn);
      }
      const deleteBtn = document.createElement("button");
      deleteBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="currentColor" d="M3 6.524c0-.395.327-.714.73-.714h4.788c.006-.842.098-1.995.932-2.793A3.68 3.68 0 0 1 12 2a3.68 3.68 0 0 1 2.55 1.017c.834.798.926 1.951.932 2.793h4.788c.403 0 .73.32.73.714a.72.72 0 0 1-.73.714H3.73A.72.72 0 0 1 3 6.524"/><path fill="currentColor" fill-rule="evenodd" d="M11.596 22h.808c2.783 0 4.174 0 5.08-.886c.904-.886.996-2.34 1.181-5.246l.267-4.187c.1-1.577.15-2.366-.303-2.866c-.454-.5-1.22-.5-2.753-.5H8.124c-1.533 0-2.3 0-2.753.5s-.404 1.289-.303 2.866l.267 4.188c.185 2.906.277 4.36 1.182 5.245c.905.886 2.296.886 5.079.886m-1.35-9.811c-.04-.434-.408-.75-.82-.707c-.413.043-.713.43-.672.864l.5 5.263c.04.434.408.75.82.707c.413-.044.713-.43.672-.864zm4.329-.707c.412.043.713.43.671.864l-.5 5.263c-.04.434-.409.75-.82.707c-.413-.044-.713-.43-.672-.864l.5-5.264c.04-.433.409-.75.82-.707" clip-rule="evenodd"/></svg> Delete`;
      deleteBtn.className = "btn btn-outline";
      deleteBtn.addEventListener("click", () => {
        closeDetailsModal();
        deleteItem(item.id);
      });
      detailsLinks.appendChild(deleteBtn);

      const resourcesBtn = document.createElement("button");
      resourcesBtn.innerHTML = `<svg viewBox="0 0 20 20" fill="currentColor" xmlns="http://www.w3.org/2000/svg" data-rtl-flip="" class="icon" aria-label="">
									<path d="M16.3965 5.01128C16.3963 4.93399 16.3489 4.87691 16.293 4.85406L16.2354 4.84332C13.9306 4.91764 12.5622 5.32101 10.665 6.34722V16.3716C11.3851 15.9994 12.0688 15.7115 12.7861 15.5015C13.8286 15.1965 14.9113 15.0633 16.2402 15.0435L16.2979 15.0308C16.353 15.0063 16.3965 14.9483 16.3965 14.8755V5.01128ZM3.54492 14.8765C3.54492 14.9725 3.62159 15.0422 3.70117 15.0435L4.19629 15.0562C5.94062 15.1247 7.26036 15.4201 8.65918 16.0484C8.05544 15.1706 7.14706 14.436 6.17871 14.1109V14.1099C5.56757 13.9045 5.16816 13.3314 5.16797 12.6988V4.98882C4.86679 4.93786 4.60268 4.8999 4.28223 4.87457L3.72754 4.84429C3.62093 4.84079 3.54505 4.92417 3.54492 5.01226V14.8765ZM17.7266 14.8755C17.7266 15.6314 17.1607 16.2751 16.4121 16.3628L16.2598 16.3736C15.0122 16.3922 14.0555 16.5159 13.1602 16.7779C12.2629 17.0404 11.3966 17.4508 10.3369 18.0738C10.129 18.1959 9.87099 18.1958 9.66309 18.0738C7.71455 16.9283 6.31974 16.4689 4.12988 16.3853L3.68164 16.3736C2.85966 16.3614 2.21484 15.6838 2.21484 14.8765V5.01226C2.21497 4.15391 2.93263 3.4871 3.77246 3.51519L4.39844 3.54937C4.67996 3.57191 4.92258 3.60421 5.16797 3.64214V2.51031C5.16797 1.44939 6.29018 0.645615 7.31055 1.15679L7.31152 1.15582C8.78675 1.89511 10.0656 3.33006 10.5352 4.91461C12.3595 3.98907 13.8688 3.58817 16.1924 3.51324L16.3506 3.51714C17.1285 3.5741 17.7264 4.23496 17.7266 5.01128V14.8755ZM6.49805 12.6988C6.49824 12.7723 6.5442 12.8296 6.60254 12.8492L6.96289 12.9859C7.85245 13.3586 8.68125 13.9846 9.33496 14.7496V5.5816C9.08794 4.37762 8.13648 3.1566 6.95801 2.47613L6.71582 2.34527C6.67779 2.32617 6.6337 2.32502 6.58301 2.35796C6.52946 2.39279 6.49805 2.44863 6.49805 2.51031V12.6988Z">
									</path>
                                </svg> Resources`;
      resourcesBtn.className = "btn btn-outline";
      resourcesBtn.addEventListener("click", () => {
        closeDetailsModal();
        window.location.href = `${window.location.origin}/learn/${item.language}`;
      });
      detailsLinks.appendChild(resourcesBtn);
    }

    detailsModal.classList.add("open");
    detailsModal.setAttribute("aria-hidden", "false");
    document.body.classList.add("modal-open");
    trapFocus(detailsModal);
    // focus close button for accessibility
    if (closeDetailsBtn) setTimeout(() => closeDetailsBtn.focus(), 50);
  }

  function closeDetailsModal() {
    if (!detailsModal) return;
    detailsModal.classList.remove("open");
    detailsModal.setAttribute("aria-hidden", "true");
    document.body.classList.remove("modal-open");
    releaseFocus(detailsModal);
  }

  function reorderItems(srcId, targetId) {
    const srcIndex = items.findIndex((it) => it.id === srcId);
    const targetIndex = items.findIndex((it) => it.id === targetId);
    if (srcIndex < 0 || targetIndex < 0) return;
    if (swapOnDrop) {
      // Swap the two items
      const temp = items[srcIndex];
      items[srcIndex] = items[targetIndex];
      items[targetIndex] = temp;
    } else {
      const [moved] = items.splice(srcIndex, 1);
      items.splice(targetIndex, 0, moved);
    }
    renderItems();
    updateProgress();
    updateStats();
    saveItems();
  }

  function closeAllMoreMenus() {
    document
      .querySelectorAll(".more-options.open")
      .forEach((m) => m.classList.remove("open"));
    document
      .querySelectorAll('.more-btn[aria-expanded="true"]')
      .forEach((b) => b.setAttribute("aria-expanded", "false"));
  }

  function toUpperCaseFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
  }

  function getLangName(language) {
    for (const lang in languageInfo) {
      if (lang == language) {
        return languageInfo[lang].name;
      }
    }
  }

  function langFromName(name) {
    for (const lang in languageInfo) {
      if (languageInfo[lang].name === name) {
        return lang;
      }
    }
  }

  // Add a new item to the roadmap
  function addNewItem() {
    let title = document.getElementById("itemTitle").value;
    const description = document.getElementById("itemDescription").value;
    const expectedBy = (expectedDateInput?.value || "").trim();
    const language = langFromName(languageSelect.value);
    const isValidLang = iconForLanguage(language);
    if (!language || !isValidLang) {
      errorLog.textContent = "Please select a valid language.";
      return;
    }
    const langName = getLangName(language) || toUpperCaseFirstLetter(language);
    title = title.trim() !== "" ? title.trim() : `Learn ${langName}`;

    if (editingItemId) {
      const itemLang = items.find((it) => it.id === editingItemId)?.language;
      if (itemLang !== language) {
        const exists = items.some((it) => it.language === language);
        if (exists) {
          errorLog.textContent = `Item with language "${langName}" already exists.`;
          return;
        }
      }
      // Update existing item
      items = items.map((it) =>
        it.id === editingItemId
          ? {
              ...it,
              title: title,
              language: language,
              description: description,
              expectedBy: expectedBy || "",
            }
          : it
      );
    } else {
      const exists = items.some((it) => it.language === language);
      if (exists) {
        errorLog.textContent = `Item with language "${langName}" already exists.`;
        return;
      }
      const newItem = {
        id: Date.now(), // Simple ID generation
        title: title,
        language: language,
        description: description,
        expectedBy: expectedBy || "",
        completed: false,
        createdAt: Date.now(),
        completedAt: null,
      };
      items.push(newItem);
    }
    renderItems();
    updateProgress();
    updateStats();
    saveItems();

    // Reset form
    itemForm.reset();

    handleLanguageChange(languageSelect.value);
    // Close modal and reset editing state
    closeModal();
  }

  // Toggle item completion status
  function toggleItemCompletion(id) {
    items = items.map((item) => {
      if (item.id === id) {
        return {
          ...item,
          completed: !item.completed,
          completedAt: !item.completed ? Date.now() : null,
        };
      }
      return item;
    });

    renderItems();
    updateProgress();
    updateStats();
    saveItems();
  }

  // Delete an item
  function deleteItem(id) {
    items = items.filter((item) => item.id !== id);
    renderItems();
    updateProgress();
    updateStats();
    saveItems();
  }

  // Update progress bar and percentage
  function updateProgress() {
    if (items.length === 0) {
      progressFill.style.width = "0%";
      progressPercent.textContent = "0%";
      return;
    }

    const completedCount = items.filter((item) => item.completed).length;
    const progress = (completedCount / items.length) * 100;
    const roundedProgress = Math.round(progress);

    progressFill.style.width = `${progress}%`;
    progressPercent.textContent = `${roundedProgress}%`;
  }

  function updateStats() {
    const totalItemsCount = items.length;
    const completed = items.filter((item) => item.completed);
    const completedItemsCount = completed.length;
    const inProgress = items.filter((item) => !item.completed);
    const inProgressItemsCount = inProgress.length;

    totalItems.textContent = totalItemsCount;
    completedItems.textContent = completedItemsCount;
    inProgressItems.textContent = inProgressItemsCount;

    // Helper function to limit icons and show "+N"
    const renderIcons = (list) => {
      if (totalItemsCount === 0) return "";
      const icons = list.map((item) => {
        const icon = iconForLanguage(item.language);
        if (typeof icon === "string" && icon.includes("<svg")) {
          return `<div class="icon-wrapper">${icon}</div>`;
        }
        return icon;
      });

      if (icons.length <= 5) return icons.join("");
      const visible = icons.slice(0, 4).join("");
      const remaining = icons.length - 4;
      return visible + `<span class="more-icons">+${remaining}</span>`;
    };

    completedStat.querySelector(".icons").innerHTML = renderIcons(completed);
    inProgressStat.querySelector(".icons").innerHTML = renderIcons(inProgress);
  }

  // Modal helpers
  function openModal() {
    if (!addItemModal) return;
    addItemModal.classList.add("open");
    addItemModal.setAttribute("aria-hidden", "false");
    document.body.classList.add("modal-open");
    trapFocus(addItemModal);
    // Focus first field
    const titleInput = document.getElementById("itemTitle");
    if (titleInput) setTimeout(() => titleInput.focus(), 50);
  }

  function openAddModal() {
    editingItemId = null;
    // reset form fields
    if (itemForm) itemForm.reset();
    handleLanguageChange(languageSelect ? languageSelect.value : "custom");
    // update UI labels
    const titleEl = document.getElementById("addItemTitle");
    if (titleEl) titleEl.textContent = "Add New Item";
    const submitBtn = itemForm
      ? itemForm.querySelector('button[type="submit"]')
      : null;
    if (submitBtn)
      submitBtn.innerHTML = '<i class="fas fa-plus"></i> Add to Roadmap';
    openModal();
  }

  function openEditModal(item, isRestart = false) {
    editingItemId = item.id;
    // prefill
    const titleInput = document.getElementById("itemTitle");
    if (titleInput) titleInput.value = item.title;
    const descriptionInput = document.getElementById("itemDescription");
    if (descriptionInput) descriptionInput.value = item.description || "";
    if (expectedDateInput)
      expectedDateInput.value = isRestart ? "" : item.expectedBy || "";
    if (customDatePicker && item.expectedBy) {
      const formatted = new Date(item.expectedBy).toLocaleDateString("en-US");
      customDatePicker.querySelector("#customDateText").textContent = formatted;
    }
    if (languageSelect) {
      languageSelect.value = getLangName(item.language) || "undefined";
      handleLanguageChange(item.language);
      if (isRestart) languageSelect.disabled = true;
    }
    // labels
    const titleEl = document.getElementById("addItemTitle");
    if (titleEl) titleEl.textContent = isRestart ? "Restart Item" : "Edit Item";
    const selectLangTitle = document.getElementById("selectLangTitle");
    if (selectLangTitle)
      selectLangTitle.textContent = isRestart
        ? "Language (cannot be changed)"
        : "Select Language";
    const submitBtn = itemForm
      ? itemForm.querySelector('button[type="submit"]')
      : null;
    if (submitBtn)
      submitBtn.innerHTML = !isRestart
        ? `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" d="M22 10.5V12c0 4.714 0 7.071-1.465 8.535C19.072 22 16.714 22 12 22s-7.071 0-8.536-1.465C2 19.072 2 16.714 2 12s0-7.071 1.464-8.536C4.93 2 7.286 2 12 2h1.5"/><path d="m16.652 3.455l.649-.649A2.753 2.753 0 0 1 21.194 6.7l-.65.649m-3.892-3.893s.081 1.379 1.298 2.595c1.216 1.217 2.595 1.298 2.595 1.298m-3.893-3.893L10.687 9.42c-.404.404-.606.606-.78.829q-.308.395-.524.848c-.121.255-.211.526-.392 1.068L8.412 13.9m12.133-6.552l-5.965 5.965c-.404.404-.606.606-.829.78a4.6 4.6 0 0 1-.848.524c-.255.121-.526.211-1.068.392l-1.735.579m0 0l-1.123.374a.742.742 0 0 1-.939-.94l.374-1.122m1.688 1.688L8.412 13.9"/></g></svg>
       Save Changes`
        : `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path fill="currentColor" d="M18.537 19.567A9.96 9.96 0 0 1 12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10c0 2.136-.67 4.116-1.81 5.74L17 12h3a8 8 0 1 0-2.46 5.772z"/></svg>
        Restart Item`;
    openModal();
  }

  function closeModal() {
    if (!addItemModal) return;
    addItemModal.classList.remove("open");
    addItemModal.setAttribute("aria-hidden", "true");
    document.body.classList.remove("modal-open");
    releaseFocus(addItemModal);
    editingItemId = null;
    const titleEl = document.getElementById("addItemTitle");
    if (titleEl) titleEl.textContent = "Add New Item";
    languageSelect.disabled = false;
    customDatePicker.querySelector("#customDateText").textContent =
      "MM/DD/YYYY";
    const submitBtn = itemForm
      ? itemForm.querySelector('button[type="submit"]')
      : null;
    if (submitBtn)
      submitBtn.innerHTML = '<i class="fas fa-plus"></i> Add to Roadmap';
    languageSuggestions.style.display = "none";
    errorLog.textContent = "";
  }

  function isModalOpen() {
    return addItemModal && addItemModal.classList.contains("open");
  }

  function handleLanguageChange(value) {
    if (languageIcon) {
      languageIcon.innerHTML = iconForLanguage(value);
    }
  }

  // Focus trap for modal
  let lastFocusTrap = null;
  function trapFocus(modalRoot) {
    releaseFocus();
    const focusables = modalRoot.querySelectorAll(
      'a[href], button, textarea, input, select, [tabindex]:not([tabindex="-1"])'
    );
    const list = Array.from(focusables).filter(
      (el) => !el.hasAttribute("disabled") && !el.getAttribute("aria-hidden")
    );
    if (list.length === 0) return;
    const first = list[0];
    const last = list[list.length - 1];
    lastFocusTrap = function (e) {
      if (e.key !== "Tab") return;
      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    modalRoot.addEventListener("keydown", lastFocusTrap);
  }

  function releaseFocus(modalRoot) {
    const root = modalRoot || addItemModal;
    if (root && lastFocusTrap)
      root.removeEventListener("keydown", lastFocusTrap);
    lastFocusTrap = null;
  }

  // Storage helpers
  function loadItems() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (_) {}
    // default seed
    return [];
  }

  function saveItems() {
    // items.forEach((item) => (item.expectedBy ||= ""));

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch (_) {}
  }

  // Initialize the application
  init();
});
