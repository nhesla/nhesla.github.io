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

uniform float groundH;
uniform float groundS;
uniform float groundL;

in vec3 vPos;
out vec4 fragColor;

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

void main() {
    fragColor = vec4(hslToRgb(groundH, groundS, groundL), 1.0);
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
const gl     = canvas.getContext('webgl2', { antialias: false });

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
    p:       gl.getAttribLocation(groundProgram,  'p'),
    model:   gl.getUniformLocation(groundProgram, 'model'),
    view:    gl.getUniformLocation(groundProgram, 'view'),
    project: gl.getUniformLocation(groundProgram, 'project'),
    groundH: gl.getUniformLocation(groundProgram, 'groundH'),
    groundS: gl.getUniformLocation(groundProgram, 'groundS'),
    groundL: gl.getUniformLocation(groundProgram, 'groundL'),
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

function resizeCanvas() {
    const dpr = window.devicePixelRatio || 1;
    canvas.width  = Math.floor(canvas.clientWidth  * dpr);
    canvas.height = Math.floor(canvas.clientHeight * dpr);
    gl.viewport(0, 0, canvas.width, canvas.height);
}

resizeCanvas();
window.addEventListener('resize', resizeCanvas);
window.GrassRenderer.init(gl, getHeight);

const ext = gl.getExtension('WEBGL_debug_renderer_info');
console.log('Renderer:', gl.getParameter(ext.UNMASKED_RENDERER_WEBGL));
console.log('Using back face geometry:', GrassRenderer.getBackFace());

rebuildGround();

gl.enable(gl.DEPTH_TEST);
gl.enable(gl.CULL_FACE);
gl.cullFace(gl.BACK);

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

// ── GROUND COLOR ───────────────────────────────────────────────────────────
function grassHueToGroundColor(hue) {
    // Shift ~100 degrees toward brown/tan, desaturate, pale and light
    const h = ((hue - 100 + 360) % 360);
    const s = 30;
    const l = 42 + Math.sin((hue / 360) * Math.PI) * 10;
    return { h, s, l };
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
        Math.PI / 4, canvas.clientWidth / canvas.clientHeight, 0.5, 200);
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

    // Ground
    const gp = window.GrassRenderer.params;
    const gc = grassHueToGroundColor(gp.hue);

    gl.disable(gl.CULL_FACE);
    gl.enable(gl.POLYGON_OFFSET_FILL);
    gl.polygonOffset(1.0, 1.0);
    gl.useProgram(groundProgram);
    gl.uniformMatrix4fv(gnd.model,   false, modelMatrix);
    gl.uniformMatrix4fv(gnd.view,    false, viewMatrix);
    gl.uniformMatrix4fv(gnd.project, false, projMatrix);
    gl.uniform1f(gnd.groundH, gc.h);
    gl.uniform1f(gnd.groundS, gc.s);
    gl.uniform1f(gnd.groundL, gc.l);
    gl.bindBuffer(gl.ARRAY_BUFFER,         groundVBO);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, groundIBO);
    gl.vertexAttribPointer(gnd.p, 3, gl.FLOAT, false, 12, 0);
    gl.enableVertexAttribArray(gnd.p);
    gl.drawElements(gl.TRIANGLE_STRIP, groundIndexCount, gl.UNSIGNED_SHORT, 0);
    gl.disable(gl.POLYGON_OFFSET_FILL);
    gl.enable(gl.CULL_FACE);

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