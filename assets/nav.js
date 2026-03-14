// assets/nav.js
// Edit NAV_PROJECTS to add/remove/disable projects across all pages.

const NAV_PROJECTS = [
  { label: "Tower Defense",     href: "TowerDefense/index.html",                icon: "🗼", lang: "Java · Applet",         color: "rgba(255,107,107,0.1)", category: "games",       disabled: true },
  { label: "Tank Game",         href: "phaser-tank-game/index.html",            icon: "🚀", lang: "JavaScript · Phaser.js", color: "rgba(91,200,255,0.1)",  category: "games"       },
  { label: "Vulcan's Suit",     href: "Vulcans_bad_suit_v1.i/index.html",       icon: "💣", lang: "GameMaker",              color: "rgba(200,150,255,0.1)", category: "games",       disabled: true },
  { label: "Tax Dodgers",       href: "TaxDodgers_Godot/index.html",            icon: "🧾", lang: "Godot · GDScript",       color: "rgba(100,220,150,0.1)", category: "games"       },
  { label: "Math Boogers",      href: "MathBoogers/index.html",                 icon: "🟢", lang: "JavaScript",             color: "rgba(168,224,99,0.1)",  category: "games"       },
  { label: "Grass Shader",      href: "grass-webgl-shader/index.html",          icon: "🌿", lang: "WebGL · GLSL",           color: "rgba(127,255,106,0.1)", category: "interactive" },
  { label: "Deck Investigator", href: "react-app-deck-investigator/index.html", icon: "🃏", lang: "React · TypeScript",     color: "rgba(255,200,50,0.1)",  category: "interactive" },
];

(function () {

  // ── Path helpers ──────────────────────────────────────────────────────────
  const path     = window.location.pathname;
  const segments = path.replace(/^\//, "").split("/").filter(Boolean);
  const depth    = segments.length > 0 && segments[segments.length - 1].includes(".html")
    ? segments.length - 1 : segments.length;
  const prefix   = depth > 0 ? "../" : "";
  const currPath = path.replace(/\/$/, "/index.html");
  const isActive  = (href) => currPath.endsWith(href);
  const anyActive = (list) => list.some(p => isActive(p.href));

  const active      = NAV_PROJECTS.filter(p => !p.disabled);
  const games       = active.filter(p => p.category === "games");
  const interactive = active.filter(p => p.category === "interactive");

  // ── Styles ────────────────────────────────────────────────────────────────
  document.head.insertAdjacentHTML("beforeend", `<style>
    .nav-dropdown { position: relative; display: inline-flex; }
    .nav-dropdown-btn {
      background: none;
      border: 1px solid transparent;
      font-family: var(--mono);
      font-size: .62rem;
      letter-spacing: .05em;
      color: var(--muted);
      cursor: pointer;
      padding: .28rem .7rem;
      border-radius: var(--radius);
      white-space: nowrap;
      display: inline-flex;
      align-items: center;
      gap: 4px;
      transition: color .15s, border-color .15s, background .15s;
    }
    .nav-dropdown-btn:hover { color: var(--text); border-color: var(--border); }
    .nav-dropdown-btn.active { color: var(--accent); border-color: var(--accent); background: rgba(127,255,106,.06); }
    .nav-caret { font-size: .55rem; opacity: .6; display: inline-block; transition: transform .15s; }
    .nav-dropdown-menu {
      display: none;
      position: absolute;
      top: calc(100% + 6px);
      left: 0;
      background: #0e1018;
      border: 1px solid var(--border);
      border-radius: 4px;
      min-width: 170px;
      padding: 4px 0;
      z-index: 999;
      box-shadow: 0 8px 32px rgba(0,0,0,.7);
    }
    .nav-dropdown-item {
      display: block;
      padding: 7px 14px;
      font-family: var(--mono);
      font-size: .62rem;
      letter-spacing: .05em;
      color: var(--muted);
      text-decoration: none;
      white-space: nowrap;
      transition: color .1s, background .1s;
    }
    .nav-dropdown-item:hover { color: var(--text); background: var(--surface2); }
    .nav-dropdown-item.active { color: var(--accent); }
  </style>`);

  // ── Build a dropdown ──────────────────────────────────────────────────────
  function makeDropdown(label, projects) {
    const wrap = document.createElement("div");
    wrap.className = "nav-dropdown";

    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "nav-dropdown-btn" + (anyActive(projects) ? " active" : "");
    btn.innerHTML = label + ' <span class="nav-caret">▾</span>';
    wrap.appendChild(btn);

    const menu = document.createElement("div");
    menu.className = "nav-dropdown-menu";
    projects.forEach(({ label: l, href }) => {
      const a = document.createElement("a");
      a.href = prefix + href;
      a.className = "nav-dropdown-item" + (isActive(href) ? " active" : "");
      a.textContent = l;
      menu.appendChild(a);
    });
    wrap.appendChild(menu);

    btn.addEventListener("click", function (e) {
      e.stopPropagation();
      const isOpen = menu.style.display === "block";
      closeAll();
      if (!isOpen) {
        menu.style.display = "block";
        btn.querySelector(".nav-caret").style.transform = "rotate(180deg)";
      }
    });

    return wrap;
  }

  function closeAll() {
    document.querySelectorAll(".nav-dropdown-menu").forEach(m => m.style.display = "none");
    document.querySelectorAll(".nav-caret").forEach(c => c.style.transform = "");
  }
  document.addEventListener("click", closeAll);

  // ── Build nav ─────────────────────────────────────────────────────────────
  const navPlaceholder = document.getElementById("site-nav");
  if (navPlaceholder) {
    const nav = document.createElement("nav");
    nav.className = "site-nav";

    const home = document.createElement("a");
    home.href = prefix + "index.html";
    home.className = "nav-home";
    home.textContent = "nhesla";
    nav.appendChild(home);

    const links = document.createElement("div");
    links.className = "nav-project-links";
    links.appendChild(makeDropdown("Interactive", interactive));
    links.appendChild(makeDropdown("Games", games));
    nav.appendChild(links);

    const challenges = document.createElement("a");
    challenges.href = prefix + "challenges/index.html";
    challenges.className = "nav-challenges-link";
    challenges.textContent = ">_ Challenges";
    nav.appendChild(challenges);

    navPlaceholder.replaceWith(nav);
  }

  // ── Other Projects row ────────────────────────────────────────────────────
  const rowPlaceholder = document.getElementById("other-projects");
  if (rowPlaceholder) {
    const row = document.createElement("div");
    row.className = "project-nav-row";

    const rowLabel = document.createElement("span");
    rowLabel.className = "project-nav-label";
    rowLabel.textContent = "Other Projects";
    row.appendChild(rowLabel);

    active
      .filter(({ href }) => !isActive(href))
      .forEach(({ label, href, icon, lang, color }) => {
        const a = document.createElement("a");
        a.href = prefix + href;
        a.className = "proj-mini-card";
        a.innerHTML = `
          <div class="mini-thumb" style="background:${color}">${icon}</div>
          <div>
            <div class="mini-name">${label}</div>
            <div class="mini-lang">${lang}</div>
          </div>`;
        row.appendChild(a);
      });

    rowPlaceholder.replaceWith(row);
  }

})();