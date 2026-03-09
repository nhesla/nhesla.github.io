// assets/nav.js
// Shared navigation — edit this file to add/remove projects from all pages.

const NAV_PROJECTS = [
  { label: "Tower Defense",    href: "TowerDefense/index.html" },
  { label: "Tank Game",        href: "phaser-tank-game/index.html" },
  { label: "Vulcan's Suit",    href: "Vulcans_bad_suit_v1.i/index.html" },
  { label: "Grass Shader",     href: "grass-webgl-shader/index.html" },
  { label: "Deck Investigator",href: "react-app-deck-investigator/index.html" },
  { label: "Tax Dodgers",      href: "TaxDodgers_Godot/index.html" },
];

(function () {
  // Detect depth: project pages are one level deep, root is zero.
  const path = window.location.pathname;

  // Count how many folder segments deep we are relative to the repo root.
  // GitHub Pages serves from /nhesla.github.io/ or just /, so we strip
  // any leading slash and look at segments.
  const segments = path.replace(/^\//, "").split("/").filter(Boolean);
  // If the last segment is index.html or similar, it's not a folder name
  const depth = segments.length > 0 && segments[segments.length - 1].includes(".html")
    ? segments.length - 1
    : segments.length;

  const prefix = depth > 0 ? "../" : "";

  // Detect the active page by comparing hrefs
  const currentPath = path.replace(/\/$/, "/index.html");

  const pills = NAV_PROJECTS.map(({ label, href }) => {
    const fullHref = prefix + href;
    // Check if this pill matches the current page
    const isActive = currentPath.endsWith(href.replace(/^\.\.\//, ""));
    return `<a href="${fullHref}" class="nav-pill${isActive ? " active" : ""}">${label}</a>`;
  }).join("\n      ");

  const challengesHref = prefix + "challenges/index.html";
  const homeHref = prefix + "index.html";

  const html = `<nav class="site-nav">
    <a href="${homeHref}" class="nav-home">nhesla</a>
    <div class="nav-project-links">
      ${pills}
    </div>
    <a href="${challengesHref}" class="nav-challenges-link">&gt;_ Challenges</a>
  </nav>`;

  const placeholder = document.getElementById("site-nav");
  if (placeholder) placeholder.outerHTML = html;
})();
