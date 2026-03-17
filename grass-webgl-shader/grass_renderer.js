"use strict";

// ── HILBERT CURVE ──────────────────────────────────────────────────────────
function nextPow2(n) {
    let p = 1;
    while (p < n) p *= 2;
    return p;
}

function hilbertD2xy(order, d) {
    let x = 0, y = 0;
    for (let s = 1; s < order; s *= 2) {
        const rx = 1 & (d / 2);
        const ry = 1 & (d ^ rx);
        if (ry === 0) {
            if (rx === 1) { x = s - 1 - x; y = s - 1 - y; }
            [x, y] = [y, x];
        }
        x += s * rx;
        y += s * ry;
        d  = Math.floor(d / 4);
    }
    return { x, y };
}

// ── HASH NOISE ─────────────────────────────────────────────────────────────
function hashNoise2(x, y) {
    const n = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
    return (n - Math.floor(n)) * 2.0 - 1.0;
}

function smoothNoise2(x, y) {
    const ix = Math.floor(x);
    const iy = Math.floor(y);
    const fx = x - ix;
    const fy = y - iy;
    const ux = fx * fx * (3.0 - 2.0 * fx);
    const uy = fy * fy * (3.0 - 2.0 * fy);
    const a  = hashNoise2(ix,     iy    );
    const b  = hashNoise2(ix + 1, iy    );
    const c  = hashNoise2(ix,     iy + 1);
    const d  = hashNoise2(ix + 1, iy + 1);
    return a + (b - a) * ux + (c - a) * uy + (d - c - b + a) * ux * uy;
}

// ── GRASS SHADERS ──────────────────────────────────────────────────────────
const grassVertSrc = `#version 300 es
precision highp float;

uniform mat4 model;
uniform mat4 view;
uniform mat4 project;
uniform float time;
uniform float windSpeed;
uniform float windIntensity;
uniform float windDirX;
uniform float windDirZ;

in vec3 p;
in vec2 basePos;
in float bladeT;
out vec3 vPos;
out vec2 vBase;
out float vBladeT;

void main()
{
	float wave = sin(basePos.x * windDirX * 2.0 + basePos.y * windDirZ * 2.0 + time * windSpeed)
             * windIntensity * bladeT;
float turb = sin(basePos.x * 3.7 + basePos.y * 2.3 + time * windSpeed * 1.7)
             * windIntensity * 0.4 * bladeT;
    vec3 finalPos = p + vec3(
        windDirX * (wave + turb),
        0.0,
        windDirZ * (wave + turb)
    );
    vPos    = p;
    vBase   = basePos;
    vBladeT = bladeT;
    gl_Position = project * view * model * vec4(finalPos, 1.0);
}`;

const grassFragSrc = `#version 300 es
precision highp float;

uniform float hue;
uniform float brightness;
uniform float variance;
uniform float hueVariance;

in vec3 vPos;
in vec2 vBase;
in float vBladeT;
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

float posRand(vec2 pos) {
    return fract(sin(dot(pos, vec2(127.1, 311.7))) * 43758.5453);
}

void main() {
	if (vBladeT < 0.0) discard;    

	float rand  = posRand(vBase);
    float rand2 = posRand(vBase + vec2(43.21, 17.89));

    float bladeHue = mod(hue + (rand2 - 0.5) * hueVariance, 360.0);
    float bladeLit = clamp(brightness * 100.0 + (rand - 0.5) * variance, 5.0, 50.0);

    float tipThreshold = 0.55 + rand * 0.35;
    if (vBladeT > tipThreshold) discard;

    fragColor = vec4(hslToRgb(bladeHue, 100.0, bladeLit), 1.0);
}`;

// ── HEIGHTMAP HELPERS ──────────────────────────────────────────────────────
let _getHeight = (x, z) => 0;

function getSurfaceNormal(x, z) {
    const eps = 0.01;
    const hL  = _getHeight(x - eps, z);
    const hR  = _getHeight(x + eps, z);
    const hD  = _getHeight(x, z - eps);
    const hU  = _getHeight(x, z + eps);
    const nx  = (hL - hR) / (2 * eps);
    const ny  = 1.0;
    const nz  = (hD - hU) / (2 * eps);
    const len = Math.sqrt(nx * nx + ny * ny + nz * nz);
    return [nx / len, ny / len, nz / len];
}

function getBladeBasis(normal) {
    const up  = normal;
    const arb = Math.abs(up[1]) < 0.99 ? [0, 1, 0] : [1, 0, 0];
    const rx  = up[1] * arb[2] - up[2] * arb[1];
    const ry  = up[2] * arb[0] - up[0] * arb[2];
    const rz  = up[0] * arb[1] - up[1] * arb[0];
    const rLen    = Math.sqrt(rx * rx + ry * ry + rz * rz);
    const right   = [rx / rLen, ry / rLen, rz / rLen];
    const forward = [
        right[1] * up[2] - right[2] * up[1],
        right[2] * up[0] - right[0] * up[2],
        right[0] * up[1] - right[1] * up[0],
    ];
    return { up, right, forward };
}

// ── GRASS GENERATION ───────────────────────────────────────────────────────
const LOD_SEGMENTS = [5, 3, 1];

// backFace: when true, emits a winding-flipped duplicate of each blade so both
// sides are visible even when gl.CULL_FACE is enabled (needed on Mac/Metal).
// When false, only the front strip is emitted and the caller disables culling
// instead — avoids Z-fighting on ANGLE/D3D (Windows Chrome).
function generateGrassStrip3D(params, worldOffsetX = 0, worldOffsetZ = 0, segments = 5, backFace = false) {
    const {
        bladeCount,
        patchWidth     = 5,
        patchDepth     = 5,
        baseHeight     = 0.6,
        heightVariance = 0.4,
        baseWidth      = 0.05,
        patchiness     = 0,
    } = params;

    const noiseScale  = 0.8;
    const p           = Math.sqrt(patchiness);
    const sharpness   = 1.0 + p * 8.0;
    const densityBias = 1.0 - p;

    const gridRes    = Math.min(256, Math.ceil(Math.sqrt(bladeCount)));
    const hilbertRes = nextPow2(gridRes);
    const maxCells   = hilbertRes * hilbertRes;
    const cellW      = patchWidth  / gridRes;
    const cellD      = patchDepth  / gridRes;
    const bw         = baseWidth;

    const vertices = [];

    let prevBladeLast = null;

    for (let d = 0; d < maxCells; d++) {
        const { x: gx, y: gz } = hilbertD2xy(hilbertRes, d);
        if (gx >= gridRes || gz >= gridRes) continue;

        // ── Patchiness rejection ───────────────────────────────────────────
        const wx  = worldOffsetX + (gx + 0.5) * cellW - patchWidth  * 0.5;
        const wz  = worldOffsetZ + (gz + 0.5) * cellD - patchDepth  * 0.5;
        const n01 = (smoothNoise2(wx * noiseScale, wz * noiseScale) + 1.0) * 0.5;
        const shaped     = Math.pow(n01, sharpness);
        const acceptance = densityBias + shaped * p;
        if (Math.random() > acceptance) continue;

        // ── Blade properties ───────────────────────────────────────────────
        const baseX      = wx + (Math.random() - 0.5) * cellW;
        const baseZ      = wz + (Math.random() - 0.5) * cellD;
        const baseY      = _getHeight(baseX, baseZ);
        const height     = baseHeight + Math.random() * heightVariance;
        const bendAmount = (0.15 + Math.random() * 0.25) * height
                           * (Math.random() < 0.5 ? 1 : -1);
        const angle      = Math.random() * Math.PI * 2;

        const { up, right, forward } = getBladeBasis(getSurfaceNormal(baseX, baseZ));
        const cosA = Math.cos(angle);
        const sinA = Math.sin(angle);
        const dx   = right[0] * cosA + forward[0] * sinA;
        const dy   = right[1] * cosA + forward[1] * sinA;
        const dz   = right[2] * cosA + forward[2] * sinA;

        // ── Degenerate stitch from previous blade ──────────────────────────
        const thisLeft  = [baseX - dx * bw / 2, baseY - dy * bw / 2, baseZ - dz * bw / 2, baseX, baseZ, -1.0];
	const thisRight = [baseX + dx * bw / 2, baseY + dy * bw / 2, baseZ + dz * bw / 2, baseX, baseZ, -1.0];

        if (prevBladeLast !== null) {
            vertices.push(...prevBladeLast);
            vertices.push(...thisLeft);
            vertices.push(...thisLeft);
            vertices.push(...thisRight);
        }

        // ── Front face ─────────────────────────────────────────────────────
        for (let j = 0; j <= segments; j++) {
            const t     = j / segments;
            const width = bw * (1.0 - t);
            const curve = (t * t) * bendAmount;
            const px = baseX + up[0] * t * height + forward[0] * curve;
            const py = baseY + up[1] * t * height + forward[1] * curve;
            const pz = baseZ + up[2] * t * height + forward[2] * curve;
            vertices.push(
                px - dx * width / 2, py - dy * width / 2, pz - dz * width / 2,
                baseX, baseZ, t
            );
            vertices.push(
                px + dx * width / 2, py + dy * width / 2, pz + dz * width / 2,
                baseX, baseZ, t
            );
        }

        prevBladeLast = vertices.slice(-6);

        // ── Back face (Mac/Metal only) ─────────────────────────────────────
        // Winding-flipped duplicate so blades are visible from both sides
        // without relying on gl.CULL_FACE being disabled.
        if (backFace) {
            const lastFront = vertices.slice(-6);
            vertices.push(...lastFront);

            for (let j = 0; j <= segments; j++) {
                const t     = j / segments;
                const width = bw * (1.0 - t);
                const curve = (t * t) * bendAmount;
                const px = baseX + up[0] * t * height + forward[0] * curve;
                const py = baseY + up[1] * t * height + forward[1] * curve;
                const pz = baseZ + up[2] * t * height + forward[2] * curve;
                vertices.push(
                    px + dx * width / 2, py + dy * width / 2, pz + dz * width / 2,
                    baseX, baseZ, t
                );
                vertices.push(
                    px - dx * width / 2, py - dy * width / 2, pz - dz * width / 2,
                    baseX, baseZ, t
                );
            }
        }
    }

    return new Float32Array(vertices);
}

// ── PLATFORM DETECTION ─────────────────────────────────────────────────────
// Returns true if we should emit back-face geometry (Mac/Metal),
// false if we should disable culling instead (Windows/ANGLE/D3D).
function detectNeedsBackFace(gl) {
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    if (!ext) return true; // safe default: back-face geometry works everywhere
    const renderer = gl.getParameter(ext.UNMASKED_RENDERER_WEBGL);
    const isANGLE  = /ANGLE|Direct3D/i.test(renderer);
    // On ANGLE/D3D, skip back-face geometry and disable culling to avoid Z-fighting.
    // On Metal/Mac and everything else, emit back-face geometry.
    return !isANGLE;
}

// ── CHUNK MANAGER ──────────────────────────────────────────────────────────
const CHUNK_SIZE = 5;

class ChunkManager {
    constructor(gl, rings, backFace) {
        this.gl       = gl;
        this.rings    = rings;
        this.backFace = backFace;
        this.grid     = 2 * rings + 1;
        this.chunks   = [];
        this._initChunks();
    }

    _initChunks() {
        const gl = this.gl;
        const n  = this.grid * this.grid;
        for (let i = 0; i < n; i++) {
            this.chunks.push({
                buf:        [gl.createBuffer(), gl.createBuffer(), gl.createBuffer()],
                vertCount:  [0, 0, 0],
                worldX:     0,
                worldZ:     0,
                chunkGridX: 0,
                chunkGridZ: 0,
                minY:       0,
                maxY:       2,
                dirty:      true,
            });
        }
    }

    reset(camX, camZ) {
        const r        = this.rings;
        const originCX = Math.floor(camX / CHUNK_SIZE);
        const originCZ = Math.floor(camZ / CHUNK_SIZE);
        let idx = 0;
        for (let cz = -r; cz <= r; cz++) {
            for (let cx = -r; cx <= r; cx++) {
                const chunk      = this.chunks[idx++];
                chunk.chunkGridX = originCX + cx;
                chunk.chunkGridZ = originCZ + cz;
                chunk.worldX     = chunk.chunkGridX * CHUNK_SIZE;
                chunk.worldZ     = chunk.chunkGridZ * CHUNK_SIZE;
                chunk.dirty      = true;
            }
        }
    }

    update(camX, camZ) {
        const camCX = Math.floor(camX / CHUNK_SIZE);
        const camCZ = Math.floor(camZ / CHUNK_SIZE);
        const r     = this.rings;
        const grid  = this.grid;

        for (const chunk of this.chunks) {
            let cx = chunk.chunkGridX;
            let cz = chunk.chunkGridZ;

            while (cx - camCX >  r) cx -= grid;
            while (cx - camCX < -r) cx += grid;
            while (cz - camCZ >  r) cz -= grid;
            while (cz - camCZ < -r) cz += grid;

            if (cx !== chunk.chunkGridX || cz !== chunk.chunkGridZ) {
                chunk.chunkGridX = cx;
                chunk.chunkGridZ = cz;
                chunk.worldX     = cx * CHUNK_SIZE;
                chunk.worldZ     = cz * CHUNK_SIZE;
                chunk.dirty      = true;
            }
        }
    }

    _buildChunk(chunk, params) {
        const chunkParams = Object.assign({}, params, {
            patchWidth: CHUNK_SIZE,
            patchDepth: CHUNK_SIZE,
        });

        let minY =  Infinity;
        let maxY = -Infinity;

        for (let lod = 0; lod < LOD_SEGMENTS.length; lod++) {
            const verts = generateGrassStrip3D(
                chunkParams,
                chunk.worldX,
                chunk.worldZ,
                LOD_SEGMENTS[lod],
                this.backFace
            );
            chunk.vertCount[lod] = verts.length / 6;

            if (lod === 0) {
                for (let i = 1; i < verts.length; i += 6) {
                    const y = verts[i];
                    if (y < minY) minY = y;
                    if (y > maxY) maxY = y;
                }
                chunk.minY = minY === Infinity  ? 0 : minY;
                chunk.maxY = maxY === -Infinity ? 2 : maxY
                             + (params.baseHeight + params.heightVariance);
            }

            this.gl.bindBuffer(this.gl.ARRAY_BUFFER, chunk.buf[lod]);
            this.gl.bufferData(this.gl.ARRAY_BUFFER, verts, this.gl.DYNAMIC_DRAW);
        }

        chunk.dirty = false;
    }

    buildNext(params) {
        const chunk = this.chunks.find(c => c.dirty);
        if (chunk) this._buildChunk(chunk, params);
    }

    rebuildAll(params) {
        for (const chunk of this.chunks) this._buildChunk(chunk, params);
    }

    _extractFrustumPlanes(vp) {
        const m      = vp;
        const planes = [];
        const rows   = [
            [ m[0]+m[3],  m[4]+m[7],  m[8]+m[11],  m[12]+m[15]],
            [-m[0]+m[3], -m[4]+m[7], -m[8]+m[11], -m[12]+m[15]],
            [ m[1]+m[3],  m[5]+m[7],  m[9]+m[11],  m[13]+m[15]],
            [-m[1]+m[3], -m[5]+m[7], -m[9]+m[11], -m[13]+m[15]],
            [ m[2]+m[3],  m[6]+m[7],  m[10]+m[11],  m[14]+m[15]],
            [-m[2]+m[3], -m[6]+m[7], -m[10]+m[11], -m[14]+m[15]],
        ];
        for (const [a, b, c, d] of rows) {
            const len = Math.sqrt(a*a + b*b + c*c);
            planes.push({ nx: a/len, ny: b/len, nz: c/len, d: d/len });
        }
        return planes;
    }

    _chunkVisible(chunk, planes) {
        const x0 = chunk.worldX - CHUNK_SIZE * 0.5;
        const x1 = chunk.worldX + CHUNK_SIZE * 0.5;
        const y0 = chunk.minY;
        const y1 = chunk.maxY;
        const z0 = chunk.worldZ - CHUNK_SIZE * 0.5;
        const z1 = chunk.worldZ + CHUNK_SIZE * 0.5;
        for (const { nx, ny, nz, d } of planes) {
            const px = nx > 0 ? x1 : x0;
            const py = ny > 0 ? y1 : y0;
            const pz = nz > 0 ? z1 : z0;
            if (nx * px + ny * py + nz * pz + d < 0) return false;
        }
        return true;
    }

    draw(gl, loc, viewMatrix, projMatrix, params, camX, camZ, time) {
        const vp     = m4.multiply(projMatrix, viewMatrix);
        const planes = this._extractFrustumPlanes(vp);

        const driftDeg = params.windDirDeg + Math.sin(time * 0.3) * 25;
        const dirRad   = driftDeg * Math.PI / 180;

        gl.uniform1f(loc.time,        time);
        gl.uniform1f(loc.windSpeed,   params.windSpeed);
        gl.uniform1f(loc.windInt,     params.windIntensity);
        gl.uniform1f(loc.windDirX,    Math.cos(dirRad));
        gl.uniform1f(loc.windDirZ,    Math.sin(dirRad));
        gl.uniform1f(loc.hue,         params.hue);
        gl.uniform1f(loc.brightness,  params.brightness);
        gl.uniform1f(loc.variance,    params.variance);
        gl.uniform1f(loc.hueVariance, params.hueVariance);

        const lodMult  = params.lodScale || 1.0;
        const lodInner = CHUNK_SIZE * (this.rings - 0.5) * lodMult;
        const lodOuter = CHUNK_SIZE * (this.rings + 0.5) * lodMult;
        const lodMid   = (lodInner + lodOuter) * 0.5;

        for (const chunk of this.chunks) {
            if (chunk.vertCount[0] === 0) continue;
            if (!this._chunkVisible(chunk, planes)) continue;

            const dx   = chunk.worldX - camX;
            const dz   = chunk.worldZ - camZ;
            const dist = Math.sqrt(dx * dx + dz * dz);

            const lodLevel = dist < lodInner ? 0
                           : dist < lodMid   ? 1
                           :                   2;

            gl.uniformMatrix4fv(loc.model, false, m4.identity());
            gl.bindBuffer(gl.ARRAY_BUFFER, chunk.buf[lodLevel]);
            gl.vertexAttribPointer(loc.p,       3, gl.FLOAT, false, 24, 0);
            gl.enableVertexAttribArray(loc.p);
            gl.vertexAttribPointer(loc.basePos, 2, gl.FLOAT, false, 24, 12);
            gl.enableVertexAttribArray(loc.basePos);
            gl.vertexAttribPointer(loc.bladeT,  1, gl.FLOAT, false, 24, 20);
            gl.enableVertexAttribArray(loc.bladeT);
            gl.drawArrays(gl.TRIANGLE_STRIP, 0, chunk.vertCount[lodLevel]);
        }
    }
}

// ── PARAMS ─────────────────────────────────────────────────────────────────
const params = {
    bladeCount:     4000,
    baseHeight:     0.6,
    heightVariance: 0.4,
    baseWidth:      0.05,
    patchiness:     0,
    hue:            120,
    brightness:     0.4,
    variance:       60,
    hueVariance:    18,
    windSpeed:      2.0,
    windIntensity:  0.05,
    windDirDeg:     45,
    viewDistance:   3,
    lodScale:       1.0,
};

// ── WEBGL STATE ────────────────────────────────────────────────────────────
let _gl          = null;
let grassProgram = null;
let chunkManager = null;
let loc          = {};
let _backFace    = true; // set during init() via platform detection

function buildGrassProgram(gl, vertSrc, fragSrc) {
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

// ── PUBLIC API ─────────────────────────────────────────────────────────────
function init(gl, getHeightFn) {
    _gl        = gl;
    _getHeight = getHeightFn;
    _backFace  = detectNeedsBackFace(gl);

    grassProgram = buildGrassProgram(gl, grassVertSrc, grassFragSrc);

    loc = {
        p:           gl.getAttribLocation(grassProgram,  'p'),
        basePos:     gl.getAttribLocation(grassProgram,  'basePos'),
        bladeT:      gl.getAttribLocation(grassProgram,  'bladeT'),
        model:       gl.getUniformLocation(grassProgram, 'model'),
        view:        gl.getUniformLocation(grassProgram, 'view'),
        project:     gl.getUniformLocation(grassProgram, 'project'),
        time:        gl.getUniformLocation(grassProgram, 'time'),
        windSpeed:   gl.getUniformLocation(grassProgram, 'windSpeed'),
        windInt:     gl.getUniformLocation(grassProgram, 'windIntensity'),
        windDirX:    gl.getUniformLocation(grassProgram, 'windDirX'),
        windDirZ:    gl.getUniformLocation(grassProgram, 'windDirZ'),
        hue:         gl.getUniformLocation(grassProgram, 'hue'),
        brightness:  gl.getUniformLocation(grassProgram, 'brightness'),
        variance:    gl.getUniformLocation(grassProgram, 'variance'),
        hueVariance: gl.getUniformLocation(grassProgram, 'hueVariance'),
    };

    chunkManager = new ChunkManager(gl, params.viewDistance, _backFace);
    chunkManager.reset(0, 0);
    chunkManager.rebuildAll(params);
}

function rebuildGrass() {
    if (!_gl || !chunkManager) return;
    chunkManager = new ChunkManager(_gl, params.viewDistance, _backFace);
    chunkManager.reset(0, 0);
    chunkManager.rebuildAll(params);
}

function draw(viewMatrix, projMatrix, camX = 0, camZ = 0) {
    const gl   = _gl;
    const time = performance.now() * 0.001;

    chunkManager.update(camX, camZ);
    chunkManager.buildNext(params);

    gl.useProgram(grassProgram);
    gl.uniformMatrix4fv(loc.view,    false, viewMatrix);
    gl.uniformMatrix4fv(loc.project, false, projMatrix);

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    if (_backFace) {
        // Mac/Metal: back-face geometry is baked in, culling can stay enabled
        gl.enable(gl.CULL_FACE);
    } else {
        // Windows/ANGLE: single-sided geometry, disable culling so both sides show
        gl.disable(gl.CULL_FACE);
    }

    chunkManager.draw(gl, loc, viewMatrix, projMatrix, params, camX, camZ, time);
}

window.GrassRenderer = { init, draw, rebuildGrass, params, getBackFace: () => _backFace };