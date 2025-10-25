document.addEventListener("DOMContentLoaded", function () {
  // DOM Elements
  const roadmapItems = document.getElementById("roadmapItems");
  const emptyState = document.getElementById("emptyState");
  const addItemForm = document.getElementById("addItemForm");
  const itemForm = document.getElementById("itemForm");
  const languageSelect = document.getElementById("languageSelect");
  const languagesGrid = document.getElementById("languagesGrid");
  const progressFill = document.getElementById("progressFill");
  const progressPercent = document.getElementById("progressPercent");
  const addItemBtn = document.getElementById("addItemBtn");
  const themeToggle = document.getElementById("themeToggle");
  const addItemModal = document.getElementById("addItemModal");
  const closeModalBtn = document.getElementById("closeModalBtn");
  const languageIcon = document.querySelector(".language-icon");
  const customLanguageGroup = document.getElementById("customLanguageGroup");
  const customLanguageName = document.getElementById("customLanguageName");
  const searchInput = document.getElementById("searchInput");
  const changeViewBtn = document.getElementById("changeViewBtn");
  let draggingId = null;
  let searchQuery = "";
  let defaultEmptyHTML = null;
  let editingItemId = null;

  // Data
  const STORAGE_KEY = "my-roadmap-items";
  let items = [];

  // Language icons mapping
  const languageIcons = {
    html: '<i class="fab fa-html5" style="color: #e34f26;"></i>',
    css: '<i class="fab fa-css3-alt" style="color: #1572b6;"></i>',
    javascript: '<i class="fab fa-js-square" style="color: #f7df1e;"></i>',
    python: '<i class="fab fa-python" style="color: #3776ab;"></i>',
    java: '<i class="fab fa-java" style="color: #007396;"></i>',
    react: '<i class="fab fa-react" style="color: #61dafb;"></i>',
    node: '<i class="fab fa-node-js" style="color: #339933;"></i>',
    custom: '<i class="fas fa-code" style="color: #a1a1aa;"></i>',
  };

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
    if (roadmapItems) roadmapItems.setAttribute("role", "list");

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

  function toggleView() {
    if (roadmapItems.contains(emptyState)) return;
    let isGridView = roadmapItems.classList.contains("grid-view");
    roadmapItems.classList.toggle("grid-view");
    changeViewBtn.innerHTML = isGridView
      ? `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
          <path fill="currentColor"
              d="M2 6.5c0-2.121 0-3.182.659-3.841S4.379 2 6.5 2s3.182 0 3.841.659S11 4.379 11 6.5s0 3.182-.659 3.841S8.621 11 6.5 11s-3.182 0-3.841-.659S2 8.621 2 6.5m11 11c0-2.121 0-3.182.659-3.841S15.379 13 17.5 13s3.182 0 3.841.659S22 15.379 22 17.5s0 3.182-.659 3.841S19.621 22 17.5 22s-3.182 0-3.841-.659S13 19.621 13 17.5m-11 0c0-2.121 0-3.182.659-3.841S4.379 13 6.5 13s3.182 0 3.841.659S11 15.379 11 17.5s0 3.182-.659 3.841S8.621 22 6.5 22s-3.182 0-3.841-.659S2 19.621 2 17.5m11-11c0-2.121 0-3.182.659-3.841S15.379 2 17.5 2s3.182 0 3.841.659S22 4.379 22 6.5s0 3.182-.659 3.841S19.621 11 17.5 11s-3.182 0-3.841-.659S13 8.621 13 6.5" />
      </svg>`
      : `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
          <path fill="currentColor"
              d="M7.624 4.449C9.501 3.698 10.621 3.25 12 3.25s2.499.448 4.376 1.199l2.97 1.188c.954.382 1.727.69 2.258.969c.268.14.528.3.729.493c.206.198.417.498.417.901s-.21.703-.417.901c-.2.193-.46.352-.73.493c-.53.278-1.303.587-2.258.97l-2.97 1.187C14.5 12.302 13.38 12.75 12 12.75s-2.499-.448-4.376-1.199l-2.969-1.188c-.955-.382-1.728-.69-2.259-.969a3.2 3.2 0 0 1-.729-.493C1.461 8.703 1.25 8.403 1.25 8s.21-.703.417-.901c.2-.193.46-.352.73-.493c.53-.278 1.303-.587 2.258-.97z" />
          <path fill="currentColor" fill-rule="evenodd"
              d="M2.5 11.442v-.002l.003.003l.024.021q.036.03.118.094c.109.084.278.208.508.357c.46.299 1.161.697 2.104 1.074l2.809 1.123c2.025.81 2.874 1.138 3.934 1.138s1.91-.328 3.934-1.138l2.809-1.123a12 12 0 0 0 2.104-1.074a8 8 0 0 0 .65-.472l.003-.002l.001-.001a.75.75 0 0 1 1 1.118L22 12l.5.558v.002l-.002.001l-.005.004l-.014.012l-.045.039a9 9 0 0 1-.77.558A13.7 13.7 0 0 1 19.3 14.38l-2.809 1.124l-.115.046c-1.877.751-2.997 1.199-4.376 1.199s-2.499-.448-4.376-1.199l-.115-.046L4.7 14.38a13.7 13.7 0 0 1-2.363-1.207a9 9 0 0 1-.771-.558l-.045-.039l-.014-.012l-.005-.004l-.001-.002H1.5L2 12l-.5.559a.75.75 0 0 1 1-1.119m-.001 4a.75.75 0 0 0-1.057.06zm0 0l.004.003l.024.021q.036.03.118.094c.109.084.278.208.508.357c.46.299 1.161.696 2.104 1.074l2.809 1.123c2.025.81 2.874 1.138 3.934 1.138s1.91-.328 3.934-1.138l2.809-1.123a12 12 0 0 0 2.104-1.074a8 8 0 0 0 .65-.472l.003-.002l.001-.001a.75.75 0 0 1 1 1.118l-.484-.54l.484.54l-.002.002l-.001.001l-.005.004l-.014.012q-.016.015-.045.038a9 9 0 0 1-.77.558a13.7 13.7 0 0 1-2.364 1.208l-2.809 1.124l-.115.046c-1.877.751-2.997 1.199-4.376 1.199s-2.499-.448-4.376-1.199l-.115-.046L4.7 18.38a13.7 13.7 0 0 1-2.363-1.207a9 9 0 0 1-.771-.558l-.045-.039l-.014-.012l-.005-.004l-.001-.002H1.5L2 16l-.5.559a.75.75 0 0 1-.058-1.06"
              clip-rule="evenodd" />
      </svg>`;
  }

  // Render all roadmap items (respects search filter)
  function renderItems() {
    const list = getFilteredItems();
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
      const hay = `${it.title} ${it.customName || ""} ${
        it.language
      }`.toLowerCase();
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

    const iconHTML = languageIcons[item.language] || languageIcons.custom;

    itemDiv.innerHTML = `
                    <div class="item-header">
                        <div class="item-icon">${iconHTML}</div>
                        <div class="item-content">
                            <div class="item-title">${item.title}</div>
                            <div class="item-status">${
                              (item.completed ? "Completed" : "In Progress") +
                              (item.language === "custom" && item.customName
                                ? ` • ${item.customName}`
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
      itemDiv.classList.add("drag-over");
    });

    itemDiv.addEventListener("dragleave", () => {
      dragEnterCounter--;
      if (dragEnterCounter === 0) {
        itemDiv.classList.remove("drag-over");
      }
    });

    itemDiv.addEventListener("dragover", (e) => {
      e.preventDefault();
      if (e.dataTransfer) e.dataTransfer.dropEffect = "move";
    });

    itemDiv.addEventListener("drop", (e) => {
      e.preventDefault();
      dragEnterCounter = 0;
      itemDiv.classList.remove("drag-over");

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
        .querySelectorAll(".roadmap-item.drag-over")
        .forEach((el) => el.classList.remove("drag-over"));
    });

    return itemDiv;
  }

  function reorderItems(srcId, targetId) {
    const srcIndex = items.findIndex((it) => it.id === srcId);
    const targetIndex = items.findIndex((it) => it.id === targetId);
    if (srcIndex < 0 || targetIndex < 0) return;
    const [moved] = items.splice(srcIndex, 1);
    items.splice(targetIndex, 0, moved);
    renderItems();
    updateProgress();
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
    const customName = customLanguageName ? customLanguageName.value : "";
    title =
      title.trim() !== ""
        ? title.trim()
        : `Learn ${toUpperCaseFirstLetter(customName || language)}`;

    // if (!title.trim()) return;
    if (language === "custom" && !customName.trim()) {
      // Show field if hidden and focus
      if (customLanguageGroup) customLanguageGroup.classList.remove("hidden");
      if (customLanguageName) customLanguageName.focus();
      return;
    }

    if (editingItemId) {
      // Update existing item
      items = items.map((it) =>
        it.id === editingItemId
          ? {
              ...it,
              title: title,
              language: language,
              customName: language === "custom" ? customName.trim() : undefined,
            }
          : it
      );
    } else {
      const newItem = {
        id: Date.now(), // Simple ID generation
        title: title,
        language: language,
        customName: language === "custom" ? customName.trim() : undefined,
        completed: false,
      };
      items.push(newItem);
    }
    renderItems();
    updateProgress();
    saveItems();

    // Reset form
    itemForm.reset();
    // Reset custom language UI
    if (customLanguageGroup) customLanguageGroup.classList.add("hidden");
    if (customLanguageName) customLanguageName.removeAttribute("required");
    handleLanguageChange(languageSelect.value);
    // Close modal and reset editing state
    closeModal();
  }

  // Toggle item completion status
  function toggleItemCompletion(id) {
    items = items.map((item) => {
      if (item.id === id) {
        return { ...item, completed: !item.completed };
      }
      return item;
    });

    renderItems();
    updateProgress();
    saveItems();
  }

  // Delete an item
  function deleteItem(id) {
    items = items.filter((item) => item.id !== id);
    renderItems();
    updateProgress();
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
    if (customLanguageName) {
      customLanguageName.value = item.customName || "";
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
  }

  function isModalOpen() {
    return addItemModal && addItemModal.classList.contains("open");
  }

  function handleLanguageChange(value) {
    const isCustom = value === "custom";
    if (customLanguageGroup) {
      customLanguageGroup.classList.toggle("hidden", !isCustom);
    }
    if (customLanguageName) {
      if (isCustom) customLanguageName.setAttribute("required", "true");
      else customLanguageName.removeAttribute("required");
    }

    if (languageIcon) {
      languageIcon.innerHTML = languageIcons[value] || languageIcons.custom;
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
    return [
      { id: 1, title: "Learn HTML", language: "html", completed: true },
      { id: 2, title: "Learn CSS", language: "css", completed: true },
      {
        id: 3,
        title: "Learn JavaScript",
        language: "javascript",
        completed: false,
      },
    ];
  }

  function saveItems() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch (_) {}
  }

  // Initialize the application
  init();
});
