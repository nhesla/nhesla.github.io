"use strict";

// ── HEIGHTMAP ──────────────────────────────────────────────────────────────
function getHeight(x, z) {
    return (
        Math.sin(x * 0.7 + 0.5) * 0.4 +
        Math.sin(z * 0.5 - 0.3) * 0.5 +
        Math.sin((x + z) * 0.4) * 0.3 +
        Math.sin((x - z) * 0.3 + 1.0) * 0.25
    );
}

// ── GROUND SHADER ──────────────────────────────────────────────────────────
const groundVertSrc = `#version 300 es
uniform mat4 model;
uniform mat4 view;
uniform mat4 project;
in vec3 p;
out vec3 vPos;
void main() {
    vPos = p;
    gl_Position = project * view * model * vec4(p, 1.0);
}`;

const groundFragSrc = `#version 300 es
precision mediump float;

uniform float hue;
uniform float brightness;
uniform float variance;
uniform float patchiness;
uniform float noiseScale;
uniform float sharpness;
uniform float densityBias;
uniform float camX;
uniform float camZ;

in vec3 vPos;
out vec4 fragColor;

float hashNoise(vec2 p) {
    float n = sin(dot(p, vec2(127.1, 311.7))) * 43758.5453;
    return fract(n) * 2.0 - 1.0;
}

float smoothNoise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    float a = hashNoise(i);
    float b = hashNoise(i + vec2(1.0, 0.0));
    float c = hashNoise(i + vec2(0.0, 1.0));
    float d = hashNoise(i + vec2(1.0, 1.0));
    return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}

vec3 hslToRgb(float h, float s, float l) {
    s /= 100.0; l /= 100.0;
    float a = s * min(l, 1.0 - l);
    float rk = mod(h / 30.0,       12.0);
    float gk = mod(8.0 + h / 30.0, 12.0);
    float bk = mod(4.0 + h / 30.0, 12.0);
    float r = l - a * max(-1.0, min(min(rk - 3.0, 9.0 - rk), 1.0));
    float g = l - a * max(-1.0, min(min(gk - 3.0, 9.0 - gk), 1.0));
    float b = l - a * max(-1.0, min(min(bk - 3.0, 9.0 - bk), 1.0));
    return vec3(r, g, b);
}

float posRand(vec2 pos) {
    return fract(sin(dot(pos, vec2(127.1, 311.7))) * 43758.5453);
}

void main() {
    float fragDist = length(vec2(vPos.x - camX, vPos.z - camZ));

    // Coarsen noise with distance — far fragments read as smooth blended color
    float adaptiveScale = noiseScale / (1.0 + fragDist * 0.15);

    float rand = posRand(vec2(vPos.x, vPos.z));

    // Dirt — tinted slightly toward grass even in bare patches
    vec3 dirt = vec3(0.35 + rand * 0.08, 0.22 + rand * 0.06, 0.10 + rand * 0.04);

    // Grass color
    float bladeLit = clamp(brightness * 100.0 + (rand - 0.5) * variance, 5.0, 50.0);
    vec3  grass    = hslToRgb(hue, 100.0, bladeLit * 0.85);

    // Soften dirt toward grass so bare patches don't contrast so harshly
    dirt = mix(dirt, grass, 0.25);

    // Coverage using adaptive noise scale
    float n01    = (smoothNoise(vec2(vPos.x, vPos.z) * adaptiveScale) + 1.0) * 0.5;
    float shaped = pow(n01, sharpness);
    float cover  = clamp(densityBias + shaped * sqrt(patchiness), 0.0, 1.0);

    fragColor = vec4(mix(dirt, grass, cover), 1.0);
}`;

// ── SKY SHADER ─────────────────────────────────────────────────────────────
const skyVertSrc = `#version 300 es
in vec2 p;
out vec2 vUv;
void main() {
    vUv = p * 0.5 + 0.5;
    gl_Position = vec4(p, 1.0, 1.0);
}`;

const skyFragSrc = `#version 300 es
precision mediump float;
in vec2 vUv;
out vec4 fragColor;
void main() {
    vec3 horizon = vec3(0.76, 0.89, 0.98);
    vec3 zenith  = vec3(0.28, 0.55, 0.82);
    fragColor = vec4(mix(horizon, zenith, vUv.y), 1.0);
}`;

// ── GROUND MESH ────────────────────────────────────────────────────────────
function generateGroundMesh(totalWidth, totalDepth, subX, subZ) {
    const vertices = [];
    const indices  = [];
    const cols     = subX + 1;
    const rows     = subZ + 1;

    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
            const x = (col / subX - 0.5) * totalWidth;
            const z = (row / subZ - 0.5) * totalDepth;
            vertices.push(x, getHeight(x, z), z);
        }
    }

    for (let row = 0; row < subZ; row++) {
        if (row > 0) {
            indices.push(row * cols + cols - 1);
            indices.push(row * cols + cols - 1);
            indices.push((row + 1) * cols);
            indices.push((row + 1) * cols);
        }
        for (let col = 0; col < cols; col++) {
            indices.push((row + 1) * cols + col);
            indices.push(row       * cols + col);
        }
    }

    return {
        vertices: new Float32Array(vertices),
        indices:  new Uint16Array(indices),
    };
}

// ── WEBGL SETUP ────────────────────────────────────────────────────────────
const canvas = document.querySelector('canvas');
const gl     = canvas.getContext('webgl2');

function buildProgram(vertSrc, fragSrc) {
    function compile(type, src) {
        const s = gl.createShader(type);
        gl.shaderSource(s, src);
        gl.compileShader(s);
        if (!gl.getShaderParameter(s, gl.COMPILE_STATUS))
            console.error(gl.getShaderInfoLog(s));
        return s;
    }
    const prog = gl.createProgram();
    gl.attachShader(prog, compile(gl.VERTEX_SHADER,   vertSrc));
    gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, fragSrc));
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS))
        console.error(gl.getProgramInfoLog(prog));
    return prog;
}

const groundProgram = buildProgram(groundVertSrc, groundFragSrc);
const gnd = {
    p:           gl.getAttribLocation(groundProgram,  'p'),
    model:       gl.getUniformLocation(groundProgram, 'model'),
    view:        gl.getUniformLocation(groundProgram, 'view'),
    project:     gl.getUniformLocation(groundProgram, 'project'),
    hue:         gl.getUniformLocation(groundProgram, 'hue'),
    brightness:  gl.getUniformLocation(groundProgram, 'brightness'),
    variance:    gl.getUniformLocation(groundProgram, 'variance'),
    patchiness:  gl.getUniformLocation(groundProgram, 'patchiness'),
    noiseScale:  gl.getUniformLocation(groundProgram, 'noiseScale'),
    sharpness:   gl.getUniformLocation(groundProgram, 'sharpness'),
    densityBias: gl.getUniformLocation(groundProgram, 'densityBias'),
    camX: gl.getUniformLocation(groundProgram, 'camX'),
    camZ: gl.getUniformLocation(groundProgram, 'camZ'),
};

const skyProgram = buildProgram(skyVertSrc, skyFragSrc);
const skyPLoc    = gl.getAttribLocation(skyProgram, 'p');
const skyVerts   = new Float32Array([-1,-1, 1,-1, -1,1, 1,1]);
const skyVBO     = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, skyVBO);
gl.bufferData(gl.ARRAY_BUFFER, skyVerts, gl.STATIC_DRAW);

let groundVBO        = gl.createBuffer();
let groundIBO        = gl.createBuffer();
let groundIndexCount = 0;

function rebuildGround() {
    const rings    = window.GrassRenderer.params.viewDistance;
    const gridSize = (2 * rings + 1) * 5;
    const subDiv   = Math.min(200, gridSize * 6);
    const mesh     = generateGroundMesh(gridSize, gridSize, subDiv, subDiv);
    groundIndexCount = mesh.indices.length;
    gl.bindBuffer(gl.ARRAY_BUFFER, groundVBO);
    gl.bufferData(gl.ARRAY_BUFFER, mesh.vertices, gl.STATIC_DRAW);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, groundIBO);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, mesh.indices, gl.STATIC_DRAW);
}

window.GrassRenderer.init(gl, getHeight);
rebuildGround();

gl.enable(gl.DEPTH_TEST);

// ── CAMERA ─────────────────────────────────────────────────────────────────
let camAngle   = 0;
let camPitch   = 0.35;
let camRadius  = 12;
let autoOrbit  = true;
let isDragging = false;
let lastMouseX = 0;
let lastMouseY = 0;
let camTargetX = 0;
let camTargetZ = 0;

const CAM_SPEED = 4.0;
const keys      = {};

window.addEventListener('keydown', e => {
    keys[e.key.toLowerCase()] = true;
    if (['w','a','s','d'].includes(e.key.toLowerCase()) && autoOrbit) {
        autoOrbit = false;
        const cb = document.getElementById('cb-autoOrbit');
        if (cb) cb.checked = false;
    }
});
window.addEventListener('keyup', e => { keys[e.key.toLowerCase()] = false; });

canvas.addEventListener('mousedown', e => {
    isDragging = true;
    autoOrbit  = false;
    lastMouseX = e.clientX;
    lastMouseY = e.clientY;
    const cb = document.getElementById('cb-autoOrbit');
    if (cb) cb.checked = false;
});
window.addEventListener('mouseup',   () => { isDragging = false; });
window.addEventListener('mousemove', e => {
    if (!isDragging) return;
    camAngle -= (e.clientX - lastMouseX) * 0.005;
    camPitch   = Math.max(0.05, Math.min(Math.PI / 2 - 0.05,
                 camPitch + (e.clientY - lastMouseY) * 0.005));
    lastMouseX = e.clientX;
    lastMouseY = e.clientY;
});
canvas.addEventListener('wheel', e => {
    camRadius = Math.max(1.5, Math.min(40, camRadius + e.deltaY * 0.01));
    e.preventDefault();
}, { passive: false });

// ── MOVEMENT ───────────────────────────────────────────────────────────────
let lastTime = performance.now();

function updateMovement() {
    const now = performance.now();
    const dt  = Math.min((now - lastTime) / 1000, 0.05);
    lastTime  = now;

    if (autoOrbit) return;
    if (!keys['w'] && !keys['a'] && !keys['s'] && !keys['d']) return;

    const fwdX =  Math.sin(camAngle);
    const fwdZ =  Math.cos(camAngle);
    const rgtX =  Math.cos(camAngle);
    const rgtZ = -Math.sin(camAngle);

    let dx = 0, dz = 0;
    if (keys['w']) { dx -= fwdX; dz -= fwdZ; }
    if (keys['s']) { dx += fwdX; dz += fwdZ; }
    if (keys['a']) { dx -= rgtX; dz -= rgtZ; }
    if (keys['d']) { dx += rgtX; dz += rgtZ; }

    const len = Math.sqrt(dx * dx + dz * dz);
    if (len > 0) { dx /= len; dz /= len; }

    camTargetX += dx * CAM_SPEED * dt;
    camTargetZ += dz * CAM_SPEED * dt;
}

// ── DRAW LOOP ──────────────────────────────────────────────────────────────
function draw() {
    updateMovement();

    if (autoOrbit) camAngle += 0.005;

    const eyeX = camTargetX + Math.sin(camAngle) * Math.cos(camPitch) * camRadius;
    const eyeY = Math.sin(camPitch) * camRadius;
    const eyeZ = camTargetZ + Math.cos(camAngle) * Math.cos(camPitch) * camRadius;

    const eye         = [eyeX, eyeY, eyeZ];
    const target      = [camTargetX, 0, camTargetZ];
    const viewMatrix  = m4.inverse(m4.lookAt(eye, target, [0, 1, 0]));
    const projMatrix  = m4.perspective(
        Math.PI / 4, canvas.clientWidth / canvas.clientHeight, 0.1, 200);
    const modelMatrix = m4.identity();

    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // Sky
    gl.depthMask(false);
    gl.useProgram(skyProgram);
    gl.bindBuffer(gl.ARRAY_BUFFER, skyVBO);
    gl.vertexAttribPointer(skyPLoc, 2, gl.FLOAT, false, 8, 0);
    gl.enableVertexAttribArray(skyPLoc);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    gl.depthMask(true);

    // Ground — pass grass params so impostor matches blade placement
    const gp        = window.GrassRenderer.params;
    const p         = Math.sqrt(gp.patchiness);
    const sharpness = 1.0 + p * 8.0;

    gl.enable(gl.POLYGON_OFFSET_FILL);
    gl.polygonOffset(1.0, 1.0);
    gl.useProgram(groundProgram);
    gl.uniformMatrix4fv(gnd.model,   false, modelMatrix);
    gl.uniformMatrix4fv(gnd.view,    false, viewMatrix);
    gl.uniformMatrix4fv(gnd.project, false, projMatrix);
    gl.uniform1f(gnd.hue,         gp.hue);
    gl.uniform1f(gnd.brightness,  gp.brightness);
    gl.uniform1f(gnd.variance,    gp.variance);
    gl.uniform1f(gnd.patchiness,  gp.patchiness);
    gl.uniform1f(gnd.noiseScale,  0.8);
    gl.uniform1f(gnd.sharpness,   sharpness);
    gl.uniform1f(gnd.densityBias, 1.0 - p);
    gl.uniform1f(gnd.camX, camTargetX);
    gl.uniform1f(gnd.camZ, camTargetZ);
    gl.bindBuffer(gl.ARRAY_BUFFER,         groundVBO);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, groundIBO);
    gl.vertexAttribPointer(gnd.p, 3, gl.FLOAT, false, 12, 0);
    gl.enableVertexAttribArray(gnd.p);
    gl.drawElements(gl.TRIANGLE_STRIP, groundIndexCount, gl.UNSIGNED_SHORT, 0);
    gl.disable(gl.POLYGON_OFFSET_FILL);

    // Grass
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
    window.GrassRenderer.draw(viewMatrix, projMatrix, camTargetX, camTargetZ);

    requestAnimationFrame(draw);
}
draw();

// ── PUBLIC API ─────────────────────────────────────────────────────────────
window.SceneRenderer = {
    setAutoOrbit:  v => {
        autoOrbit = v;
        lastTime  = performance.now();
    },
    rebuildGround: rebuildGround,
};