/* =========================================================================
   「浪花：潮」展覽示意頁 —— 讀 data.json，畫平面示意圖與七張立面示意圖（全部 SVG，無外部圖片）。
   內容與尺寸都在 data.json；這支程式只負責「怎麼畫」。
   ========================================================================= */
(async function () {
  const D = await (await fetch('data.json', { cache: 'no-store' })).json();
  const S = D.space, Z = D.zones;
  const qs = new URLSearchParams(location.search);
  let mode = qs.get('mode') === 'back' ? 'back' : 'out';
  let current = qs.get('zone') || null;
  const $ = (s) => document.querySelector(s);
  const esc = (s) => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  /* ── SVG 小工具 ── */
  const h = (tag, a = {}, inner = '') => `<${tag}${Object.entries(a).map(([k, v]) => v == null ? '' : ` ${k}="${v}"`).join('')}>${inner}</${tag}>`;
  const rect = (x, y, w, hgt, a = {}) => h('rect', Object.assign({ x, y, width: w, height: hgt }, a));
  const line = (x1, y1, x2, y2, a = {}) => h('line', Object.assign({ x1, y1, x2, y2 }, a));
  const text = (x, y, s, a = {}) => h('text', Object.assign({ x, y, class: 'txt' }, a), esc(s));
  const path = (d, a = {}) => h('path', Object.assign({ d }, a));
  const poly = (pts, a = {}) => h('polyline', Object.assign({ points: pts.map(p => p.join(',')).join(' ') }, a));

  /* ═════════════════ 平面示意圖（由 space 算座標，單位 m；y 向下） ═════════════════ */
  function layout() {
    const cw = S.corridorW, L = {};
    L.lobby = { x: -1.2, y: 0, w: S.lobbyW, h: S.lobbyD };
    L.corridor = { x: -cw / 2, y: S.lobbyD, w: cw, h: S.corridorLen };
    L.stairs = { x: -cw / 2, y: S.lobbyD + S.corridorLen, w: cw, h: S.stairsLen };
    L.hall = { x: -1.2 - S.hallW, y: -(S.hallD - S.lobbyD) / 2, w: S.hallW, h: S.hallD };
    const hy0 = L.hall.y, hy1 = hy0 + S.hallD, hx1 = L.hall.x + L.hall.w;
    L.opening = { x: hx1, y: 0.2, h: 2.2 };                                     // 大廳→主展場的左轉開口
    L.bwall = { x: hx1, y: 2.6, h: S.lobbyD - 2.6 };                            // 左側白牆（B）
    L.desk = { x: L.lobby.x + S.lobbyW - S.deskW - 0.3, y: 1.4, w: S.deskW, h: S.deskD };
    L.stage = { x: hx1 - 1.4 - S.stageW, y: hy1 - S.stageD, w: S.stageW, h: S.stageD };
    L.seats = []; for (let r = 0; r < S.seatRows; r++) for (let c = 0; c < S.seatsPerRow; c++) L.seats.push({ x: L.stage.x + 0.4 + c * ((S.stageW - 0.8) / (S.seatsPerRow - 1)) - 0.2, y: L.stage.y - 0.9 - r * 0.8, w: 0.4, h: 0.4 });
    const dx = L.stage.x - 2.0;                                                  // 三道旋轉門的 x
    L.doors = []; const span = S.hallD - 2, seg = span / S.doorCount;
    for (let i = 0; i < S.doorCount; i++) L.doors.push({ x: dx, y: hy0 + 1 + i * seg + 0.35, len: seg - 0.7 });
    L.lane = hy0 + 1 + seg;                                                       // 走道 y：正好是門一、門二之間的縫
    const px0 = dx - 1.8, pxStep = (dx - 1.8 - (L.hall.x + S.endRoomW + 1.2)) / (S.pillarsPerSide - 1);
    L.pillars = []; for (let i = 0; i < S.pillarsPerSide; i++) for (const side of [-1, 1]) L.pillars.push({ x: px0 - i * pxStep - 0.3, y: L.lane + side * 2.8 - 0.3 + (side > 0 ? 0.8 : 0), s: 0.6, i, side });
    L.endRoom = { x: L.hall.x, y: hy0, w: S.endRoomW, h: S.hallD };
    L.partition = { x: L.hall.x + S.endRoomW, gapY: L.lane - 0.9, gapH: 2.0 };
    L.lowWall = { x: L.hall.x + 1.6, y: hy0 + 2.2, h: S.hallD - 4.4 };
    L.screen = { x: L.hall.x, y: hy0 + 3.2, h: S.hallD - 6.4 };
    // 動線（去程／回程）由幾何自動算
    const ly = L.lane, cx = 0;
    L.routeOut = [[cx, L.stairs.y + S.stairsLen - 0.4], [cx, L.stairs.y + 0.2], [cx, L.corridor.y + 0.2], [cx, L.opening.y + 1.0], [hx1 - 0.6, L.opening.y + 1.0], [hx1 - 2.0, ly - 0.15], [dx + 1.2, ly - 0.15], [dx - 1.2, ly - 0.15], [L.partition.x + 0.6, ly], [L.lowWall.x + 0.9, ly]];
    const o = 0.9;
    L.routeBack = [[L.lowWall.x + 0.9, ly + o], [L.partition.x + 0.6, ly + o], [dx - 1.2, ly + 0.2], [dx + 1.2, ly + 0.2], [hx1 - 2.0, ly + 0.2], [hx1 - 0.6, L.opening.y + 1.6], [cx + 0.4, L.opening.y + 1.9], [L.desk.x - 0.6, L.desk.y + S.deskD / 2], [cx + 0.5, L.corridor.y + 0.2], [cx + 0.5, L.stairs.y + S.stairsLen - 0.4]];
    return L;
  }

  function drawPlan() {
    const L = layout(); const M = 1.6;
    const minX = L.hall.x - M, maxX = L.lobby.x + S.lobbyW + M, minY = L.hall.y - M, maxY = L.stairs.y + S.stairsLen + M;
    const W = maxX - minX, H = maxY - minY, K = 34;                               // 每公尺 34px
    const back = mode === 'back';
    let g = '';
    // 房間外框
    for (const r of [L.hall, L.lobby, L.corridor, L.stairs]) g += rect(r.x, r.y, r.w, r.h, { class: 'room' });
    g += rect(L.endRoom.x, L.endRoom.y, L.endRoom.w, L.endRoom.h, { class: 'room' });
    // 隔間牆（盡頭小空間）：留開口
    g += line(L.partition.x, L.hall.y, L.partition.x, L.partition.gapY, { class: 'wall' }) + line(L.partition.x, L.partition.gapY + L.partition.gapH, L.partition.x, L.hall.y + L.hall.h, { class: 'wall' });
    // 大廳與主展場之間：白牆（B）＋開口
    g += line(L.bwall.x, L.bwall.y, L.bwall.x, L.bwall.y + L.bwall.h, { class: 'wall thick' });
    g += line(L.opening.x, L.hall.y, L.opening.x, L.opening.y, { class: 'wall' });
    // 樓梯踏階
    for (let i = 1; i < 7; i++) g += line(L.stairs.x, L.stairs.y + i * (S.stairsLen / 7), L.stairs.x + L.stairs.w, L.stairs.y + i * (S.stairsLen / 7), { class: 'ln thin' });
    g += text(L.stairs.x + L.stairs.w + 0.4, L.stairs.y + S.stairsLen / 2, '樓梯', { class: 'txt lbl' });
    // 門：雙扇門（樓梯→走廊）、玻璃雙扇門（走廊→大廳）
    const door = (y, glass) => { const c = L.corridor.x + L.corridor.w / 2; return path(`M${L.corridor.x},${y} A${c - L.corridor.x},${c - L.corridor.x} 0 0 1 ${c},${y - (c - L.corridor.x)}`, { class: glass ? 'bluel thin' : 'ln thin' }) + path(`M${L.corridor.x + L.corridor.w},${y} A${c - L.corridor.x},${c - L.corridor.x} 0 0 0 ${c},${y - (c - L.corridor.x)}`, { class: glass ? 'bluel thin' : 'ln thin' }); };
    g += door(L.stairs.y, false) + text(L.corridor.x + L.corridor.w + 0.4, L.stairs.y - 0.2, '雙扇門', { class: 'txt lbl' });
    g += door(L.corridor.y, true) + text(L.corridor.x + L.corridor.w + 0.4, L.corridor.y - 0.2, '玻璃雙扇門', { class: 'txt lbl' });
    g += text(L.corridor.x + L.corridor.w + 0.4, L.corridor.y + S.corridorLen * 0.55, `走廊 ${S.corridorLen} m`, { class: 'txt lbl' });
    g += text(L.lobby.x + 2.2, L.lobby.y + 0.9, '大廳', { class: 'txt lbl' });
    // 服務台
    g += rect(L.desk.x, L.desk.y, L.desk.w, L.desk.h, { class: 'ln' }) + text(L.desk.x + L.desk.w / 2, L.desk.y + L.desk.h / 2 + 0.15, '服務台', { class: 'txt lbl mid' });
    // 舞台＋座椅
    g += rect(L.stage.x, L.stage.y, L.stage.w, L.stage.h, { class: 'ln' }) + text(L.stage.x + L.stage.w / 2, L.stage.y + L.stage.h / 2 + 0.15, '舞台', { class: 'txt lbl mid' });
    for (const s of L.seats) g += rect(s.x, s.y, s.w, s.h, { class: 'ln thin' });
    // 三道旋轉門
    L.doors.forEach((d, i) => { g += line(d.x, d.y, d.x, d.y + d.len, { class: 'wall thick' }) + h('circle', { cx: d.x, cy: d.y + d.len / 2, r: 0.16, class: 'blue' }) + text(d.x + 0.35, d.y + d.len / 2 + 0.14, `門${'一二三'[i]}`, { class: 'txt lbl' }); });
    // 展覽柱
    for (const p of L.pillars) g += rect(p.x, p.y, p.s, p.s, { class: 'wall' });
    g += text(L.pillars[7].x + 0.9, L.pillars[1].y + 1.4, '展覽柱 ×8（左右各四）', { class: 'txt lbl' });
    // 盡頭：矮牆＋螢幕
    g += line(L.lowWall.x, L.lowWall.y, L.lowWall.x, L.lowWall.y + L.lowWall.h, { class: 'bluel thick' }) + text(L.lowWall.x + 0.3, L.lowWall.y + L.lowWall.h + 0.6, `矮牆 ${S.lowWallHeight * 100} cm`, { class: 'txt lbl' });
    g += line(L.screen.x + 0.15, L.screen.y, L.screen.x + 0.15, L.screen.y + L.screen.h, { class: 'ln thick' });
    // 動線
    const r1 = L.routeOut, r2 = L.routeBack;
    g += poly(r1, { class: 'route out' + (back ? ' dim' : ''), 'marker-end': 'url(#arrowOut)' });
    g += poly(r2, { class: 'route back' + (back ? '' : ' dim'), 'marker-end': 'url(#arrowBack)' });
    g += text(r1[0][0] - 0.5, r1[0][1] + 1.0, '入口', { class: 'txt lbl' }) + text(L.lowWall.x + 1.3, L.lane + 1.3, '折返', { class: 'txt lbl' });
    // 展區區塊（可點擊）
    const zoneShapes = {
      A: [L.corridor], B: [{ x: L.bwall.x - 0.55, y: L.bwall.y, w: 0.9, h: L.bwall.h }],
      C: [L.stage, { x: L.doors[0].x - 0.6, y: L.doors[0].y - 0.4, w: 1.2, h: L.doors[2].y + L.doors[2].len - L.doors[0].y + 0.8 }],
      D: [{ x: L.pillars[6].x - 0.4, y: L.pillars[0].y - 0.5, w: L.pillars[0].x - L.pillars[6].x + 1.4, h: 1.6 }, { x: L.pillars[7].x - 0.4, y: L.pillars[1].y - 0.5, w: L.pillars[1].x - L.pillars[7].x + 1.4, h: 1.6 }],
      E: [L.endRoom],
      F: [L.stage, { x: L.doors[0].x - 0.6, y: L.doors[0].y - 0.4, w: 1.2, h: L.doors[2].y + L.doors[2].len - L.doors[0].y + 0.8 }, { x: L.pillars[6].x - 0.4, y: L.pillars[0].y - 0.5, w: L.pillars[0].x - L.pillars[6].x + 1.4, h: 1.6 }, { x: L.pillars[7].x - 0.4, y: L.pillars[1].y - 0.5, w: L.pillars[1].x - L.pillars[7].x + 1.4, h: 1.6 }],
      G: [L.desk]
    };
    const labelAt = { A: [L.corridor.x - 1.0, L.corridor.y + S.corridorLen * 0.55], B: [L.bwall.x - 1.4, L.bwall.y + L.bwall.h / 2], C: [L.stage.x - 1.5, L.stage.y + 1.0], D: [L.pillars[4].x + 0.3, L.pillars[0].y - 1.2], E: [L.endRoom.x + L.endRoom.w / 2, L.hall.y + 1.0], F: [L.doors[0].x + 1.4, L.hall.y + 0.9], G: [L.desk.x + L.desk.w / 2, L.desk.y + L.desk.h + 0.9] };
    for (const z of Z) {
      if (z.returnOnly && !back) continue;
      const on = current === z.id;
      let inner = zoneShapes[z.id].map(r => rect(r.x, r.y, r.w, r.h, { class: 'zone' + (z.returnOnly ? ' hatch' : ''), rx: 0.15 })).join('');
      const [lx, ly] = labelAt[z.id];
      inner += h('circle', { cx: lx, cy: ly, r: 0.55, class: 'badge' }) + text(lx, ly + 0.2, z.id, { class: 'txt badgeTxt mid' }) + text(lx + 0.75, ly + 0.18, z.name, { class: 'txt zname' });
      g += h('g', { class: 'zoneG' + (on ? ' on' : ''), 'data-zone': z.id, role: 'button', tabindex: 0, 'aria-label': `${z.id} ${z.name}` }, inner);
    }
    const defs = `<defs><marker id="arrowOut" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" class="arrowOut"/></marker><marker id="arrowBack" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" class="arrowBack"/></marker><pattern id="hatch" patternUnits="userSpaceOnUse" width="0.5" height="0.5" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="0.5" class="hatchLn"/></pattern></defs>`;
    $('#plan').innerHTML = `<svg viewBox="${minX} ${minY} ${W} ${H}" width="${Math.round(W * K)}" height="${Math.round(H * K)}" font-size="0.62">${defs}${g}</svg>`;
    $('#plan').querySelectorAll('.zoneG').forEach(el => { el.onclick = () => select(el.dataset.zone); el.onkeydown = e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); select(el.dataset.zone); } }; });
  }

  /* ═════════════════ 立面示意圖（600×320，線稿） ═════════════════ */
  const V = (inner) => `<svg viewBox="0 0 600 320" class="elev">${inner}</svg>`;
  const wave = (x, y, w, amp, n, a = {}) => { let d = `M${x},${y}`; const seg = w / n; for (let i = 0; i < n; i++) d += ` q${seg / 4},${-amp} ${seg / 2},0 t${seg / 2},0`; return path(d, Object.assign({ class: 'bluel' }, a)); };
  const flake = (x, y, s, cls) => path(`M${x - s},${y + s * 0.6} q${s * 0.5},${-s * 1.6} ${s},${-s * 0.3} q${s * 0.3},${-s * 0.9} ${s},${s * 0.3} z`, { class: cls });
  const DIAG = {
    corridor(p) {   // 走廊：透視、兩側浪花越裡越高越密、地面投影波浪線
      let g = '';
      const vx = 300, vy = 130, n = p.waves || 14;
      g += line(20, 300, vx, vy, { class: 'ln' }) + line(580, 300, vx, vy, { class: 'ln' }) + line(20, 30, vx, vy, { class: 'ln' }) + line(580, 30, vx, vy, { class: 'ln' });
      g += line(20, 30, 20, 300, { class: 'ln' }) + line(580, 30, 580, 300, { class: 'ln' });
      for (let i = 0; i < n; i++) {
        const t = i / (n - 1), x = 20 + (vx - 20) * Math.pow(t, 0.75) * 0.93, s = 22 - 16 * t;
        const rows = 1 + Math.round(t * 4);
        for (let r = 0; r < rows; r++) { const y = 300 - (300 - vy) * Math.pow(t, 0.75) * 0.93 - 18 - r * (s * 1.8); g += flake(x, y, s, r % 3 === 1 ? 'blue' : 'soft'); g += flake(600 - x, y, s, r % 3 === 2 ? 'blue' : 'soft'); }
      }
      for (let k = 0; k < 4; k++) g += wave(60 + k * 30, 250 + k * 12, 480 - k * 60, 4 - k * 0.6, 8 + k * 2, { class: 'bluel thin' });
      g += text(300, 306, '地面：數位海投影', { class: 'txt cap mid' }) + text(60, 22, '左牆：孩子的浪花', { class: 'txt cap' }) + text(400, 22, '右牆：老師與家長的浪花', { class: 'txt cap' });
      return V(g);
    },
    projection(p) {   // 白牆大投影框：左半灰階、右半上色；兩副耳機
      let g = rect(40, 40, 380, 220, { class: 'ln thick' }) + rect(48, 48, 364, 204, { class: 'paper' });
      for (let r = 0; r < 6; r++) for (let c = 0; c < 8; c++) { const x = 58 + c * 43, y = 60 + r * 31; const left = c < 4; g += rect(x, y, 36, 24, { class: left ? (r % 2 ? 'soft' : 'softer') : ((r + c) % 3 ? 'blue' : 'soft') }); }
      g += line(230, 48, 230, 252, { class: 'ln thin' }) + text(139, 275, '修復前・灰階', { class: 'txt cap mid' }) + text(321, 275, 'AI 上色', { class: 'txt cap mid' });
      for (let i = 0; i < (p.headphones || 2); i++) { const x = 480 + i * 60; g += line(x, 40, x, 90, { class: 'ln thin' }) + path(`M${x - 28},150 a28,28 0 0 1 56,0`, { class: 'ln' }) + rect(x - 34, 145, 14, 26, { class: 'ln', rx: 4 }) + rect(x + 20, 145, 14, 26, { class: 'ln', rx: 4 }); }
      g += text(510, 200, '耳機：1985 手寫樂譜', { class: 'txt cap mid' }) + text(300, 306, '大廳左側白牆', { class: 'txt cap mid' });
      return V(g);
    },
    doors(p, back) {   // 三扇門板＋年段＋作品方塊；前方舞台與椅子；回程＝背面
      let g = ''; const doors = p.doors || ['門一', '門二', '門三'];
      doors.forEach((label, i) => {
        const x = 40 + i * 180; g += rect(x, 30, 150, 170, { class: back ? 'dark' : 'ln' });
        if (back) { for (let k = 0; k < 5; k++) g += wave(x + 8, 60 + k * 30, 134, 5, 5, { class: 'bluel faintLn thin' }); g += text(x + 75, 120, D.zones.find(z => z.id === 'F').questions[0].q, { class: 'txt faint tiny mid' }); }
        else { const n = p.worksPerDoor || 6; for (let k = 0; k < n; k++) g += rect(x + 14 + (k % 3) * 44, 62 + Math.floor(k / 3) * 56, 34, 40, { class: k % 4 === 0 ? 'blue' : 'soft' }); }
        g += text(x + 75, back ? 190 : 46, back ? '背面' : label, { class: 'txt cap mid' });
      });
      g += rect(120, 232, 360, 20, { class: 'ln' }) + text(300, 246, '舞台・12/5 乘浪小沙龍', { class: 'txt cap mid' });
      for (let r = 0; r < (p.chairRows || 3); r++) for (let c = 0; c < 8; c++) g += rect(150 + c * 40, 262 + r * 16, 22, 10, { class: 'ln thin' });
      return V(g);
    },
    pillars(p, back) {   // 八根柱兩排：格子越靠盡頭越密；回程＝背面
      let g = ''; const n = p.perSide || 4, F = D.zones.find(z => z.id === 'F');
      for (let row = 0; row < 2; row++) for (let i = 0; i < n; i++) {
        const t = i / (n - 1), w = 62 - row * 14, hgt = 190 - row * 40, x = 50 + i * 130 + row * 46, y = (row ? 60 : 100);
        g += rect(x, y, w, hgt, { class: back ? 'dark' : 'ln' });
        if (back) { for (let k = 0; k < 4; k++) g += wave(x + 4, y + 30 + k * 40, w - 8, 4, 3, { class: 'bluel faintLn thin' }); }
        else { const cell = 12 - 6 * t, cols = Math.floor((w - 8) / cell), rows = Math.floor((hgt - 8) / cell); for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) g += rect(x + 4 + c * cell, y + 4 + r * cell, cell - 2, cell - 2, { class: ((r * 7 + c * 3 + i) % 5 === 0) ? 'blue' : (t > 0.5 && (r + c) % 2 ? 'soft' : 'softer') }); }
      }
      const lb = p.labels || ['知識', '陪伴'];
      if (back) { g += text(150, 300, `前四根背面：${F.questions[1].q}`, { class: 'txt faint tiny mid' }) + text(450, 300, `後四根背面：${F.questions[2].q}`, { class: 'txt faint tiny mid' }); }
      else { g += text(150, 300, `前四根・${lb[0]}類`, { class: 'txt cap mid' }) + text(450, 300, `後四根・${lb[1]}類（更密、更亮）`, { class: 'txt cap mid' }); }
      g += text(560, 40, '→ 盡頭', { class: 'txt cap' });
      return V(g);
    },
    lowwall(p) {   // 後方發亮螢幕、前方矮牆吊卡、彎腰的人
      let g = `<defs><radialGradient id="glow" cx="50%" cy="50%" r="60%"><stop offset="0" class="glow0"/><stop offset="1" class="glow1"/></radialGradient></defs>`;
      g += rect(120, 30, 360, 150, { class: 'ln thick' }) + rect(126, 36, 348, 138, { fill: 'url(#glow)' });
      for (let k = 0; k < 7; k++) g += rect(150 + k * 46, 100 - Math.abs(k - 3) * 10, 30, 30, { class: k % 2 ? 'blue' : 'paper', opacity: 0.5 + k * 0.07 });
      g += text(300, 194, '輪播：越轉越快', { class: 'txt cap mid' });
      const wallY = 300 - (p.wallHeight || 0.8) * 100;           // 1 m = 100px；成人視線約 1.5 m
      g += rect(80, wallY, 340, 300 - wallY, { class: 'ln' }) + text(90, wallY - 8, `矮牆 ${(p.wallHeight || 0.8) * 100} cm`, { class: 'txt cap' });
      const n = p.cards || 9; for (let k = 0; k < n; k++) { const x = 96 + k * (320 / n); g += line(x + 12, wallY, x + 12, wallY - 22, { class: 'ln thin' }) + rect(x, wallY - 40, 24, 18, { class: k % 3 === 0 ? 'blue' : 'paper' }); }
      g += text(250, wallY + 45, '外面：大人的話　打開：孩子的回應', { class: 'txt cap mid' });
      // 彎腰閱讀的人（線條人）
      const px = 500; g += h('circle', { cx: px + 22, cy: wallY - 40, r: 11, class: 'ln' }) + path(`M${px},300 L${px + 4},${wallY + 10} L${px + 18},${wallY - 28}`, { class: 'ln' }) + path(`M${px + 4},${wallY + 10} L${px + 30},${wallY - 12} L${px + 46},${wallY - 24}`, { class: 'ln thin' }) + line(px + 4, wallY + 10, px + 26, 300, { class: 'ln' });
      g += line(px - 20, 150, px - 20, 150, { class: 'ln' }) + text(px + 20, 150, '大人要彎腰', { class: 'txt cap mid' }) + text(px + 20, 166, '才到孩子的視線', { class: 'txt cap mid' });
      return V(g);
    },
    darkboard(p) {   // 深色背板淡浪紋藏字＋回彎箭頭
      const F = D.zones.find(z => z.id === 'F'); let g = rect(40, 30, 520, 190, { class: 'dark' });
      for (let k = 0; k < 7; k++) g += wave(50, 55 + k * 25, 500, 6, 9, { class: 'bluel faintLn thin' });
      F.questions.forEach((q, i) => { g += text(300, 60 + i * 40, q.q, { class: 'txt faint tiny mid' }) + text(58, 60 + i * 40, q.where, { class: 'txt faint tiny' }); });
      g += rect(200, 236, 200, 8, { class: 'bluel thin' }) + path('M420,300 C520,300 520,250 420,250 L440,240 M420,250 L440,260', { class: 'bluel', 'marker-end': '' }) + text(300, 292, p.arrowText || '轉身，看看背面', { class: 'txt cap mid' });
      g += text(300, 26, '用潮汐卡的紅色小窗，才看得見浪紋裡的問題', { class: 'txt cap mid' });
      return V(g);
    },
    jars(p) {   // 書寫桌＋四個高度不同的玻璃罐
      let g = rect(40, 200, 220, 8, { class: 'ln' }) + line(52, 208, 52, 300, { class: 'ln' }) + line(248, 208, 248, 300, { class: 'ln' }) + rect(90, 176, 60, 18, { class: 'paper' }) + line(110, 166, 118, 176, { class: 'ln thin' }) + text(150, 230, '潮汐卡：寫下擔心', { class: 'txt cap mid' });
      const jars = p.jars || ['學習', '思考', '關係', '等待'];
      jars.forEach((lb, i) => { const x = 300 + i * 70, hgt = 90 + i * 28, y = 300 - hgt; g += rect(x, y, 52, hgt, { class: 'ln', rx: 10 }) + rect(x + 8, y - 10, 36, 10, { class: 'ln', rx: 3 }); for (let k = 0; k < 2 + i; k++) g += rect(x + 10 + (k % 2) * 16, y + hgt - 22 - Math.floor(k / 2) * 14, 14, 9, { class: k % 3 ? 'paper' : 'blue', transform: `rotate(${(k * 37) % 30 - 15} ${x + 17} ${y + hgt - 18})` }); g += text(x + 26, y + hgt / 2 + 4, lb, { class: 'txt cap mid' }); });
      g += text(300, 306, '服務台出口：把擔心交給下一次潮水', { class: 'txt cap mid' });
      return V(g);
    }
  };

  /* ═════════════════ 面板 ═════════════════ */
  function renderPanel() {
    const z = Z.find(x => x.id === current);
    const box = $('#panel');
    if (!z || (z.returnOnly && mode !== 'back')) {
      box.innerHTML = `<div class="ph"><div class="phK">${mode === 'back' ? '回程' : '去程'}</div><p>${esc(D.intro)}</p><p class="dim">點平面圖上的展區字母，查看立面示意圖與說明。${mode === 'out' ? 'F 暗流只在回程出現。' : ''}</p></div>`;
      return;
    }
    const back = mode === 'back';
    const fn = DIAG[z.diagram.type] || (() => '');
    const body = back && z.backText ? z.backText : z.text;
    let extra = '';
    if (z.questions && back) extra = `<ul class="qs">${z.questions.map(q => `<li><span>${esc(q.where)}</span>${esc(q.q)}</li>`).join('')}</ul>`;
    box.innerHTML = `<h3>立面示意圖</h3><div class="pgrid"><div>${fn(z.diagram, back)}</div><div>
      <div class="zhead"><span class="badgeL">${z.id}</span><div><div class="zn">${esc(z.name)}</div><div class="zs">${esc(z.subtitle)}</div></div></div>
      <div class="zloc">${esc(z.location)}${back && (z.diagram.type === 'doors' || z.diagram.type === 'pillars') ? '・背面' : ''}</div>
      <p class="ztext">${esc(body)}</p>${extra}
      ${back && z.backText && z.text ? `<p class="dim small">去程說明：${esc(z.text)}</p>` : ''}</div></div>`;
    box.scrollTop = 0;
  }
  function select(id) { current = id; syncUrl(); drawPlan(); renderPanel(); if (innerWidth < 900) $('#panel').scrollIntoView({ behavior: 'smooth', block: 'start' }); }
  function setMode(m) { mode = m; document.documentElement.dataset.mode = m; if (mode !== 'back' && current === 'F') current = null; syncUrl(); drawPlan(); renderPanel(); $('#mOut').classList.toggle('on', mode === 'out'); $('#mBack').classList.toggle('on', mode === 'back'); $('#modeNote').textContent = D.modes[mode].note; }
  function syncUrl() { const u = new URL(location.href); u.searchParams.set('mode', mode); if (current) u.searchParams.set('zone', current); else u.searchParams.delete('zone'); history.replaceState(null, '', u); }

  /* ═════════════════ 初始化 ═════════════════ */
  document.title = `${D.title}｜${D.titleEn}`;
  $('#tTitle').textContent = D.title; $('#tEn').textContent = D.titleEn; $('#tSchool').textContent = D.school; $('#tVenue').textContent = D.venue;
  $('#zoneList').innerHTML = Z.map(z => `<button class="zl" data-zone="${z.id}" ${z.returnOnly ? 'data-ro="1"' : ''}><b>${z.id}</b>${esc(z.name)}<span>${esc(z.subtitle)}</span></button>`).join('');
  $('#zoneList').querySelectorAll('.zl').forEach(b => b.onclick = () => { if (b.dataset.ro && mode !== 'back') setMode('back'); select(b.dataset.zone); });
  $('#mOut').onclick = () => setMode('out'); $('#mBack').onclick = () => setMode('back');
  setMode(mode);
})();
