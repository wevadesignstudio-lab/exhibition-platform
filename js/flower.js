/* =========================================================================
   紙浪花（十二瓣放射狀剪紙花）——可重複使用的花形產生器，SVG／Canvas／Three.js 共用。
     FLOWER.COLOR[type]                三種身分的顏色：希望（白）、做過（淡藍）、大人（淡黃）
     FLOWER.path(seed)                 → { petals, folds }：半徑 1 的 SVG path 字串（Canvas 用 new Path2D(...)）
     FLOWER.shapes(THREE, seed)        → { shapes:[THREE.Shape×12], folds:[[x0,y0,x1,y1]…] }：半徑 1，給 3D 建模
     FLOWER.draw(ctx, x, y, size, type, rot, seed)   直接畫到 Canvas 2D
   花形：12 片細長圓頭花瓣、每片 30°、中間一條淡摺線、邊緣微不規則（同 seed 永遠剪出同一朵）。
   ========================================================================= */
(function () {
  const COLOR = {
    希望: { fill: '#ffffff', stroke: '#b7bec6' },   // 白：孩子寫的「希望」
    做過: { fill: '#cfe0f0', stroke: '#8fb2d0' },   // 淡藍：孩子寫的「做過」
    大人: { fill: '#f3e9c8', stroke: '#cdb97a' }    // 淡黃：老師與家長
  };
  function rng(seed) { let s = (seed * 9301 + 49297) % 233280; return () => (s = (s * 9301 + 49297) % 233280) / 233280; }

  // 每片花瓣的控制點（花瓣朝 +x，y 向側），回傳 12 片各自轉好角度的點列
  function petalPoints(seed, petals = 12) {
    const r = rng(seed), out = [];
    for (let k = 0; k < petals; k++) {
      const a = k * 2 * Math.PI / petals, ca = Math.cos(a), sa = Math.sin(a);
      const P = (x, y) => [x * ca - y * sa, x * sa + y * ca];
      const w = 0.19 + r() * 0.05, L = 0.9 + r() * 0.1, r0 = 0.1, j = () => (r() - 0.5) * 0.045;
      out.push({
        start: P(r0, -w * 0.35),
        c1: P(L * 0.35 + j(), -w * 0.52 + j()), p1: P(L * 0.72 + j(), -w * 0.5 + j()),         // 一側邊緣出去
        c2: P(L - w * 0.45 + j(), -w * 0.6), tip: P(L, 0), c3: P(L - w * 0.45 + j(), w * 0.6),  // 圓弧頂
        p2: P(L * 0.72 + j(), w * 0.5 + j()), c4: P(L * 0.35 + j(), w * 0.52 + j()), end: P(r0, w * 0.35),   // 另一側回來
        fold: [P(r0 + 0.05, 0), P(L - w * 0.5, 0)]
      });
    }
    return out;
  }
  const pathCache = {};
  function path(seed = 1) {
    if (pathCache[seed]) return pathCache[seed];
    const f = (p) => p.map(v => v.toFixed(3)).join(',');
    let d = '', folds = '';
    for (const p of petalPoints(seed)) {
      d += `M${f(p.start)} Q${f(p.c1)} ${f(p.p1)} Q${f(p.c2)} ${f(p.tip)} Q${f(p.c3)} ${f(p.p2)} Q${f(p.c4)} ${f(p.end)} Z`;
      folds += `M${f(p.fold[0])} L${f(p.fold[1])}`;
    }
    return (pathCache[seed] = { petals: d, folds });
  }
  function shapes(THREE, seed = 1) {
    const shapes = [], folds = [];
    for (const p of petalPoints(seed)) {
      const s = new THREE.Shape(); s.moveTo(...p.start); s.quadraticCurveTo(...p.c1, ...p.p1); s.quadraticCurveTo(...p.c2, ...p.tip); s.quadraticCurveTo(...p.c3, ...p.p2); s.quadraticCurveTo(...p.c4, ...p.end); s.closePath();
      shapes.push(s); folds.push([...p.fold[0], ...p.fold[1]]);
    }
    return { shapes, folds };
  }
  const p2dCache = {};
  function draw(ctx, x, y, size, type, rot = 0, seed = 1) {
    const c = COLOR[type] || COLOR.希望;
    if (!p2dCache[seed]) { const P = path(seed); p2dCache[seed] = { petals: new Path2D(P.petals), folds: new Path2D(P.folds) }; }
    const P = p2dCache[seed];
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(size, size);
    ctx.fillStyle = c.fill; ctx.strokeStyle = c.stroke; ctx.lineWidth = 1 / size; ctx.lineJoin = 'round';
    ctx.fill(P.petals); ctx.stroke(P.petals); ctx.globalAlpha *= 0.5; ctx.lineWidth = 0.6 / size; ctx.stroke(P.folds); ctx.restore();
  }
  window.FLOWER = { COLOR, path, shapes, draw, rng };
})();
