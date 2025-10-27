import { languageIcons } from "./languageIcons.js";

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

        const suggestions = Object.keys(languageIcons)
          .filter((key) => key.includes(val.toLowerCase()) && key !== "custom")
          .slice(0, 5);

        if (suggestions.length === 0) {
          // languageSuggestions.style.display = "none";
          languageSuggestions.innerHTML =
            "<p class='no-suggestions'>Language not found</p>";
          return;
        }
        suggestions.forEach((suggestion) => {
          const icon = iconForLanguage(suggestion);
          const div = document.createElement("div");
          div.classList.add("suggestion");
          div.innerHTML += `${icon} ${suggestion}`;
          div.addEventListener("click", () => {
            languageSelect.value = suggestion;
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
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && isModalOpen()) closeModal();
    });

    // Close open menus on outside click
    document.addEventListener("click", (e) => {
      const target = e.target;
      if (!target.closest) return;
      const isMore = target.closest(".more-wrapper");
      if (!isMore) closeAllMoreMenus();
    });

    // Search filter
    if (searchInput) {
      searchInput.addEventListener("input", (e) => {
        searchQuery = String(e.target.value || "")
          .trim()
          .toLowerCase();
        renderItems();
      });
    }
    document.getElementById("expandBtn").addEventListener("click", function () {
      this.parentElement.classList.toggle("expanded");
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
    const itemDiv = document.createElement("div");
    itemDiv.className = `roadmap-item ${item.completed ? "completed" : ""}`;
    itemDiv.dataset.id = item.id;
    itemDiv.setAttribute("role", "listitem");
    itemDiv.setAttribute("aria-grabbed", "false");
    itemDiv.draggable = true;

    const iconHTML = iconForLanguage(item.language);

    itemDiv.innerHTML = `
                    <div class="item-header">
                        <div class="item-icon">${iconHTML}</div>
                        <div class="item-content">
                            <div class="item-title">${item.title}</div>
                            <div class="item-status">${
                              (item.completed ? "Completed" : "In Progress") +
                              (item.completedAt
                                ? ` • ${new Date(
                                    item.completedAt
                                  ).toLocaleDateString("en-GB", {
                                    day: "2-digit",
                                    month: "short",
                                    year: "numeric",
                                  })}`
                                : "")
                            }</div>
                        </div>
                    </div>
                    <div class="item-actions">
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
                        </button>
                        <div class="more-wrapper">
                            <button class="btn btn-outline more-btn" style="" data-action="more" aria-haspopup="true" aria-expanded="false" aria-label="More options">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="1.5" d="M20 7H4m16 5H4m16 5H4"/></svg>
                            </button>
                            <div class="more-options" role="menu">
                                <button class="more-item" data-action="edit" role="menuitem">
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="currentColor" fill-rule="evenodd" d="M3.25 22a.75.75 0 0 1 .75-.75h16a.75.75 0 0 1 0 1.5H4a.75.75 0 0 1-.75-.75" clip-rule="evenodd"/><path fill="currentColor" d="m11.52 14.929l5.917-5.917a8.2 8.2 0 0 1-2.661-1.787a8.2 8.2 0 0 1-1.788-2.662L7.07 10.48c-.462.462-.693.692-.891.947a5.2 5.2 0 0 0-.599.969c-.139.291-.242.601-.449 1.22l-1.088 3.267a.848.848 0 0 0 1.073 1.073l3.266-1.088c.62-.207.93-.31 1.221-.45q.518-.246.969-.598c.255-.199.485-.43.947-.891m7.56-7.559a3.146 3.146 0 0 0-4.45-4.449l-.71.71l.031.09c.26.749.751 1.732 1.674 2.655A7 7 0 0 0 18.37 8.08z"/></svg>
                                    Edit
                                </button>
                                <button class="more-item" data-action="delete" role="menuitem">
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="currentColor" d="M3 6.524c0-.395.327-.714.73-.714h4.788c.006-.842.098-1.995.932-2.793A3.68 3.68 0 0 1 12 2a3.68 3.68 0 0 1 2.55 1.017c.834.798.926 1.951.932 2.793h4.788c.403 0 .73.32.73.714a.72.72 0 0 1-.73.714H3.73A.72.72 0 0 1 3 6.524"/><path fill="currentColor" fill-rule="evenodd" d="M11.596 22h.808c2.783 0 4.174 0 5.08-.886c.904-.886.996-2.34 1.181-5.246l.267-4.187c.1-1.577.15-2.366-.303-2.866c-.454-.5-1.22-.5-2.753-.5H8.124c-1.533 0-2.3 0-2.753.5s-.404 1.289-.303 2.866l.267 4.188c.185 2.906.277 4.36 1.182 5.245c.905.886 2.296.886 5.079.886m-1.35-9.811c-.04-.434-.408-.75-.82-.707c-.413.043-.713.43-.672.864l.5 5.263c.04.434.408.75.82.707c.413-.044.713-.43.672-.864zm4.329-.707c.412.043.713.43.671.864l-.5 5.263c-.04.434-.409.75-.82.707c-.413-.044-.713-.43-.672-.864l.5-5.264c.04-.433.409-.75.82-.707" clip-rule="evenodd"/></svg>
                                    Delete
                                </button>
                            </div>
                            <div class="more-options-mobile" role="menu">
                                <button class="more-item" data-action="edit" role="menuitem">
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="currentColor" fill-rule="evenodd" d="M3.25 22a.75.75 0 0 1 .75-.75h16a.75.75 0 0 1 0 1.5H4a.75.75 0 0 1-.75-.75" clip-rule="evenodd"/><path fill="currentColor" d="m11.52 14.929l5.917-5.917a8.2 8.2 0 0 1-2.661-1.787a8.2 8.2 0 0 1-1.788-2.662L7.07 10.48c-.462.462-.693.692-.891.947a5.2 5.2 0 0 0-.599.969c-.139.291-.242.601-.449 1.22l-1.088 3.267a.848.848 0 0 0 1.073 1.073l3.266-1.088c.62-.207.93-.31 1.221-.45q.518-.246.969-.598c.255-.199.485-.43.947-.891m7.56-7.559a3.146 3.146 0 0 0-4.45-4.449l-.71.71l.031.09c.26.749.751 1.732 1.674 2.655A7 7 0 0 0 18.37 8.08z"/></svg>
                                </button>
                                <button class="more-item" data-action="delete" role="menuitem">
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="currentColor" d="M3 6.524c0-.395.327-.714.73-.714h4.788c.006-.842.098-1.995.932-2.793A3.68 3.68 0 0 1 12 2a3.68 3.68 0 0 1 2.55 1.017c.834.798.926 1.951.932 2.793h4.788c.403 0 .73.32.73.714a.72.72 0 0 1-.73.714H3.73A.72.72 0 0 1 3 6.524"/><path fill="currentColor" fill-rule="evenodd" d="M11.596 22h.808c2.783 0 4.174 0 5.08-.886c.904-.886.996-2.34 1.181-5.246l.267-4.187c.1-1.577.15-2.366-.303-2.866c-.454-.5-1.22-.5-2.753-.5H8.124c-1.533 0-2.3 0-2.753.5s-.404 1.289-.303 2.866l.267 4.188c.185 2.906.277 4.36 1.182 5.245c.905.886 2.296.886 5.079.886m-1.35-9.811c-.04-.434-.408-.75-.82-.707c-.413.043-.713.43-.672.864l.5 5.263c.04.434.408.75.82.707c.413-.044.713-.43.672-.864zm4.329-.707c.412.043.713.43.671.864l-.5 5.263c-.04.434-.409.75-.82.707c-.413-.044-.713-.43-.672-.864l.5-5.264c.04-.433.409-.75.82-.707" clip-rule="evenodd"/></svg>
                                </button>
                            </div>
                        </div>
                    </div>`;

    // Add event listeners to buttons
    const toggleBtn = itemDiv.querySelector('[data-action="toggle"]');
    const deleteBtn = itemDiv.querySelector('[data-action="delete"]');
    const deleteBtnMobile = itemDiv.querySelector(
      '.more-options-mobile [data-action="delete"]'
    );
    const moreBtn = itemDiv.querySelector('[data-action="more"]');
    const moreMenu = itemDiv.querySelector(".more-options");
    const editBtn = itemDiv.querySelector('[data-action="edit"]');
    const editBtnMobile = itemDiv.querySelector(
      '.more-options-mobile [data-action="edit"]'
    );

    toggleBtn.addEventListener("click", function () {
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
    [toggleBtn, deleteBtn].forEach((btn) => {
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
  // Add a new item to the roadmap
  function addNewItem() {
    let title = document.getElementById("itemTitle").value;
    const language = languageSelect.value;
    const isValidLang = iconForLanguage(language);
    if (!language.trim() || !isValidLang) {
      errorLog.textContent = "Please select a valid language.";
      return;
    }
    title =
      title.trim() !== ""
        ? title.trim()
        : `Learn ${toUpperCaseFirstLetter(language)}`;

    if (editingItemId) {
      const itemLang = items.find((it) => it.id === editingItemId)?.language;
      if (itemLang !== language) {
        const exists = items.some((it) => it.language === language);
        if (exists) {
          errorLog.textContent = `Item with language "${language}" already exists.`;
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
            }
          : it
      );
    } else {
      const exists = items.some((it) => it.language === language);
      if (exists) {
        errorLog.textContent = `Item with language "${language}" already exists.`;
        return;
      }
      const newItem = {
        id: Date.now(), // Simple ID generation
        title: title,
        language: language,
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

  function openEditModal(item) {
    editingItemId = item.id;
    // prefill
    const titleInput = document.getElementById("itemTitle");
    if (titleInput) titleInput.value = item.title;
    if (languageSelect) {
      languageSelect.value = item.language;
      handleLanguageChange(item.language);
    }
    // labels
    const titleEl = document.getElementById("addItemTitle");
    if (titleEl) titleEl.textContent = "Edit Item";
    const submitBtn = itemForm
      ? itemForm.querySelector('button[type="submit"]')
      : null;
    if (submitBtn)
      submitBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" d="M22 10.5V12c0 4.714 0 7.071-1.465 8.535C19.072 22 16.714 22 12 22s-7.071 0-8.536-1.465C2 19.072 2 16.714 2 12s0-7.071 1.464-8.536C4.93 2 7.286 2 12 2h1.5"/><path d="m16.652 3.455l.649-.649A2.753 2.753 0 0 1 21.194 6.7l-.65.649m-3.892-3.893s.081 1.379 1.298 2.595c1.216 1.217 2.595 1.298 2.595 1.298m-3.893-3.893L10.687 9.42c-.404.404-.606.606-.78.829q-.308.395-.524.848c-.121.255-.211.526-.392 1.068L8.412 13.9m12.133-6.552l-5.965 5.965c-.404.404-.606.606-.829.78a4.6 4.6 0 0 1-.848.524c-.255.121-.526.211-1.068.392l-1.735.579m0 0l-1.123.374a.742.742 0 0 1-.939-.94l.374-1.122m1.688 1.688L8.412 13.9"/></g></svg> Save Changes`;
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
    const submitBtn = itemForm
      ? itemForm.querySelector('button[type="submit"]')
      : null;
    if (submitBtn)
      submitBtn.innerHTML = '<i class="fas fa-plus"></i> Add to Roadmap';
    languageSuggestions.style.display = "none";
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
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch (_) {}
  }

  // Initialize the application
  init();
});
