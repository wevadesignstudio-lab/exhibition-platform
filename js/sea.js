/* =========================================================================
   數位海（地面投影）——Canvas 模擬，投到 3D 地面板上當貼圖。無 DOM，純資料。
     const sea = SEA.create({ w, d, sentences, count, speed, size })   w×d 公尺（決定畫布比例）
     sea.canvas                 每幀更新的畫布（給 THREE.CanvasTexture）
     sea.update(dt)             推進動畫（dt 秒）；回傳 true 表示畫布有變
     sea.ripple(u, v, strong)   在 u,v（0～1，v 由北到南）泛漣漪並推開附近浪花
     sea.pick(u, v)             回傳該處最近的一朵浪花 { text, who, type } 或 null
     sea.setEbb(on)             退潮（浪花慢慢退到南緣、海面變淺）／漲潮
   調整數量、速度：create 的 count / speed，或 SEA.CFG 的預設值。
   ========================================================================= */
(function () {
  const CFG = { count: 40, speed: 1, size: [0.035, 0.075], ebbSeconds: 7, px: 96 };   // size 以畫布寬度為 1 的比例；px＝每公尺畫素
  const lerp = (a, b, t) => a + (b - a) * t, ease = (t) => t * t * (3 - 2 * t);
  const hex = (c) => [parseInt(c.slice(1, 3), 16), parseInt(c.slice(3, 5), 16), parseInt(c.slice(5, 7), 16)];
  const mix = (c1, c2, t) => { const a = hex(c1), b = hex(c2); return `rgb(${a.map((v, i) => Math.round(lerp(v, b[i], t))).join(',')})`; };

  function create(o = {}) {
    const wM = o.w || 4, dM = o.d || 6, S = (o.sentences && o.sentences.length) ? o.sentences : [{ text: '（尚無句子）', who: '', type: '希望' }];
    const count = o.count ?? CFG.count, speed = o.speed ?? CFG.speed, [s0, s1] = o.size || CFG.size;
    const W = Math.round(wM * CFG.px), H = Math.round(dM * CFG.px);
    const canvas = document.createElement('canvas'); canvas.width = W; canvas.height = H;
    const ctx = canvas.getContext('2d'), r = FLOWER.rng(o.seed || 23);
    const F = [];
    for (let i = 0; i < count; i++) {
      F.push({ x: r() * W, y: r() * H, size: (s0 + r() * (s1 - s0)) * W, rot: r() * 6.283, vr: (r() - 0.5) * 0.25, ph: r() * 6.283, dx: (r() - 0.5) * 6, vx: 0, vy: 0, seed: 20 + (i % 8), s: S[i % S.length], drawY: 0 });
    }
    const ripples = []; let ebb = 0, ebbTarget = 0, t = 0;
    function ripple(u, v, strong) {
      const x = u * W, y = v * H; ripples.push({ x, y, r: 3, life: 1, k: strong ? 1.4 : 1 });
      const R = W * 0.16;
      for (const f of F) { const dx = f.x - x, dy = f.y - y, d = Math.hypot(dx, dy) || 1; if (d < R) { const k = (1 - d / R) * 2.4 * (strong ? 1.6 : 1); f.vx += dx / d * k; f.vy += dy / d * k; } }
    }
    function pick(u, v) {
      const x = u * W, y = v * H; let best = null, bd = 1e9;
      for (const f of F) { const d = Math.hypot(f.x - x, f.drawY - y); if (d < Math.max(f.size * 1.8, W * 0.1) && d < bd) { bd = d; best = f; } }   // 點在浪花附近就算
      return best ? best.s : null;
    }
    function setEbb(on) { ebbTarget = on ? 1 : 0; }
    function update(dt0) {
      const dt = Math.min(0.05, dt0) * speed; t += dt;
      ebb += Math.sign(ebbTarget - ebb) * Math.min(Math.abs(ebbTarget - ebb), dt / CFG.ebbSeconds); const E = ease(ebb);
      const bg = ctx.createLinearGradient(0, 0, 0, H);   // 深藍海面；退潮變淺、南緣露出沙色
      bg.addColorStop(0, mix('#0d2440', '#6f9fc4', E)); bg.addColorStop(0.7, mix('#15466e', '#a9c6da', E)); bg.addColorStop(1, mix('#1b5a86', '#d9cfb6', E));
      ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
      for (let i = 0; i < 7; i++) {   // 緩慢起伏的波浪帶（呼吸感）
        const base = H * (0.08 + i * 0.14) + E * H * 0.25;
        ctx.beginPath();
        for (let x = 0; x <= W; x += 8) { const y = base + Math.sin(x * 0.011 + t * 0.35 + i * 1.3) * H * 0.03 + Math.sin(x * 0.031 - t * 0.22 + i) * H * 0.012; x ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }
        ctx.strokeStyle = `rgba(255,255,255,${0.07 + i * 0.02})`; ctx.lineWidth = 1.4; ctx.stroke();
        ctx.lineTo(W, H); ctx.lineTo(0, H); ctx.closePath(); ctx.fillStyle = 'rgba(255,255,255,0.025)'; ctx.fill();
      }
      for (let i = ripples.length - 1; i >= 0; i--) {   // 漣漪：一圈圈擴散淡出
        const p = ripples[i]; p.r += W * 0.1 * dt * p.k; p.life -= dt / 1.7; if (p.life <= 0) { ripples.splice(i, 1); continue; }
        ctx.strokeStyle = `rgba(255,255,255,${(p.life * 0.4).toFixed(3)})`; ctx.lineWidth = 1.2;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 6.283); ctx.stroke(); ctx.beginPath(); ctx.arc(p.x, p.y, p.r * 0.55, 0, 6.283); ctx.stroke();
      }
      for (const f of F) {   // 浪花：漂動、緩慢旋轉、被推開；退潮往南緣退去
        f.x += (f.dx + f.vx) * dt * 4; f.y += f.vy * dt * 4; f.vx *= 0.92; f.vy *= 0.92; f.rot += f.vr * dt;
        if (f.x < -30) f.x = W + 30; if (f.x > W + 30) f.x = -30; if (f.y < -30) f.y = H + 30; if (f.y > H + 30) f.y = -30;
        const bob = Math.sin(t * 0.5 + f.ph) * 3; f.drawY = lerp(f.y + bob, H + 60, E);
        FLOWER.draw(ctx, f.x, f.drawY, f.size * (1 - E * 0.25), f.s.type, f.rot, f.seed);
      }
      return true;
    }
    return { canvas, update, ripple, pick, setEbb, get ebb() { return ebbTarget === 1; }, W, H };
  }
  window.SEA = { CFG, create };
})();
