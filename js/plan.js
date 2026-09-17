/* =========================================================================
   設定檔展覽編譯器 —— 把 exhibition.json 轉成場景物件；程式只讀設定檔。
   用法：view.html?plan=exhibitions/jeju/exhibition.json&lang=zh

   座標約定（設定檔）：單位公尺，x 向右、z 向前、y 向上；hall.x / hall.z 為大廳範圍。
   引擎座標：大廳中心為原點，z 軸相反（前進＝−z）——這裡統一換算，設定檔不用管。

   設定檔結構（摘要，詳見 exhibitions/<展覽>/exhibition.json 的 _readme）：
     hall   大廳尺寸與顏色           zones  展區（矩形、天花高度、氛圍、地面）
     walls  展牆（起點→終點、高、厚、開口）  boards 掛牆物件（掛在哪面牆、離起點幾公尺、哪一側）
     props  自由擺放的道具            lights 燈具（位置＋瞄準點）
     spawn  進場位置與面向            stops / pickups  互動用中繼資料（階段二、三）
   ========================================================================= */
(function () {
  const LANGS = ['zh', 'en', 'ko'];
  function L(obj, lang) {   // 三語欄位取值：缺該語言退回英文，再退回中文
    if (obj == null) return '';
    if (typeof obj === 'string') return obj;
    return obj[lang] ?? obj.en ?? obj.zh ?? Object.values(obj)[0] ?? '';
  }
  const deg = (r) => r * 180 / Math.PI;

  function compile(plan, lang) {
    lang = LANGS.includes(lang) ? lang : (plan.lang || 'zh');
    const H = plan.hall || {};
    const x0 = H.x[0], x1 = H.x[1], z0 = H.z[0], z1 = H.z[1];
    const W = x1 - x0, D = z1 - z0, cx = (x0 + x1) / 2, cz = (z0 + z1) / 2;
    const E = (x, z) => [x - cx, -(z - cz)];                      // 設定檔 → 引擎
    const pal = Object.assign({ wall: '#F6F4EE', floor: '#D9D7D1', dark: '#181D1B', accent: '#E0701F', accent2: '#0F4C50', board: '#D8D3C6' }, plan.palette || {});
    const items = [];
    let n = 0; const id = (p) => `${p}_${++n}`;

    /* ── 展區：天花板／地面板 ── */
    for (const z of (plan.zones || [])) {
      const [zx0, zz0, zx1, zz1] = z.rect; const zw = zx1 - zx0, zd = zz1 - zz0; const [ex, ez] = E((zx0 + zx1) / 2, (zz0 + zz1) / 2);
      const darkish = z.mood === 'dark';
      if (z.ceiling != null && z.ceiling < (H.height || 6) - 0.05) {
        const cc = darkish ? pal.dark : (z.ceilingColor || pal.wall);
        // 天花板底面不受直射光：白色區微發光（均勻照明感），暗區不發光
        items.push({ id: id('ceil'), type: 'prop', shape: 'slab', x: ex, z: ez, w: zw + 0.4, d: zd + 0.4, t: 0.3, y: z.ceiling, color: cc, emis: darkish ? null : cc, ei: z.mood === 'dim' ? 0.12 : (z.mood === 'warm' ? 0.35 : 0.42), zone: z.id, title: `${z.id} 天花` });
      }
      if (z.floor === 'dark') items.push({ id: id('floor'), type: 'prop', shape: 'slab', x: ex, z: ez, w: zw, d: zd, t: 0.02, y: 0.004, color: pal.dark, zone: z.id, title: `${z.id} 地面` });
      if (z.mood === 'sky' && z.skylight !== false) items.push({ id: id('sky'), type: 'prop', shape: 'slab', x: ex, z: ez, w: zw - 1.2, d: zd - 1.2, t: 0.06, y: (H.height || 6) - 0.08, color: '#ffffff', emis: '#fff8ec', ei: z.skyGlow ?? 0.9, zone: z.id, title: `${z.id} 天光` });
    }

    /* ── 展牆（＋開口門楣自動發光：引導動線） ── */
    const wallMap = {};
    for (const w of (plan.walls || [])) {
      const dx = w.to[0] - w.from[0], dz = w.to[1] - w.from[1], len = Math.hypot(dx, dz);
      const heading = deg(Math.atan2(dz, dx));                    // 設定檔航向 = 引擎 rot（見 plan.js 頂註）
      const [mx, mz] = E((w.from[0] + w.to[0]) / 2, (w.from[1] + w.to[1]) / 2);
      const t = w.t || 0.2, h = w.h || 3;
      wallMap[w.id] = Object.assign({ len, t, h, ux: dx / len, uz: dz / len }, w);
      items.push({ id: w.id, type: 'prop', shape: 'wall', x: mx, z: mz, rot: heading, len, h, t, gaps: w.gaps || [], color: w.color || pal.wall, title: w.id });
      for (const gp of (w.gaps || [])) {                          // 門楣：每個開口上方一條發光帶，比周圍亮
        const at = gp.at ?? len / 2, gh = Math.min(h - 0.05, gp.h || 2.4);
        const px = w.from[0] + dx / len * at, pz = w.from[1] + dz / len * at; const [lx, lz] = E(px, pz);
        items.push({ id: id('lintel'), type: 'prop', shape: 'slab', x: lx, z: lz, rot: heading, w: (gp.w || 1.6) + 0.5, d: t + 0.08, t: 0.1, y: gh + 0.03, color: '#ffffff', emis: '#fff4dc', ei: gp.glow ?? w.glow ?? 0.9, title: '開口門楣' });
      }
    }

    /* ── 掛牆物件：kind = work（作品佔位板）/ text（牆文）/ video（黑板）/ audio（發光小點） ── */
    function mountOn(on) {
      const w = wallMap[on.wall]; if (!w) { console.warn('plan: 找不到牆', on.wall); return null; }
      const nL = [-w.uz, w.ux];                                   // 行進方向的左手法線
      const s = on.side === 'R' ? -1 : 1; const nx = nL[0] * s, nz = nL[1] * s;
      const off = w.t / 2 + 0.012;
      const px = w.from[0] + w.ux * on.at + nx * off, pz = w.from[1] + w.uz * on.at + nz * off;
      const [ex, ez] = E(px, pz); const ry = Math.atan2(nx, -nz);   // 引擎法線 (nx, −nz)
      return { p: [ex, on.y ?? 1.5, ez], ry, nx, nz, px, pz };
    }
    for (const b of (plan.boards || [])) {
      const m = mountOn(b.on || {}); if (!m) continue;
      const size = { w: (b.size || [1.2, 0.8])[0], h: (b.size || [1.2, 0.8])[1] };
      // noInfo：階段三接互動前，展品不彈出說明視窗（b.interactive=true 可個別打開）
      const base = { id: b.id, title: b.label || b.id, description: L(b.text, lang), size, frame: 'none', mount: { p: m.p, ry: m.ry }, zone: b.zone, src: b.src || '', meta: b, noInfo: !b.interactive };
      if (b.kind === 'text') items.push(Object.assign(base, { type: 'text', textStyle: b.style || 'vinyl', title: L(b.title, lang) || '', description: L(b.text, lang) || base.title }));
      else if (b.kind === 'audio') items.push({ id: b.id, type: 'prop', shape: 'orb', x: m.p[0], z: m.p[2], y: b.on.y ?? 1.5, emis: pal.accent, title: b.label || b.id, description: L(b.text, lang), zone: b.zone, meta: b });
      else items.push(Object.assign(base, { type: 'image', color: b.kind === 'video' ? pal.dark : (b.color || pal.board), flat: true }));
    }

    /* ── 道具 ── */
    for (const p of (plan.props || [])) {
      const [ex, ez] = E(p.pos[0], p.pos[1]);
      const d = Object.assign({}, p); delete d.pos;
      items.push(Object.assign(d, { type: 'prop', x: ex, z: ez, rot: p.rot || 0, color: p.color || pal.wall, title: p.label || p.id }));
    }

    /* ── 燈具：pos＋h 為燈位，aim 為瞄準點（x, z, y） ── */
    for (const l of (plan.lights || [])) {
      const [ex, ez] = E(l.pos[0], l.pos[1]); const h = l.h ?? 2.8;
      const vx = l.aim[0] - l.pos[0], vy = (l.aim[2] ?? 1.5) - h, vz = -(l.aim[1] - l.pos[1]);   // 引擎向量
      const len = Math.hypot(vx, vy, vz) || 1;
      const tilt = deg(Math.acos(Math.max(-1, Math.min(1, -vy / len)))), pan = deg(Math.atan2(vx, vz));
      items.push({ id: l.id, type: 'light', kind: l.kind || 'spot', x: ex, z: ez, height: h, pan, tilt, color: l.color || '#fff4e0', intensity: l.intensity ?? 6, angle: l.angle, title: l.id });
    }

    /* ── 進場位置 ── */
    const sp = plan.spawn || { x: cx, z: z0 + 1, face: [cx, z1] };
    const [sx, sz] = E(sp.x, sp.z); const [fx, fz] = E(sp.face[0], sp.face[1]);

    const dims = Object.assign({
      width: W, depth: D, height: H.height || 6, wallColor: pal.wall, floorColor: pal.floor, ceilingColor: H.ceiling || pal.wall,
      skirtingColor: H.skirting || '#e6e3dc', lightColor: '#fff6e8', floorType: 'plain', ambient: H.ambient ?? 0.6, plain: true, ceilingGlow: H.ceilingGlow ?? 0.55
    }, H.dims || {});

    return {
      id: 'plan_' + (plan.id || 'ex'), plan, lang,
      title: L(plan.title, lang), description: L(plan.description, lang),
      style: Object.assign({ hdri: 'none', floorTex: 'plain', frameDefault: 'none', font: 'serif', artBar: false, sun: H.sun ?? 1.6, sunAzimuth: H.sunAzimuth ?? 200, sunElev: H.sunElev ?? 72, moodWarm: 50, moodBright: 100, wallColors: {} }, plan.style || {}),
      rooms: [{ id: 'hall', name: L(plan.title, lang), template: 'white', dims, items }],
      start: { x: sx, z: sz, lookAt: { x: fx, z: fz } },
      comments: plan.comments !== false, published: false
    };
  }
  window.PLAN = { compile, L, LANGS };
})();
