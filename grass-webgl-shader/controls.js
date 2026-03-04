"use strict";

const GR = window.GrassRenderer;

// ── PRESETS ────────────────────────────────────────────────────────────────
const PRESETS = {
    'Short Grass': {
        bladeCount: 5000, baseHeight: 0.25, heightVariance: 0.15, baseWidth: 0.04,
        hue: 115, brightness: 0.4, variance: 60, hueVariance: 15,
        windSpeed: 2.5, windIntensity: 0.04, windDirDeg: 45, patchiness: 0.5,
        viewDistance: 3, lodScale: 1.0,
    },
    'Windy Meadow': {
        bladeCount: 3000, baseHeight: 1.2, heightVariance: 0.5, baseWidth: 0.05,
        hue: 68, brightness: 0.5, variance: 50, hueVariance: 25,
        windSpeed: 4.0, windIntensity: 0.15, windDirDeg: 90, patchiness: 0.6,
        viewDistance: 3, lodScale: 1.5,
    },
    'Seaweed': {
        bladeCount: 2000, baseHeight: 1.6, heightVariance: 0.6, baseWidth: 0.09,
        hue: 175, brightness: 0.35, variance: 40, hueVariance: 20,
        windSpeed: 1.2, windIntensity: 0.12, windDirDeg: 180, patchiness: 0.4,
        viewDistance: 2, lodScale: 1.0,
    },
    'Dense Fur': {
        bladeCount: 22500, baseHeight: 0.4, heightVariance: 0.5, baseWidth: 0.01,
        hue: 25, brightness: 0.20, variance: 20, hueVariance: 0,
        windSpeed: 1.5, windIntensity: 0.02, windDirDeg: 30, patchiness: 0,
        viewDistance: 1, lodScale: 0.5,
    },
};

// ── INJECT STYLES ──────────────────────────────────────────────────────────
document.head.insertAdjacentHTML('beforeend', `<style>
#ctrl-panel {
  position: absolute; top: 12px; right: 12px; width: 230px;
  background: rgba(13,15,20,0.88); border: 1px solid #252a38;
  border-radius: 4px; font-family: 'Space Mono', monospace;
  font-size: 0.62rem; color: #9aa0bc; z-index: 10;
  backdrop-filter: blur(8px); user-select: none;
}
#ctrl-header {
  display: flex; justify-content: space-between; align-items: center;
  padding: 0.5rem 0.75rem; border-bottom: 1px solid #252a38;
  color: #7fff6a; letter-spacing: 0.08em;
  text-transform: uppercase; font-size: 0.6rem;
}
#ctrl-toggle {
  background: none; border: 1px solid #252a38; border-radius: 2px;
  color: #6b7290; font-family: inherit; font-size: 0.55rem;
  cursor: pointer; padding: 0.1rem 0.4rem;
}
#ctrl-toggle:hover { color: #e8eaf0; border-color: #7fff6a; }
#ctrl-body { padding: 0.5rem 0.75rem 0.75rem; }
.ctrl-section {
  font-size: 0.55rem; letter-spacing: 0.12em; color: #5bc8ff;
  text-transform: uppercase; margin: 0.6rem 0 0.35rem;
}
.ctrl-row { display: flex; flex-direction: column; margin-bottom: 0.45rem; }
.ctrl-row label {
  display: flex; justify-content: space-between; margin-bottom: 0.15rem;
}
.ctrl-row label span { color: #e8eaf0; }
.ctrl-row input[type=range] { width: 100%; accent-color: #7fff6a; cursor: pointer; }
.ctrl-row input[type=checkbox] {
  accent-color: #7fff6a; cursor: pointer; margin-top: 0.2rem;
}
.preset-grid {
  display: grid; grid-template-columns: 1fr 1fr; gap: 0.35rem; margin-top: 0.4rem;
}
.preset-btn {
  background: rgba(255,255,255,0.03); border: 1px solid #252a38;
  border-radius: 2px; color: #9aa0bc; font-family: inherit;
  font-size: 0.55rem; cursor: pointer; padding: 0.3rem 0.4rem;
  text-align: center; transition: all 0.15s; letter-spacing: 0.04em;
}
.preset-btn:hover { border-color: #7fff6a; color: #7fff6a; background: rgba(127,255,106,0.06); }
.preset-btn.active { border-color: #7fff6a; color: #7fff6a; background: rgba(127,255,106,0.1); }
</style>`);

// ── INJECT HTML ────────────────────────────────────────────────────────────
const controlCanvas = document.querySelector('canvas');
controlCanvas.parentElement.style.position = 'relative';
controlCanvas.parentElement.insertAdjacentHTML('beforeend', `
<div id="ctrl-panel">
  <div id="ctrl-header">
    <span>⚙ Controls</span>
    <button id="ctrl-toggle">▲ Hide</button>
  </div>
  <div id="ctrl-body">

    <div class="ctrl-section">Presets</div>
    <div class="preset-grid">
      <button class="preset-btn" data-preset="Short Grass">Short Grass</button>
      <button class="preset-btn" data-preset="Windy Meadow">Windy Meadow</button>
      <button class="preset-btn" data-preset="Seaweed">Seaweed</button>
      <button class="preset-btn" data-preset="Dense Fur">Dense Fur</button>
    </div>

    <div class="ctrl-section">Wind</div>
    <div class="ctrl-row"><label>Speed <span id="val-windSpeed">2.0</span></label>
      <input type="range" id="sl-windSpeed" min="1" max="8" step="0.1" value="2.0"></div>
    <div class="ctrl-row"><label>Intensity <span id="val-windIntensity">0.050</span></label>
      <input type="range" id="sl-windIntensity" min="0" max="0.3" step="0.005" value="0.05"></div>

    <div class="ctrl-section">Grass</div>
    <div class="ctrl-row"><label>Blades <span id="val-bladeCount">4000</span></label>
      <input type="range" id="sl-bladeCount" min="500" max="32768" step="100" value="4000"></div>
    <div class="ctrl-row"><label>Height <span id="val-baseHeight">0.60</span></label>
      <input type="range" id="sl-baseHeight" min="0.1" max="2.0" step="0.05" value="0.6"></div>
    <div class="ctrl-row"><label>Height Variance <span id="val-heightVariance">0.40</span></label>
      <input type="range" id="sl-heightVariance" min="0" max="1.5" step="0.05" value="0.4"></div>
    <div class="ctrl-row"><label>Width <span id="val-baseWidth">0.050</span></label>
      <input type="range" id="sl-baseWidth" min="0.01" max="0.15" step="0.005" value="0.05"></div>
    <div class="ctrl-row"><label>Patchiness <span id="val-patchiness">0.00</span></label>
      <input type="range" id="sl-patchiness" min="0" max="1" step="0.01" value="0"></div>

    <div class="ctrl-section">Color</div>
    <div class="ctrl-row"><label>Hue <span id="val-hue">120</span></label>
      <input type="range" id="sl-hue" min="0" max="360" step="1" value="120"></div>
    <div class="ctrl-row"><label>Brightness <span id="val-brightness">0.40</span></label>
      <input type="range" id="sl-brightness" min="0.1" max="0.5" step="0.01" value="0.4"></div>
    <div class="ctrl-row"><label>Brightness Variance <span id="val-variance">60</span></label>
      <input type="range" id="sl-variance" min="0" max="90" step="1" value="60"></div>
    <div class="ctrl-row"><label>Color Variance <span id="val-hueVariance">18</span></label>
      <input type="range" id="sl-hueVariance" min="0" max="90" step="1" value="18"></div>

    <div class="ctrl-section">Scene</div>
    <div class="ctrl-row"><label>LOD Distance <span id="val-lodScale">1.00</span></label>
      <input type="range" id="sl-lodScale" min="0.25" max="3" step="0.05" value="1"></div>
    <div class="ctrl-row" style="flex-direction:row;align-items:center;gap:0.5rem;">
      <label style="margin:0">Auto-pan</label>
      <input type="checkbox" id="cb-autoOrbit" checked>
    </div>

  </div>
</div>`);

// ── COLLAPSE TOGGLE ────────────────────────────────────────────────────────
document.getElementById('ctrl-toggle').addEventListener('click', () => {
    const body   = document.getElementById('ctrl-body');
    const toggle = document.getElementById('ctrl-toggle');
    const hidden = body.style.display === 'none';
    body.style.display = hidden ? 'block' : 'none';
    toggle.textContent = hidden ? '▲ Hide' : '▼ Show';
});

// ── SLIDER WIRING ──────────────────────────────────────────────────────────
function wireSlider(id, key, decimals, suffix = '', rebuild = false) {
    const slider = document.getElementById(`sl-${id}`);
    const label  = document.getElementById(`val-${id}`);
    slider.addEventListener('input', () => {
        GR.params[key] = parseFloat(slider.value);
        label.textContent = GR.params[key].toFixed(decimals) + suffix;
        document.querySelectorAll('.preset-btn').forEach(b => b.classList.remove('active'));
    });
    if (rebuild) slider.addEventListener('change', () => {
        GR.rebuildGrass();
    });
}

wireSlider('windSpeed',      'windSpeed',      1);
wireSlider('windIntensity',  'windIntensity',  3);
wireSlider('bladeCount',     'bladeCount',     0, '', true);
wireSlider('baseHeight',     'baseHeight',     2, '', true);
wireSlider('heightVariance', 'heightVariance', 2, '', true);
wireSlider('baseWidth',      'baseWidth',      3, '', true);
wireSlider('patchiness',     'patchiness',     2, '', true);
wireSlider('hue',            'hue',            0);
wireSlider('brightness',     'brightness',     2);
wireSlider('variance',       'variance',       0);
wireSlider('hueVariance',    'hueVariance',    0);
wireSlider('lodScale',       'lodScale',       2);

// ── AUTO-ORBIT CHECKBOX ────────────────────────────────────────────────────
document.getElementById('cb-autoOrbit').addEventListener('change', e => {
    window.SceneRenderer.setAutoOrbit(e.target.checked);
});

// ── PRESET HELPERS ─────────────────────────────────────────────────────────
function syncSlider(id, key, decimals, suffix = '') {
    const slider = document.getElementById(`sl-${id}`);
    const label  = document.getElementById(`val-${id}`);
    if (!slider) return;
    slider.value = GR.params[key];
    label.textContent = GR.params[key].toFixed(decimals) + suffix;
}

function applyPreset(name) {
    Object.assign(GR.params, PRESETS[name]);

    syncSlider('windSpeed',      'windSpeed',      1);
    syncSlider('windIntensity',  'windIntensity',  3);
    syncSlider('bladeCount',     'bladeCount',     0);
    syncSlider('baseHeight',     'baseHeight',     2);
    syncSlider('heightVariance', 'heightVariance', 2);
    syncSlider('baseWidth',      'baseWidth',      3);
    syncSlider('patchiness',     'patchiness',     2);
    syncSlider('hue',            'hue',            0);
    syncSlider('brightness',     'brightness',     2);
    syncSlider('variance',       'variance',       0);
    syncSlider('hueVariance',    'hueVariance',    0);
    syncSlider('lodScale',       'lodScale',       2);

    document.querySelectorAll('.preset-btn').forEach(b => {
        b.classList.toggle('active', b.dataset.preset === name);
    });

    GR.rebuildGrass();
}

document.querySelectorAll('.preset-btn').forEach(btn => {
    btn.addEventListener('click', () => applyPreset(btn.dataset.preset));
});