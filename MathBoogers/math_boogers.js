'use strict';

// ── Colors ────────────────────────────────────────────────────────
var COLORS = [
  {body:'#3d8c2f', spot:'#255018', shine:'#6ed44e'},
  {body:'#2f8c5a', spot:'#184832', shine:'#4ed49a'},
  {body:'#7c8c2f', spot:'#3a4818', shine:'#c4d44e'},
  {body:'#8c5a2f', spot:'#482a18', shine:'#d4904e'},
  {body:'#5a2f8c', spot:'#2a1848', shine:'#904ed4'},
  {body:'#2f6e8c', spot:'#183848', shine:'#4eb0d4'},
  {body:'#8c2f5a', spot:'#681840', shine:'#d44e90'},
  {body:'#2f7c8c', spot:'#185868', shine:'#4eccd4'},
];

// ── State ─────────────────────────────────────────────────────────
var boogers = [], moveLog = [], target = null;
var dragState = null, boogerIdCounter = 0;
var gameArea, svgLayer, previewBubble;
var animId, lastTime = 0;
var currentDiff = 'easy';

// ── Awards ────────────────────────────────────────────────────────
function getAwards() {
  try { var raw = localStorage.getItem('mbAwards'); if (raw) return JSON.parse(raw); } catch(e) {}
  return {bronze:0, silver:0, gold:0};
}
function saveAwards(a) { try { localStorage.setItem('mbAwards', JSON.stringify(a)); } catch(e) {} }
function updateAwardDisplay() {
  var a = getAwards();
  document.getElementById('bronze-count').textContent = String(a.bronze);
  document.getElementById('silver-count').textContent = String(a.silver);
  document.getElementById('gold-count').textContent   = String(a.gold);
}
function grantAward(diff) {
  var a = getAwards();
  if (diff === 'easy')   a.bronze++;
  else if (diff === 'medium') a.silver++;
  else if (diff === 'hard')   a.gold++;
  saveAwards(a); updateAwardDisplay();
}

// ── Fraction math ─────────────────────────────────────────────────
function gcd(a, b) { a = Math.abs(a); b = Math.abs(b); while (b) { var t = b; b = a % b; a = t; } return a || 1; }
function reduce(n, d) {
  if (!d) return null; if (n === 0) return {n:0, d:1};
  if (d < 0) { n = -n; d = -d; }
  var g = gcd(Math.abs(n), d); return {n: n/g, d: d/g};
}
function fv(n) { return {n: n, d: 1}; }
function fAdd(a, b) { return reduce(a.n*b.d + b.n*a.d, a.d*b.d); }
function fSub(a, b) { return reduce(a.n*b.d - b.n*a.d, a.d*b.d); }
function fMul(a, b) { return reduce(a.n*b.n, a.d*b.d); }
function fDiv(a, b) { if (b.n === 0) return null; return reduce(a.n*b.d, a.d*b.n); }
function fVal(f) { return f.n / f.d; }

function applyOp(srcF, op, tgtF) {
  if (op === '+') return fAdd(srcF, tgtF);
  if (op === '*') return fMul(srcF, tgtF);
  if (op === '/') return fDiv(srcF, tgtF);
  return null;
}

// ── Display ───────────────────────────────────────────────────────
function symOf(op) {
  if (op === '*') return '×';
  if (op === '/') return '÷';
  return '+';
}

function boogerLabelHTML(op, num) {
  var r = reduce(Math.abs(num.n), num.d);
  if (!r) return '?';
  var absStr = r.d === 1 ? String(r.n) : r.n + '/' + r.d;
  var isNeg = num.n < 0;
  if (op === '+') {
    return '<span class="sym">' + (isNeg ? '−' : '+') + '</span>' + absStr;
  } else {
    var sym = symOf(op);
    if (isNeg) return '<span class="neg-wrap">' + sym + '(−' + absStr + ')</span>';
    return '<span class="sym">' + sym + '</span>' + absStr;
  }
}

function fStrSigned(f) {
  var r = reduce(f.n, f.d); if (!r) return '?';
  if (r.d === 1) return String(r.n);
  return r.n + '/' + r.d;
}

function previewLabel(src, tgt) {
  var srcDisp = fStrSigned(src.num);
  var r = reduce(Math.abs(tgt.num.n), tgt.num.d);
  var absStr = r ? (r.d === 1 ? String(r.n) : r.n + '/' + r.d) : '?';
  var isNeg = tgt.num.n < 0;
  var tgtDisp;
  if (tgt.op === '+') { tgtDisp = (isNeg ? '− ' : '+ ') + absStr; }
  else { var sym = symOf(tgt.op); tgtDisp = isNeg ? sym + '(−' + absStr + ')' : sym + ' ' + absStr; }
  var res = applyOp(src.num, tgt.op, tgt.num);
  var resDisp = res ? fStrSigned(reduce(res.n, res.d)) : '?';
  return srcDisp + ' ' + tgtDisp + ' = ' + resDisp;
}

// ── Puzzle generation (backwards from target) ─────────────────────
//
// Strategy: start with [target] as a single value. Repeatedly pick one
// value from the list and split it into two by un-applying a random
// operation. Repeat until we have cfg.count values. Each split is
// guaranteed valid, so no rejection loop is needed.
//
// Un-applying an operation on value V:
//   un-apply (+n):  produces booger (+n) and remainder (V - n)
//   un-apply (*n):  produces booger (*n) and remainder (V / n)  — only if V divisible by n
//   un-apply (/n):  produces booger (/n) and remainder (V * n)
//
// The remainder becomes a (+) booger (it's just a numeric value).
// The split booger carries the actual operator.

var DIFF = {
  easy:   {count:3, addMax:6, useMul:true, mulMax:4, useDiv:false, targetMin:4,  targetMax:40},
  medium: {count:4, addMax:9, useMul:true, mulMax:5, useDiv:false, targetMin:6,  targetMax:80},
  hard:   {count:5, addMax:9, useMul:true, mulMax:6, useDiv:true,  targetMin:8,  targetMax:150},
};

function randInt(mn, mx) {
  // Returns a random integer in [mn, mx], never 0, 1, or -1.
  var v, attempts = 0;
  do { v = Math.floor(Math.random() * (mx - mn + 1)) + mn; attempts++; }
  while ((v === 0 || v === 1 || v === -1) && attempts < 100);
  return v;
}

function randIntNonZero(mn, mx) {
  // Like randInt but only excludes 0 (used for remainders where 1/-1 are ok).
  var v, attempts = 0;
  do { v = Math.floor(Math.random() * (mx - mn + 1)) + mn; attempts++; }
  while (v === 0 && attempts < 100);
  return v;
}

function generatePuzzle(diff) {
  var cfg = DIFF[diff];

  // Pick a random target in range, avoiding 0/1/-1.
  var tgt = randInt(cfg.targetMin, cfg.targetMax);
  // Randomly negate ~20% of the time for variety on medium/hard.
  if (diff !== 'easy' && Math.random() < 0.2) tgt = -tgt;

  // We track values as plain integers (no fractions in this generator).
  // values[] is the working list; each entry will become a booger.
  // boogerOps[] tracks what operator/number was "split off" at each step.
  //
  // We start with the target as one value with op '+' (it's the final accumulator).
  // Each split replaces one value with two: the split-off booger and the remainder.

  var values = [tgt];  // current numeric values (integers)
  var ops    = ['+'];  // corresponding operators (the final one stays '+')

  // ── Bitset: guarantee a mix of add/sub and mul/div splits ────────
  // We need (count - 1) splits total. Build a shuffled array of operator
  // type flags: 0 = add/sub split, 1 = mul/div split.
  // Rules: at least one 1 and at least one 0, rest random.
  var numSplits = cfg.count - 1;
  var opTypeBits = [];
  opTypeBits.push(1);  // guarantee at least one mul/div
  opTypeBits.push(0);  // guarantee at least one add/sub
  for (var b = 2; b < numSplits; b++) {
    opTypeBits.push(Math.random() < 0.5 ? 1 : 0);
  }
  // Fisher-Yates shuffle the bitset.
  for (var b = opTypeBits.length - 1; b > 0; b--) {
    var jj = Math.floor(Math.random() * (b + 1));
    var tmp = opTypeBits[b]; opTypeBits[b] = opTypeBits[jj]; opTypeBits[jj] = tmp;
  }

  var maxAttempts = 200;
  var attempts = 0;
  var bitIdx = 0;  // which bit we're consuming next

  while (values.length < cfg.count && attempts < maxAttempts) {
    attempts++;

    // Pick a value to split.
    var idx = Math.floor(Math.random() * values.length);
    var val = values[idx];

    // Consume the next bit to decide what type of split to attempt.
    var wantMul = bitIdx < opTypeBits.length ? opTypeBits[bitIdx] === 1 : (Math.random() < 0.5);

    // Build splits of the requested type only.
    var splits = [];

    if (!wantMul) {
      // ── Addition/subtraction splits ──────────────────────────────
      // Un-apply (+n): booger is (+n), remainder is (val - n).
      var addRange = Math.min(cfg.addMax, Math.abs(val) - 1);
      if (addRange >= 2) {
        for (var trial = 0; trial < 8; trial++) {
          var n = randInt(2, addRange);
          if (Math.random() < 0.4) n = -n;
          var remainder = val - n;
          if (remainder !== 0 && remainder !== 1 && remainder !== -1) {
            splits.push({op:'+', n:n, remainder:remainder});
          }
        }
      }
    } else {
      // ── Multiply/divide splits ───────────────────────────────────
      if (cfg.useMul) {
        // Un-apply (*n): booger is (*n), remainder is (val / n).
        for (var n = 2; n <= cfg.mulMax; n++) {
          if (val % n === 0) {
            var rem = val / n;
            if (rem !== 0 && rem !== 1 && rem !== -1) {
              splits.push({op:'*', n:n, remainder:rem});
              if (-rem !== 0 && -rem !== 1 && -rem !== -1) {
                splits.push({op:'*', n:-n, remainder:-rem});
              }
            }
          }
        }
      }
      if (cfg.useDiv) {
        // Un-apply (/n): booger is (/n), remainder is (val * n).
        for (var n = 2; n <= 4; n++) {
          var rem = val * n;
          if (Math.abs(rem) <= cfg.targetMax * cfg.mulMax && rem !== 0 && rem !== 1 && rem !== -1) {
            splits.push({op:'/', n:n, remainder:rem});
          }
        }
      }
    }

    // If no valid splits found for this bit type, don't consume the bit —
    // try a different value next iteration.
    if (splits.length === 0) continue;

    // Consume the bit and apply the split.
    bitIdx++;
    var split = splits[Math.floor(Math.random() * splits.length)];
    values[idx] = split.remainder;
    ops[idx]    = '+';  // remainder is always a plain (+) value
    values.push(split.n);
    ops.push(split.op);
  }

  if (values.length < cfg.count) {
    // Couldn't fulfil the bitset with valid splits — retry.
    return generatePuzzle(diff);
  }

  // Shuffle so the order isn't always "remainder first, operators after".
  var order = values.map(function(_, i) { return i; });
  for (var i = order.length - 1; i > 0; i--) {
    var j = Math.floor(Math.random() * (i + 1));
    var tmp = order[i]; order[i] = order[j]; order[j] = tmp;
  }

  var pool = order.map(function(i) {
    return {op: ops[i], num: fv(values[i])};
  });

  return {target: fv(tgt), pool: pool};
}

// ── Booger object ─────────────────────────────────────────────────
function makeBooger(b, i) {
  return {
    id: boogerIdCounter++, op: b.op, num: reduce(b.num.n, b.num.d),
    color: COLORS[i % COLORS.length],
    size: 90 + Math.floor(Math.random() * 25),
    seed: Math.random() * 100,
    x:0, y:0, wx:0, wy:0, PTS:14,
    jOff: new Float32Array(14).fill(0),
    jVel: new Float32Array(14).fill(0),
    vx:0, vy:0, prevVx:0, prevVy:0, prevMx:0, prevMy:0,
    gx:0, gy:0, highlighted:false, _canvas:null, _el:null,
  };
}

// ── Blob drawing ──────────────────────────────────────────────────
function blobPath(cx, cy, rx, ry, pts, seed, jOff, gx, gy) {
  var coords = [];
  for (var i = 0; i < pts; i++) {
    var a = (i / pts) * Math.PI * 2, ca = Math.cos(a), sa = Math.sin(a);
    var base = 1 + 0.16*Math.sin(seed+a*3.7) + 0.08*Math.cos(seed*1.3+a*7.1) + 0.05*Math.sin(seed*0.7+a*2.3);
    var r = (base + jOff[i] * 0.018) * (1 + (ca*gx + sa*gy) * 0.55);
    coords.push([cx + ca*rx*r, cy + sa*ry*r]);
  }
  var n = coords.length, d = '';
  for (var i = 0; i < n; i++) {
    var p0=coords[(i-1+n)%n], p1=coords[i], p2=coords[(i+1)%n], p3=coords[(i+2)%n];
    if (i === 0) d += 'M' + p1[0].toFixed(2) + ',' + p1[1].toFixed(2) + ' ';
    d += 'C' + (p1[0]+(-p0[0]+p2[0])*0.25).toFixed(2) + ',' + (p1[1]+(-p0[1]+p2[1])*0.25).toFixed(2) + ' '
       + (p2[0]+(-p1[0]+p3[0])*-0.25).toFixed(2) + ',' + (p2[1]+(-p1[1]+p3[1])*-0.25).toFixed(2) + ' '
       + p2[0].toFixed(2) + ',' + p2[1].toFixed(2) + ' ';
  }
  return d + 'Z';
}

function drawBooger(b) {
  var cv = b._canvas; if (!cv) return;
  var w = cv.width, h = cv.height, ctx = cv.getContext('2d');
  ctx.clearRect(0, 0, w, h);
  var cx = w/2, cy = h/2, rx = b.size*0.52, ry = b.size*0.46;
  var p = new Path2D(blobPath(cx, cy, rx, ry, b.PTS, b.seed, b.jOff, b.gx, b.gy));
  if (b.highlighted) { ctx.save(); ctx.shadowColor='#a8e063'; ctx.shadowBlur=22; ctx.fillStyle=b.color.body; ctx.fill(p); ctx.restore(); }
  ctx.fillStyle = b.color.body; ctx.fill(p);
  ctx.save(); ctx.clip(p);
  var gr = ctx.createRadialGradient(cx, cy, rx*0.1, cx, cy, rx*1.1);
  gr.addColorStop(0, 'rgba(255,255,255,0.05)'); gr.addColorStop(0.6, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(0,0,0,0.28)');
  ctx.fillStyle = gr; ctx.fillRect(0, 0, w, h);
  ctx.globalAlpha = 0.45; ctx.fillStyle = b.color.spot;
  ctx.beginPath(); ctx.ellipse(cx-rx*0.2, cy+ry*0.22, rx*0.2, ry*0.13, 0.4, 0, Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(cx+rx*0.3, cy+ry*0.38, rx*0.11, ry*0.085, -0.3, 0, Math.PI*2); ctx.fill();
  ctx.globalAlpha = 0.52; ctx.fillStyle = b.color.shine;
  ctx.beginPath(); ctx.ellipse(cx-rx*0.28, cy-ry*0.3, rx*0.17, ry*0.11, -0.5, 0, Math.PI*2); ctx.fill();
  ctx.globalAlpha = 1; ctx.restore();
}

function setLabel(b, dragging) {
  if (!b._el) return;
  var el = b._el.querySelector('.btext');
  if (dragging) {
    var r = reduce(Math.abs(b.num.n), b.num.d);
    var absStr = r ? (r.d === 1 ? String(r.n) : r.n + '/' + r.d) : '?';
    el.innerHTML = (b.num.n < 0 ? '−' : '') + absStr;
  } else {
    el.innerHTML = boogerLabelHTML(b.op, b.num);
  }
}

function createEl(b) {
  var sz = b.size + 40;
  var wrap = document.createElement('div');
  wrap.className = 'bwrap'; wrap.dataset.id = String(b.id);
  wrap.style.width = sz + 'px'; wrap.style.height = sz + 'px';
  var cv = document.createElement('canvas');
  cv.width = sz; cv.height = sz; cv.style.display = 'block';
  b._canvas = cv; wrap.appendChild(cv);
  var lbl = document.createElement('div'); lbl.className = 'blabel';
  lbl.innerHTML = '<span class="btext"></span>';
  wrap.appendChild(lbl);
  b._el = wrap; setLabel(b, false); setupDrag(wrap, b);
  gameArea.appendChild(wrap);
  wrap.style.transform = 'translate(' + b.x + 'px,' + b.y + 'px)';
}
function syncPos(b) { if (b._el) b._el.style.transform = 'translate(' + b.x + 'px,' + b.y + 'px)'; }
function centre(b) { var sz = b.size + 40; return {x: b.x + sz/2, y: b.y + sz/2}; }
function radius(b) { return b.size * 0.55 + 8; }

// ── Physics tick ──────────────────────────────────────────────────
function tick(ts) {
  var dt = Math.min((ts - lastTime) / 1000, 0.05); lastTime = ts;
  var W = gameArea.clientWidth, H = gameArea.clientHeight;
  for (var ai = 0; ai < boogers.length; ai++) {
    var a = boogers[ai];
    if (dragState && dragState.srcId === a.id) continue;
    var fx = 0, fy = 0;
    for (var bi = 0; bi < boogers.length; bi++) {
      if (ai === bi) continue;
      var b2 = boogers[bi];
      if (dragState && dragState.srcId === b2.id) continue;
      var ca = centre(a), cb = centre(b2);
      var dx = ca.x - cb.x, dy = ca.y - cb.y;
      var dist = Math.hypot(dx, dy) || 0.01;
      var minD = radius(a) + radius(b2) + 12;
      if (dist < minD) { var f = (minD - dist) * 16; fx += dx/dist*f; fy += dy/dist*f; }
    }
    a.wx = (a.wx + fx*dt) * 0.80; a.wy = (a.wy + fy*dt) * 0.80;
    a.x += a.wx * dt; a.y += a.wy * dt;
    var sz = a.size + 40, pad = 8;
    if (a.x < pad)       { a.x = pad;        a.wx =  Math.abs(a.wx) * 0.4; }
    if (a.y < pad)       { a.y = pad;        a.wy =  Math.abs(a.wy) * 0.4; }
    if (a.x+sz > W-pad)  { a.x = W-pad-sz;  a.wx = -Math.abs(a.wx) * 0.4; }
    if (a.y+sz > H-pad)  { a.y = H-pad-sz;  a.wy = -Math.abs(a.wy) * 0.4; }
    syncPos(a);
  }
  for (var bi3 = 0; bi3 < boogers.length; bi3++) {
    var b = boogers[bi3]; if (!b._canvas) continue;
    var isDrag = dragState && dragState.srcId === b.id;
    var K = 110, D = 3.8, ia = isDrag ? 0 : 2.2;
    for (var i = 0; i < b.PTS; i++) {
      var drive = ia * Math.sin(ts*0.001*Math.PI*2*0.95 + i*0.9 + b.seed);
      b.jVel[i] += (-K*(b.jOff[i]-drive) - D*b.jVel[i]) * dt;
      b.jOff[i] += b.jVel[i] * dt;
    }
    if (!isDrag) { b.gx *= Math.pow(0.001, dt); b.gy *= Math.pow(0.001, dt); }
    drawBooger(b);
  }
  animId = requestAnimationFrame(tick);
}

// ── Drag ──────────────────────────────────────────────────────────
function findHover(relX, relY, srcId) {
  var best = null, bestD = Infinity;
  for (var i = 0; i < boogers.length; i++) {
    var o = boogers[i]; if (o.id === srcId) continue;
    var c = centre(o), d = Math.hypot(relX - c.x, relY - c.y);
    if (d < radius(o) + 30 && d < bestD) { best = o.id; bestD = d; }
  }
  return best;
}

function setupDrag(el, b) {
  var onMove, onUp;
  function start(cx, cy) {
    var r = gameArea.getBoundingClientRect();
    dragState = {srcId: b.id, ox: cx-r.left-b.x, oy: cy-r.top-b.y, targetId: null};
    b.prevMx=cx; b.prevMy=cy; b.vx=0; b.vy=0; b.prevVx=0; b.prevVy=0; b.wx=0; b.wy=0;
    el.classList.add('dragging'); setLabel(b, true);
    hideUndoArrow();
    for (var i = 0; i < b.PTS; i++) b.jVel[i] += (Math.random()-0.5)*80;
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
    document.addEventListener('touchmove', onMove, {passive:false});
    document.addEventListener('touchend', onUp);
  }
  el.addEventListener('mousedown', function(e) { e.preventDefault(); start(e.clientX, e.clientY); });
  el.addEventListener('touchstart', function(e) { e.preventDefault(); start(e.touches[0].clientX, e.touches[0].clientY); }, {passive:false});

  onMove = function(e) {
    if (!dragState || dragState.srcId !== b.id) return;
    if (e.preventDefault) e.preventDefault();
    var cx = e.touches ? e.touches[0].clientX : e.clientX;
    var cy = e.touches ? e.touches[0].clientY : e.clientY;
    var r = gameArea.getBoundingClientRect();
    var W = r.width, H = r.height, sz = b.size + 40;
    var rawVx = cx - b.prevMx, rawVy = cy - b.prevMy;
    b.prevMx = cx; b.prevMy = cy;
    var oldVx = b.vx, oldVy = b.vy;
    b.vx = rawVx*0.45 + b.prevVx*0.55; b.vy = rawVy*0.45 + b.prevVy*0.55;
    var ax = b.vx - oldVx, ay = b.vy - oldVy;
    b.prevVx = b.vx; b.prevVy = b.vy;
    var am = Math.hypot(ax, ay);
    if (am > 0.1) {
      var sc = Math.min(am/10, 1);
      b.gx = (-ax/am*sc)*0.4 + b.gx*0.6; b.gy = (-ay/am*sc)*0.4 + b.gy*0.6;
      for (var i = 0; i < b.PTS; i++) {
        var a2 = (i/b.PTS)*Math.PI*2;
        b.jVel[i] += (Math.cos(a2)*(-ax) + Math.sin(a2)*(-ay)) * am * 0.012;
      }
    }
    b.x = Math.max(0, Math.min(cx-r.left-dragState.ox, W-sz));
    b.y = Math.max(0, Math.min(cy-r.top-dragState.oy, H-sz));
    syncPos(b);
    var relX = cx-r.left, relY = cy-r.top;
    var hovId = findHover(relX, relY, b.id);
    dragState.targetId = hovId;
    for (var oi = 0; oi < boogers.length; oi++) boogers[oi].highlighted = boogers[oi].id === hovId;
    var src = getB(b.id), tgt = hovId !== null ? getB(hovId) : null;
    if (tgt) {
      previewBubble.textContent = previewLabel(src, tgt);
      previewBubble.style.display = 'block';
      previewBubble.style.left = (cx+16) + 'px'; previewBubble.style.top = (cy-38) + 'px';
    } else { previewBubble.style.display = 'none'; }
    var sc2 = centre(b);
    if (tgt) {
      var tc = centre(tgt);
      svgLayer.innerHTML = '<line stroke="#a8e063" stroke-width="3" stroke-dasharray="8 5" opacity="0.7" x1="'+sc2.x+'" y1="'+sc2.y+'" x2="'+tc.x+'" y2="'+tc.y+'"/>';
    } else {
      svgLayer.innerHTML = '<line stroke="#a8e063" stroke-width="3" stroke-dasharray="8 5" opacity="0.5" x1="'+sc2.x+'" y1="'+sc2.y+'" x2="'+relX+'" y2="'+relY+'"/>';
    }
  };

  onUp = function() {
    if (!dragState || dragState.srcId !== b.id) return;
    document.removeEventListener('mousemove', onMove); document.removeEventListener('mouseup', onUp);
    document.removeEventListener('touchmove', onMove); document.removeEventListener('touchend', onUp);
    el.classList.remove('dragging');
    previewBubble.style.display = 'none'; svgLayer.innerHTML = '';
    for (var oi = 0; oi < boogers.length; oi++) boogers[oi].highlighted = false;
    for (var i = 0; i < b.PTS; i++) {
      b.jVel[i] += (Math.random()-0.5)*120 + (Math.cos((i/b.PTS)*Math.PI*2)*b.vx + Math.sin((i/b.PTS)*Math.PI*2)*b.vy)*0.15;
    }
    b.vx=0; b.vy=0; b.prevVx=0; b.prevVy=0;
    var tid = dragState.targetId;
    dragState = null;
    setLabel(b, false);
    if (tid !== null) {
      var src = getB(b.id), tgt = getB(tid);
      if (src && tgt) {
        var res = applyOp(src.num, tgt.op, tgt.num);
        if (!res) return;
        var resR = reduce(res.n, res.d);
        if (!resR || resR.d > 100) return;
        if (resR.n === 0) return;  // don't allow creating a +0 booger
        var mag = Math.abs(fVal(resR));
        if (mag < 0.01 || mag > 100000) return;
        var snap = [];
        for (var si = 0; si < boogers.length; si++) {
          var bx = boogers[si];
          snap.push({id:bx.id, op:bx.op, num:{n:bx.num.n, d:bx.num.d}, color:bx.color, size:bx.size, seed:bx.seed, x:bx.x, y:bx.y, pts:bx.PTS});
        }
        moveLog.push(snap);
        var newOp = (src.op === '*' || src.op === '/') ? src.op : '+';
        var nb = {
          id: boogerIdCounter++, op: newOp, num: resR,
          color: src.color, size: tgt.size, seed: Math.random()*100,
          x: tgt.x, y: tgt.y, wx:0, wy:0, PTS:14,
          jOff: new Float32Array(14).fill(0), jVel: new Float32Array(14).fill(0),
          vx:0, vy:0, prevVx:0, prevVy:0, prevMx:0, prevMy:0,
          gx:0, gy:0, highlighted:false, _canvas:null, _el:null,
        };
        for (var i = 0; i < nb.PTS; i++) nb.jVel[i] = (Math.random()-0.5)*150;
        if (src._el) src._el.remove(); if (tgt._el) tgt._el.remove();
        boogers = boogers.filter(function(x) { return x.id !== src.id && x.id !== tgt.id; });
        boogers.push(nb); createEl(nb);
        checkWin();
      }
    }
  };
}

function getB(id) { for (var i = 0; i < boogers.length; i++) if (boogers[i].id === id) return boogers[i]; return null; }

// ── Undo arrow ────────────────────────────────────────────────────
var undoArrowTimeout = null;
function showUndoArrow() {
  if (moveLog.length === 0) return;
  var btn = document.getElementById('undo-btn');
  var rect = btn.getBoundingClientRect();
  var arrow = document.getElementById('undo-arrow');
  var lbl   = document.getElementById('undo-arrow-label');
  var ax = rect.right + 6, ay = rect.top + (rect.height/2) - 18;
  arrow.style.left = ax + 'px'; arrow.style.top = ay + 'px'; arrow.style.display = 'block';
  lbl.style.left = (rect.left - 10) + 'px'; lbl.style.top = (rect.bottom + 6) + 'px'; lbl.style.display = 'block';
  if (undoArrowTimeout) clearTimeout(undoArrowTimeout);
  undoArrowTimeout = setTimeout(hideUndoArrow, 4000);
}
function hideUndoArrow() {
  document.getElementById('undo-arrow').style.display = 'none';
  document.getElementById('undo-arrow-label').style.display = 'none';
  if (undoArrowTimeout) { clearTimeout(undoArrowTimeout); undoArrowTimeout = null; }
}

// ── Win check ─────────────────────────────────────────────────────
function checkWin() {
  if (boogers.length !== 1) return;
  var b = boogers[0];
  var br = reduce(b.num.n, b.num.d);
  var tr = reduce(target.n, target.d);
  var won = br && tr && br.n === tr.n && br.d === tr.d;
  if (won) {
    var awards = {easy:'🥉 Bronze!', medium:'🥈 Silver!', hard:'🥇 Gold!'};
    document.getElementById('msg-award').textContent = awards[currentDiff];
    document.getElementById('msg-title').textContent = 'Solved!';
    document.getElementById('msg-body').textContent  = 'You reached ' + fStrSigned(target) + '!';
    grantAward(currentDiff);
    document.getElementById('message').style.display = 'block';
  } else {
    showUndoArrow();
  }
}

function undoMove() {
  if (!moveLog.length) return;
  hideUndoArrow();
  boogers.forEach(function(b) { if (b._el) b._el.remove(); });
  boogers = moveLog.pop().map(function(s) {
    return {id:s.id, op:s.op, num:reduce(s.num.n, s.num.d), color:s.color, size:s.size, seed:s.seed, x:s.x, y:s.y,
      PTS:s.pts||14, jOff:new Float32Array(14).fill(0), jVel:new Float32Array(14).fill(0),
      wx:0, wy:0, vx:0, vy:0, prevVx:0, prevVy:0, prevMx:0, prevMy:0, gx:0, gy:0,
      highlighted:false, _canvas:null, _el:null};
  });
  boogers.forEach(function(b) { createEl(b); });
  document.getElementById('message').style.display = 'none';
}

function newPuzzle() {
  cancelAnimationFrame(animId);
  hideUndoArrow();
  moveLog = []; dragState = null;
  boogers.forEach(function(b) { if (b._el) b._el.remove(); }); boogers = [];
  var puz = generatePuzzle(currentDiff);
  target = reduce(puz.target.n, puz.target.d);
  document.getElementById('target-value').textContent = fStrSigned(target);
  boogers = puz.pool.map(function(b, i) { return makeBooger(b, i); });
  var W = gameArea.clientWidth, H = gameArea.clientHeight;
  var pos = [], bi = 0, att = 0, margin = 80;
  while (bi < boogers.length && att < 3000) {
    att++;
    var px = margin + Math.random()*(W-2*margin-140);
    var py = margin + Math.random()*(H-2*margin-140);
    var ok = true;
    for (var pi = 0; pi < pos.length; pi++) if (Math.hypot(pos[pi].x-px, pos[pi].y-py) < 165) { ok = false; break; }
    if (ok) { pos.push({x:px, y:py}); bi++; }
  }
  boogers.forEach(function(b, i) { b.x = pos[i] ? pos[i].x : 80+i*150; b.y = pos[i] ? pos[i].y : 200; createEl(b); });
  document.getElementById('message').style.display = 'none';
  lastTime = performance.now(); animId = requestAnimationFrame(tick);
}

function setDiff(d) {
  currentDiff = d;
  document.querySelectorAll('.diff-btn').forEach(function(btn) {
    btn.classList.toggle('active', btn.dataset.diff === d);
  });
  newPuzzle();
}

// ── Instructions ──────────────────────────────────────────────────
function showInstructions() { document.getElementById('instructions-overlay').classList.add('show'); }
function hideInstructions() { document.getElementById('instructions-overlay').classList.remove('show'); }
function hasSeenInstructions() { try { return localStorage.getItem('mbSeen') === '1'; } catch(e) { return false; } }
function markInstructionsSeen() { try { localStorage.setItem('mbSeen', '1'); } catch(e) {} }

// ── Init ──────────────────────────────────────────────────────────
window.addEventListener('load', function() {
  gameArea      = document.getElementById('game-area');
  svgLayer      = document.getElementById('svg-layer');
  previewBubble = document.getElementById('preview-bubble');
  document.getElementById('undo-btn').onclick = undoMove;
  document.getElementById('next-btn').onclick = function() {
    newPuzzle(); document.getElementById('message').style.display = 'none';
  };
  document.querySelectorAll('.diff-btn').forEach(function(btn) {
    btn.onclick = function() { setDiff(btn.dataset.diff); };
  });
  document.getElementById('help-btn').onclick = showInstructions;
  document.getElementById('close-instructions').onclick = function() { hideInstructions(); markInstructionsSeen(); };
  document.getElementById('instructions-overlay').addEventListener('click', function(e) {
    if (e.target === this) { hideInstructions(); markInstructionsSeen(); }
  });
  updateAwardDisplay();
  newPuzzle();
  if (!hasSeenInstructions()) setTimeout(showInstructions, 400);
});