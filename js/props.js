/* =========================================================================
   道具／傢俱庫 —— 30+ 種程序生成的展場道具與辦公傢俱。
   window.PROPS.catalog：清單（給編輯器選單用）
   window.PROPS.build(THREE, shape, opts)：回傳一個 THREE.Group
   opts: { color, roomHeight }
   （需在使用 THREE 的 module 中呼叫，THREE 由參數傳入，避免相依問題）
   ========================================================================= */
window.PROPS = {
  catalog: [
    { cat: '真實模型：展品', items: [
      ['glb:bronze_ray_statue_1k', '青銅魟魚雕像'], ['glb:moon_rock_01_1k', '月岩標本'],
      ['glb:IridescentDishWithOlives', '玻璃果盤'], ['glb:postcard_set_01_1k', '明信片組'],
      ['glb:standing_picture_frame_01_1k', '桌上相框 A'], ['glb:standing_picture_frame_02_1k', '桌上相框 B']
    ]},
    { cat: '真實模型：傢俱', items: [
      ['glb:SheenWoodLeatherSofa', '木框皮革沙發'], ['glb:SheenChair', '絨面扶手椅'], ['glb:ChairDamaskPurplegold', '錦緞單椅'],
      ['glb:coffee_table_round_01_1k', '圓形茶几'], ['glb:modern_wooden_cabinet_1k', '現代木櫃'], ['glb:vintage_wooden_drawer_01_1k', '復古木抽屜櫃']
    ]},
    { cat: '真實模型：掛牆／吊頂', items: [
      ['glb:fancy_picture_frame_01_1k', '華麗畫框 A'], ['glb:fancy_picture_frame_02_1k', '華麗畫框 B'], ['glb:hanging_picture_frame_02_1k', '吊掛畫框'],
      ['glb:television_02_1k', '壁掛電視'], ['glb:projector_screen_1k', '投影布幕'],
      ['glb:industrial_wall_sconce_1k', '工業壁燈（會發光）'], ['glb:modern_ceiling_lamp_01_1k', '現代吊燈（會發光）']
    ]},
    { cat: '真實模型：植栽／戶外', items: [
      ['glb:anthurium_botany_01_1k', '紅掌盆栽'], ['glb:dead_tree_trunk_02_1k', '枯木裝置'], ['glb:island_tree_03_1k', '大樹（檔案大，建議放戶外）']
    ]},
    { cat: '展示道具', items: [
      ['plinth', '展台（中）'], ['plinth_low', '展台（矮）'], ['plinth_wide', '展台（寬）'],
      ['vitrine', '玻璃展示櫃'], ['acrylic_riser', '壓克力展台'], ['display_table', '展示桌'],
      ['hanging_panel', '懸吊看板'], ['banner', '直幅布幔'], ['card_rail', '掛卡展示架'],
      ['locker_grid', '門櫃展牆'], ['partition', '隔板牆'], ['info_stand', '說明立台'],
      ['easel', '畫架'], ['rope_barrier', '紅龍圍欄'], ['shelf_unit', '層架展示櫃'],
      ['glass_partition', '壓克力隔屏架'], ['acrylic_stand', '鋁管壓克力展示架（可掛畫）'], ['hex_shelf', '六角蜂巢壁架'],
      ['curved_bench', '曲線造型長椅'], ['slat_wall', '木格柵牆'], ['slat_screen', '木格柵屏風（通透）']
    ]},
    { cat: '動線', items: [['doorway', '門戶（通往其他房間）']] },
    { cat: '牆體／隔間', items: [['wall_seg', '直牆段'], ['wall_arch', '拱門牆（可穿越）'], ['wall_door', '門洞牆（可穿越）']] },
    { cat: '傢俱', items: [
      ['bench', '長凳'], ['bench_pad', '軟墊長凳'], ['sofa', '雙人沙發'],
      ['coffee_table', '茶几'], ['column', '裝飾立柱']
    ]},
    { cat: '照明（裝飾）', items: [['floor_lamp', '落地燈'], ['sphere_lamp', '球形落地燈'], ['track_light', '軌道投射燈']] },
    { cat: '植栽', items: [['plant_large', '大型植栽'], ['plant_small', '小盆栽']] },
    { cat: '辦公', items: [
      ['desk', '辦公桌'], ['office_chair', '辦公椅'], ['bookshelf', '書架'],
      ['cabinet', '收納櫃'], ['reception_desk', '接待櫃台'], ['desk_lamp', '桌燈'], ['monitor', '電腦螢幕']
    ]}
  ],
  shapeName(shape) { for (const grp of this.catalog) for (const [v, n] of grp.items) if (v === shape) return n; return shape; },

  build(THREE, shape, opts) {
    opts = opts || {};
    const RH = opts.roomHeight || 4.2;
    const primary = opts.color || '#e8e5dd';
    const g = new THREE.Group();
    const M = (c, r = 0.6, m = 0) => new THREE.MeshStandardMaterial({ color: c, roughness: r, metalness: m });
    const E = (c, i = 1.4) => new THREE.MeshStandardMaterial({ color: '#222', emissive: c, emissiveIntensity: i, roughness: 0.4 });
    // ---- 程序紋理（快取，避免重複生成）----
    const TX = window.PROPS._tex || (window.PROPS._tex = {});
    const mkTex = (key, draw, rep) => { if (TX[key]) return TX[key]; const cv = document.createElement('canvas'); cv.width = cv.height = 256; draw(cv.getContext('2d')); const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; if (rep) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rep, rep); } TX[key] = t; return t; };
    const R256 = (s) => { let x = Math.sin(s * 99.7) * 9999; return x - Math.floor(x); };  // 穩定偽隨機
    const woodTex = (c) => mkTex('wood' + c, (x) => {
      x.fillStyle = c; x.fillRect(0, 0, 256, 256);
      for (let i = 0; i < 90; i++) { const y = R256(i) * 256; x.strokeStyle = 'rgba(60,35,12,' + (0.04 + R256(i + 7) * 0.07) + ')'; x.lineWidth = 0.6 + R256(i + 3) * 1.8; x.beginPath(); x.moveTo(0, y); x.bezierCurveTo(85, y + (R256(i + 1) * 8 - 4), 170, y + (R256(i + 2) * 8 - 4), 256, y + (R256(i + 4) * 6 - 3)); x.stroke(); }
    }, 2);
    const fabricTex = (c) => mkTex('fab' + c, (x) => {
      x.fillStyle = c; x.fillRect(0, 0, 256, 256);
      for (let i = 0; i < 3000; i++) { x.fillStyle = 'rgba(255,255,255,' + (R256(i) * 0.05) + ')'; x.fillRect(R256(i + 1) * 256, R256(i + 2) * 256, 2, 1); x.fillStyle = 'rgba(0,0,0,' + (R256(i + 5) * 0.05) + ')'; x.fillRect(R256(i + 3) * 256, R256(i + 4) * 256, 1, 2); }
    }, 4);
    const leafTex = () => mkTex('leaf', (x) => {
      x.clearRect(0, 0, 256, 256);
      const grad = x.createLinearGradient(128, 250, 128, 10); grad.addColorStop(0, '#2f6b2c'); grad.addColorStop(1, '#5aa84e');
      x.fillStyle = grad; x.beginPath(); x.moveTo(128, 252); x.bezierCurveTo(18, 200, 24, 55, 128, 10); x.bezierCurveTo(232, 55, 238, 200, 128, 252); x.fill();
      x.strokeStyle = 'rgba(22,70,22,0.55)'; x.lineWidth = 3; x.beginPath(); x.moveTo(128, 248); x.lineTo(128, 26); x.stroke();
      x.lineWidth = 2; for (let i = 0; i < 7; i++) { const y = 230 - i * 30; const w = 58 - i * 5; x.beginPath(); x.moveTo(128, y); x.lineTo(128 - w, y - 26); x.moveTo(128, y); x.lineTo(128 + w, y - 26); x.stroke(); }
      x.globalCompositeOperation = 'destination-out';
      for (const side of [-1, 1]) for (let i = 0; i < 6; i++) { const y = 60 + i * 30; x.beginPath(); x.ellipse(128 + side * 46, y, 34, 8, side * 0.35, 0, 7); x.fill(); }
      for (let i = 0; i < 5; i++) { x.beginPath(); x.ellipse(128 + (i % 2 ? 26 : -26), 80 + i * 32, 9, 17, 0, 0, 7); x.fill(); }
      x.globalCompositeOperation = 'source-over';
    }, 0);

    const white = M('#f2f0ea', 0.65),
      wood = new THREE.MeshStandardMaterial({ map: woodTex('#b08049'), roughness: 0.5 }),
      woodDark = new THREE.MeshStandardMaterial({ map: woodTex('#7a5230'), roughness: 0.55 }),
      metal = M('#33333a', 0.4, 0.85), chrome = M('#c4c6ca', 0.18, 1), black = M('#1c1c20', 0.5, 0.2),
      glass = new THREE.MeshStandardMaterial({ color: '#cfe0ee', transparent: true, opacity: 0.16, roughness: 0.05, metalness: 0, depthWrite: false }),
      acrylic = new THREE.MeshPhysicalMaterial({ color: '#eaf1f8', transparent: true, opacity: 0.42, roughness: 0.1, metalness: 0, transmission: 0.5, thickness: 0.3, side: THREE.DoubleSide }),
      prim = opts.prim || M(primary, 0.6),   // 展台／櫃體主材質可由外部指定（水泥、OSB…）
      fabric = new THREE.MeshStandardMaterial({ map: fabricTex(primary), roughness: 0.9 }),
      leaf = new THREE.MeshStandardMaterial({ map: leafTex(), transparent: true, alphaTest: 0.5, side: THREE.DoubleSide, roughness: 0.6 });

    const RBG = window.RBG;
    // 圓角只做細微倒角（0.012m 以內）：邊緣柔和，但零件交接處不會露出圓邊接縫
    const box = (w, h, d, mat, x = 0, y = 0, z = 0) => { const r = Math.min(0.012, Math.min(w, h, d) * 0.3); const geo = (RBG && r > 0.003) ? new RBG(w, h, d, 2, r) : new THREE.BoxGeometry(w, h, d); const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = true; m.receiveShadow = true; g.add(m); return m; };
    const cyl = (rt, rb, h, mat, x = 0, y = 0, z = 0, seg = 20) => { const m = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg), mat); m.position.set(x, y, z); m.castShadow = true; m.receiveShadow = true; g.add(m); return m; };
    const sph = (r, mat, x = 0, y = 0, z = 0) => { const m = new THREE.Mesh(new THREE.SphereGeometry(r, 16, 16), mat); m.position.set(x, y, z); m.castShadow = true; g.add(m); return m; };
    const cone = (r, h, mat, x = 0, y = 0, z = 0) => { const m = new THREE.Mesh(new THREE.ConeGeometry(r, h, 14), mat); m.position.set(x, y, z); m.castShadow = true; g.add(m); return m; };
    const legs4 = (w, d, h, mat, t = 0.06) => { for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) box(t, h, t, mat, sx * (w / 2 - t), h / 2, sz * (d / 2 - t)); };

    if (shape && shape.startsWith('glb:')) return g;   // 真實 GLB 模型由 view.html 非同步載入
    switch (shape) {
      case 'plinth': box(0.45, 1.0, 0.45, prim, 0, 0.5, 0); box(0.5, 0.03, 0.5, prim, 0, 1.0, 0); break;
      case 'plinth_low': box(0.55, 0.6, 0.55, prim, 0, 0.3, 0); box(0.6, 0.03, 0.6, prim, 0, 0.6, 0); break;
      case 'plinth_wide': box(0.85, 0.9, 0.85, prim, 0, 0.45, 0); box(0.9, 0.03, 0.9, prim, 0, 0.9, 0); break;
      case 'acrylic_riser': box(0.42, 0.5, 0.42, glass, 0, 0.25, 0); box(0.44, 0.02, 0.44, glass, 0, 0.5, 0); break;
      case 'vitrine':
        box(0.58, 0.9, 0.58, prim, 0, 0.45, 0); box(0.62, 0.03, 0.62, woodDark, 0, 0.9, 0);
        box(0.54, 0.62, 0.54, glass, 0, 1.22, 0);
        for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) box(0.02, 0.64, 0.02, chrome, sx * 0.26, 1.22, sz * 0.26);
        box(0.56, 0.03, 0.56, chrome, 0, 1.55, 0); break;
      case 'display_table':
        box(2.0, 0.06, 0.9, white, 0, 0.78, 0); box(1.9, 0.12, 0.8, white, 0, 0.7, 0);
        legs4(2.0, 0.9, 0.7, metal, 0.05); break;
      case 'hanging_panel': {
        const top = RH - 0.5, bh = 2.0, by = top - bh / 2;
        box(1.4, bh, 0.05, white, 0, by, 0);
        cyl(0.012, 0.012, RH - top, chrome, -0.5, top + (RH - top) / 2, 0, 8);
        cyl(0.012, 0.012, RH - top, chrome, 0.5, top + (RH - top) / 2, 0, 8); break;
      }
      case 'banner': {
        const top = RH - 0.25, bh = 2.6, by = top - bh / 2;
        cyl(0.03, 0.03, 1.1, woodDark, 0, top, 0, 10).rotation.z = Math.PI / 2;
        box(0.9, bh, 0.02, fabric, 0, by, 0);
        cyl(0.01, 0.01, RH - top, chrome, 0, top + (RH - top) / 2, 0, 8); break;
      }
      case 'card_rail': {
        box(1.7, 0.08, 0.14, wood, 0, 1.45, 0);
        for (let i = 0; i < 5; i++) { const x = -0.68 + i * 0.34; cyl(0.012, 0.012, 0.06, chrome, x, 1.4, 0.05, 6); box(0.18, 0.24, 0.012, white, x, 1.25, 0.06); }
        break;
      }
      case 'locker_grid': {
        box(1.9, 1.9, 0.08, prim, 0, 1.15, 0);
        for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) { const x = -0.66 + c * 0.44, y = 0.42 + r * 0.44; box(0.4, 0.4, 0.04, white, x, y, 0.06); sph(0.018, black, x + 0.14, y, 0.09); }
        break;
      }
      case 'partition': box(2.2, 2.4, 0.12, prim, 0, 1.2, 0); box(0.5, 0.08, 0.5, metal, -0.9, 0.04, 0); box(0.5, 0.08, 0.5, metal, 0.9, 0.04, 0); break;
      case 'info_stand': { box(0.5, 0.95, 0.35, prim, 0, 0.48, 0); const top = box(0.5, 0.36, 0.04, white, 0, 1.05, 0.1); top.rotation.x = -0.5; break; }
      case 'easel': {
        const la = box(0.05, 1.9, 0.05, wood, -0.35, 0.95, 0.1); la.rotation.z = 0.18;
        const lb = box(0.05, 1.9, 0.05, wood, 0.35, 0.95, 0.1); lb.rotation.z = -0.18;
        const lc = box(0.05, 1.8, 0.05, wood, 0, 0.9, -0.3); lc.rotation.x = 0.25;
        box(0.9, 0.06, 0.12, wood, 0, 0.7, 0.16); box(1.0, 1.3, 0.04, white, 0, 1.2, 0.18); break;
      }
      case 'rope_barrier':
        cyl(0.04, 0.05, 0.9, chrome, -0.8, 0.45, 0, 14); sph(0.06, chrome, -0.8, 0.92, 0);
        cyl(0.04, 0.05, 0.9, chrome, 0.8, 0.45, 0, 14); sph(0.06, chrome, 0.8, 0.92, 0);
        { const rope = cyl(0.025, 0.025, 1.6, M('#7a1f2b', 0.8), 0, 0.78, 0, 8); rope.rotation.z = Math.PI / 2; } break;
      case 'shelf_unit':
        box(0.06, 1.9, 0.4, woodDark, -0.6, 0.95, 0); box(0.06, 1.9, 0.4, woodDark, 0.6, 0.95, 0);
        for (let i = 0; i < 4; i++) box(1.2, 0.05, 0.4, woodDark, 0, 0.25 + i * 0.55, 0); break;

      case 'bench': box(1.4, 0.1, 0.42, wood, 0, 0.46, 0); for (const [x, z] of [[-0.6, -0.15], [0.6, -0.15], [-0.6, 0.15], [0.6, 0.15]]) box(0.07, 0.45, 0.07, woodDark, x, 0.225, z); break;
      case 'bench_pad': box(1.4, 0.08, 0.45, woodDark, 0, 0.44, 0); box(1.36, 0.12, 0.42, fabric, 0, 0.54, 0); for (const [x, z] of [[-0.6, -0.16], [0.6, -0.16], [-0.6, 0.16], [0.6, 0.16]]) box(0.07, 0.42, 0.07, metal, x, 0.21, z); break;
      case 'sofa':
        box(1.9, 0.35, 0.85, fabric, 0, 0.3, 0); box(1.9, 0.6, 0.18, fabric, 0, 0.62, -0.34);
        box(0.18, 0.5, 0.85, fabric, -0.86, 0.45, 0); box(0.18, 0.5, 0.85, fabric, 0.86, 0.45, 0);
        box(0.85, 0.16, 0.7, M('#fff', 0.95), -0.45, 0.5, 0.05); box(0.85, 0.16, 0.7, M('#fff', 0.95), 0.45, 0.5, 0.05);
        for (const [x, z] of [[-0.8, -0.35], [0.8, -0.35], [-0.8, 0.35], [0.8, 0.35]]) cyl(0.04, 0.04, 0.16, woodDark, x, 0.08, z, 8); break;
      case 'coffee_table': box(1.1, 0.05, 0.6, woodDark, 0, 0.42, 0); legs4(1.1, 0.6, 0.4, woodDark, 0.06); break;
      case 'column': cyl(0.26, 0.26, 2.6, white, 0, 1.4, 0, 24); cyl(0.34, 0.34, 0.12, white, 0, 0.06, 0, 24); cyl(0.34, 0.34, 0.12, white, 0, 2.74, 0, 24); break;

      case 'floor_lamp': {
        cyl(0.18, 0.22, 0.05, metal, 0, 0.03, 0); cyl(0.02, 0.02, 1.5, metal, 0, 0.78, 0, 10);
        const sh = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.24, 0.34, 18, 1, true), new THREE.MeshStandardMaterial({ color: '#f3e6c8', emissive: '#ffe6b0', emissiveIntensity: 0.7, roughness: 0.7, side: THREE.DoubleSide })); sh.position.y = 1.62; sh.castShadow = true; g.add(sh);
        const pl = new THREE.PointLight('#ffe6bb', 5, 7, 2); pl.position.set(0, 1.6, 0); g.add(pl); break;
      }
      case 'track_light': {
        box(1.8, 0.06, 0.08, black, 0, RH - 0.05, 0);
        for (let i = -1; i <= 1; i++) {
          const h = cyl(0.06, 0.07, 0.18, black, i * 0.6, RH - 0.2, 0, 12);
          const lens = cyl(0.05, 0.05, 0.02, E('#fff4e0', 1.8), i * 0.6, RH - 0.3, 0, 12);
          const sp = new THREE.SpotLight('#fff4e0', 4, 12, 0.5, 0.5, 1.2); sp.position.set(i * 0.6, RH - 0.3, 0); sp.target.position.set(i * 0.6, 0, 0.4); g.add(sp); g.add(sp.target);
        }
        break;
      }
      case 'plant_large': {
        cyl(0.3, 0.22, 0.5, white, 0, 0.25, 0, 24); cyl(0.31, 0.31, 0.05, white, 0, 0.5, 0, 24);     // 白瓷盆＋盆緣
        cyl(0.27, 0.27, 0.04, M('#3a2a1a', 1), 0, 0.5, 0, 20);                                          // 盆土
        const stemMat = M('#3f7034', 0.7);
        // 龜背芋葉片：以帶透明的葉形貼圖平面，向四周張開
        const L = [[0, 1.55, 0.62, -0.5], [55, 1.42, 0.56, -0.7], [120, 1.5, 0.54, -0.6], [180, 1.38, 0.56, -0.75], [240, 1.46, 0.52, -0.65], [300, 1.5, 0.58, -0.6], [30, 1.2, 0.5, -1.0], [150, 1.18, 0.48, -1.05], [270, 1.22, 0.5, -1.0], [95, 1.66, 0.5, -0.35], [210, 1.62, 0.5, -0.4]];
        for (const [deg, h, sc, tilt] of L) {
          const a = deg * Math.PI / 180;
          const stem = cyl(0.014, 0.018, h - 0.5, stemMat, Math.cos(a) * 0.06, 0.5 + (h - 0.5) / 2, Math.sin(a) * 0.06, 6); stem.rotation.z = Math.cos(a) * 0.18; stem.rotation.x = Math.sin(a) * 0.18;
          const lf = new THREE.Mesh(new THREE.PlaneGeometry(0.5 * sc * 2, 0.56 * sc * 2), leaf);
          lf.position.set(Math.cos(a) * 0.34, h, Math.sin(a) * 0.34);
          lf.rotation.order = 'YXZ'; lf.rotation.y = -a + Math.PI / 2; lf.rotation.x = tilt;
          lf.castShadow = true; g.add(lf);
        }
        break;
      }
      case 'plant_small': {
        cyl(0.16, 0.12, 0.28, white, 0, 0.14, 0, 20); cyl(0.17, 0.17, 0.04, white, 0, 0.28, 0, 20);
        cyl(0.14, 0.14, 0.03, M('#3a2a1a', 1), 0, 0.28, 0, 18);
        const stemMat = M('#3f7034', 0.7);
        const L = [[0, 0.62, 0.34, -0.5], [90, 0.56, 0.3, -0.7], [180, 0.6, 0.32, -0.6], [270, 0.55, 0.3, -0.7], [45, 0.48, 0.26, -1.0], [225, 0.5, 0.26, -1.0]];
        for (const [deg, h, sc, tilt] of L) {
          const a = deg * Math.PI / 180;
          const stem = cyl(0.01, 0.012, h - 0.28, stemMat, Math.cos(a) * 0.04, 0.28 + (h - 0.28) / 2, Math.sin(a) * 0.04, 6); stem.rotation.z = Math.cos(a) * 0.2; stem.rotation.x = Math.sin(a) * 0.2;
          const lf = new THREE.Mesh(new THREE.PlaneGeometry(sc * 2, sc * 2.2), leaf);
          lf.position.set(Math.cos(a) * 0.2, h, Math.sin(a) * 0.2);
          lf.rotation.order = 'YXZ'; lf.rotation.y = -a + Math.PI / 2; lf.rotation.x = tilt;
          lf.castShadow = true; g.add(lf);
        }
        break;
      }
      case 'wall_seg': case 'wall_arch': case 'wall_door': case 'doorway': {
        // 牆體／出入口：有厚度的實牆，開口是真的洞（可穿越、可掛作品）
        const wallPiece = (W, H, T, opening) => {
          const s = new THREE.Shape();
          s.moveTo(-W / 2, 0); s.lineTo(W / 2, 0); s.lineTo(W / 2, H); s.lineTo(-W / 2, H); s.closePath();
          if (opening) {
            const o = new THREE.Path(); const ow = opening.w / 2;
            if (opening.arch) { const st = opening.h - ow; o.moveTo(-ow, 0); o.lineTo(-ow, st); o.absarc(0, st, ow, Math.PI, 0, true); o.lineTo(ow, 0); }
            else { o.moveTo(-ow, 0); o.lineTo(-ow, opening.h); o.lineTo(ow, opening.h); o.lineTo(ow, 0); }
            o.closePath(); s.holes.push(o);
          }
          const geo = new THREE.ExtrudeGeometry(s, { depth: T, bevelEnabled: false });
          const m = new THREE.Mesh(geo, prim); m.position.z = -T / 2; m.castShadow = true; m.receiveShadow = true; g.add(m); return m;
        };
        if (shape === 'wall_seg') { wallPiece(3.0, 2.8, 0.18, null); }
        else if (shape === 'wall_arch') { wallPiece(3.6, 2.8, 0.18, { w: 1.44, h: 2.35, arch: true }); }
        else if (shape === 'wall_door') { wallPiece(3.2, 2.8, 0.18, { w: 1.24, h: 2.2, arch: false }); }
        else {   // doorway：拱牆＋內凹通道（有景深）＋盡頭是另一房間的畫面
          const T = 0.22, dpt = 0.6;
          wallPiece(2.6, 2.7, T, { w: 1.4, h: 2.35, arch: true });
          const dark = M('#111114', 0.95);
          for (const sx of [-0.72, 0.72]) box(0.06, 2.5, dpt, dark, sx, 1.25, -T / 2 - dpt / 2);
          box(1.5, 0.06, dpt, dark, 0, 2.46, -T / 2 - dpt / 2);
          const back = new THREE.Mesh(new THREE.PlaneGeometry(1.52, 2.52), new THREE.MeshBasicMaterial({ color: '#0a0a0c' }));
          back.position.set(0, 1.26, -T / 2 - dpt); back.userData.portal = true; g.add(back);
        }
        break;
      }

      case 'desk': box(1.5, 0.05, 0.75, woodDark, 0, 0.74, 0); box(0.45, 0.6, 0.7, M('#dedad2', 0.6), -0.5, 0.4, 0); for (let i = 0; i < 3; i++) box(0.4, 0.02, 0.6, metal, -0.5, 0.2 + i * 0.2, 0.36); box(0.05, 0.72, 0.7, metal, 0.7, 0.36, 0); break;
      case 'office_chair':
        cyl(0.04, 0.04, 0.45, metal, 0, 0.45, 0, 10); box(0.46, 0.08, 0.46, fabric, 0, 0.5, 0); box(0.44, 0.5, 0.08, fabric, 0, 0.78, -0.2);
        for (let i = 0; i < 5; i++) { const a = i / 5 * Math.PI * 2; const l = box(0.28, 0.04, 0.06, black, Math.sin(a) * 0.16, 0.05, Math.cos(a) * 0.16); l.rotation.y = a; sph(0.04, black, Math.sin(a) * 0.3, 0.04, Math.cos(a) * 0.3); }
        box(0.5, 0.05, 0.06, black, 0, 0.62, 0.18); break;
      case 'bookshelf': {
        box(0.06, 2.0, 0.32, woodDark, -0.5, 1.0, 0); box(0.06, 2.0, 0.32, woodDark, 0.5, 1.0, 0); box(1.06, 0.05, 0.32, woodDark, 0, 0.05, 0);
        const bookCols = ['#7a3b3b', '#3b5a7a', '#6b6b3b', '#5a3b6b', '#3b6b55'];
        for (let s = 0; s < 4; s++) { const y = 0.3 + s * 0.5; box(1.0, 0.04, 0.32, woodDark, 0, y, 0); for (let b = 0; b < 7; b++) box(0.1, 0.34, 0.24, M(bookCols[(s + b) % 5], 0.8), -0.42 + b * 0.13, y + 0.19, 0); }
        break;
      }
      case 'cabinet': box(1.0, 1.1, 0.45, prim, 0, 0.55, 0); box(0.46, 1.0, 0.03, M('#e8e4db', 0.6), -0.25, 0.55, 0.24); box(0.46, 1.0, 0.03, M('#e8e4db', 0.6), 0.25, 0.55, 0.24); sph(0.025, black, -0.04, 0.55, 0.27); sph(0.025, black, 0.04, 0.55, 0.27); break;
      case 'reception_desk': box(1.8, 1.1, 0.7, prim, 0, 0.55, 0); box(2.0, 0.06, 0.85, woodDark, 0, 1.12, 0); box(1.8, 0.25, 0.05, M('#cfcabf', 0.6), 0, 0.95, 0.37); break;
      case 'desk_lamp': { cyl(0.1, 0.12, 0.04, metal, 0, 0.02, 0); cyl(0.015, 0.015, 0.5, metal, 0, 0.27, 0, 8); const arm = cyl(0.015, 0.015, 0.4, metal, 0.12, 0.5, 0, 8); arm.rotation.z = -0.9; cone(0.1, 0.16, E('#fff1d0', 1.2), 0.3, 0.62, 0); break; }
      case 'monitor': box(0.7, 0.42, 0.04, black, 0, 1.0, 0); box(0.66, 0.38, 0.01, E('#2a3a55', 0.8), 0, 1.0, 0.025); cyl(0.03, 0.03, 0.2, metal, 0, 0.85, 0, 10); box(0.3, 0.03, 0.2, metal, 0, 0.75, 0); break;

      case 'acrylic_stand': {
        // 鍍鉻管自立壓克力展示架（可把作品直接拖掛到壓克力板上）
        for (const sx of [-0.85, 0.85]) {
          cyl(0.018, 0.018, 2.3, chrome, sx, 1.15, 0, 12);                                   // 立管
          const foot = cyl(0.016, 0.016, 0.7, chrome, sx, 0.02, 0, 10); foot.rotation.x = Math.PI / 2;   // 底腳
          cyl(0.03, 0.03, 0.05, chrome, sx, 0.02, 0.33, 10).rotation.x = Math.PI / 2;
          cyl(0.03, 0.03, 0.05, chrome, sx, 0.02, -0.33, 10).rotation.x = Math.PI / 2;
        }
        for (const yy of [0.25, 2.2]) { const rail = cyl(0.015, 0.015, 1.7, chrome, 0, yy, 0, 10); rail.rotation.z = Math.PI / 2; }
        const sheet = new THREE.Mesh(new THREE.BoxGeometry(1.5, 1.85, 0.012), acrylic); sheet.position.y = 1.22; sheet.castShadow = false; g.add(sheet);
        break;
      }
      case 'glass_partition': {
        cyl(0.16, 0.2, 0.04, chrome, -0.55, 0.02, 0); cyl(0.16, 0.2, 0.04, chrome, 0.55, 0.02, 0);   // 兩腳底盤
        cyl(0.02, 0.02, 1.5, chrome, -0.55, 0.77, 0, 10); cyl(0.02, 0.02, 1.5, chrome, 0.55, 0.77, 0, 10);
        box(1.16, 1.3, 0.025, acrylic, 0, 0.95, 0);                                                    // 壓克力面板
        break;
      }
      case 'sphere_lamp': {
        cyl(0.2, 0.24, 0.04, chrome, 0, 0.02, 0, 24);
        const pole = cyl(0.018, 0.018, 1.7, chrome, 0.05, 0.86, 0, 10); pole.rotation.z = 0.06;
        const ball = new THREE.Mesh(new THREE.SphereGeometry(0.18, 24, 24), new THREE.MeshStandardMaterial({ color: '#fdf6e6', emissive: '#fff0cf', emissiveIntensity: 1.1, roughness: 0.5 })); ball.position.set(0.16, 1.74, 0); ball.castShadow = true; g.add(ball);
        const pl = new THREE.PointLight('#fff0cf', 4.5, 7, 2); pl.position.set(0.16, 1.74, 0); g.add(pl);
        break;
      }
      case 'hex_shelf': {
        const ring = (cx, cy) => { const t = new THREE.Mesh(new THREE.TorusGeometry(0.34, 0.035, 8, 6), white); t.position.set(cx, cy, 0); t.rotation.z = Math.PI / 6; t.castShadow = true; t.receiveShadow = true; g.add(t); const back = new THREE.Mesh(new THREE.CircleGeometry(0.32, 6), M('#eceae4', 0.8)); back.position.set(cx, cy, -0.12); back.rotation.z = Math.PI / 6; g.add(back); };
        const dx = 0.58, dy = 0.5;
        ring(0, 1.3); ring(-dx, 1.3 - dy * 0.5); ring(dx, 1.3 - dy * 0.5); ring(-dx, 1.3 + dy * 0.5); ring(0, 1.3 - dy); ring(dx, 1.3 + dy * 0.5);
        break;
      }
      case 'curved_bench': {
        // 雕塑感 S 形曲線長椅（霧白）
        const pts = [new THREE.Vector3(-1.7, 0, 0.35), new THREE.Vector3(-0.7, 0, -0.3), new THREE.Vector3(0.7, 0, 0.3), new THREE.Vector3(1.7, 0, -0.35)];
        const curve = new THREE.CatmullRomCurve3(pts, false, 'catmullrom', 0.6);
        const seat = new THREE.Mesh(new THREE.TubeGeometry(curve, 64, 0.33, 22, false), M('#f5f3ef', 0.32, 0));
        seat.scale.y = 0.62; seat.position.y = 0.21; seat.castShadow = true; seat.receiveShadow = true; g.add(seat);
        for (const p of [pts[0], pts[3]]) { const cap = new THREE.Mesh(new THREE.SphereGeometry(0.33, 22, 16), M('#f5f3ef', 0.32, 0)); cap.scale.y = 0.62; cap.position.set(p.x, 0.21, p.z); cap.castShadow = true; g.add(cap); }
        break;
      }
      case 'slat_screen': {
        // 木格柵屏風（通透）：沒有背板，只有垂直木條＋上下橫軌，視線與光線穿透
        box(2.0, 0.06, 0.08, woodDark, 0, 0.03, 0); box(2.0, 0.06, 0.08, woodDark, 0, 2.37, 0);
        for (let i = 0; i < 13; i++) box(0.05, 2.34, 0.06, wood, -0.96 + i * 0.16, 1.2, 0);
        break;
      }
      case 'slat_wall': {
        // 木格柵特色牆（背板＋垂直木條）
        box(2.4, 2.7, 0.04, M('#edeae3', 0.9), 0, 1.35, -0.03);
        for (let i = 0; i < 20; i++) box(0.05, 2.7, 0.07, wood, -1.14 + i * 0.12, 1.35, 0.025);
        break;
      }
      default: box(0.45, 1.0, 0.45, prim, 0, 0.5, 0); // 後備：展台
    }
    return g;
  }
};
