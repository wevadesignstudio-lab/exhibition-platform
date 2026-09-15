/* =========================================================================
   基礎展覽空間（起始版型）
   20m × 14m 採光藝廊，順時針動線：序章 → 西牆 → 北牆主視覺 → 東側立體區 → 南牆終章
   所有作品為佔位圖，策展人換上自己的圖／文字／模型即可。
   ========================================================================= */
(function () {
  const H = 1.5;   // 作品中心視線高度（美術館標準）
  const art = (id, title, wall, offset, w, h, section, color, desc) => ({ id, type: 'image', title, artist: '', section, description: desc || '在編輯面板換上你的作品圖片與說明。', wall, offset, height: H, size: { w, h }, frame: 'wood', color });
  const txt = (id, title, wall, offset, w, h, section, desc, textStyle, textColor) => ({ id, type: 'text', title, section, description: desc, wall, offset, height: H, size: { w, h }, frame: 'none', textStyle: textStyle || 'board', textColor });
  const prop = (id, shape, title, x, z, rot, extra) => Object.assign({ id, type: 'prop', shape, title, x, z, rot: rot || 0, scale: 1 }, extra || {});

  window.STARTER_EXHIBITION = function (title) {
    return {
      title: title || '我的展覽',
      description: '基礎展覽空間：順時針動線、四個章節、主視覺牆與自然光立體區。',
      style: { floorTex: 'auto', frameDefault: 'wood', hdri: 'park', font: 'serif' },
      rooms: [{
        id: 'rm0', name: '主展廳', template: 'gallery',
        items: [
          /* ── 序章：入口區（南牆左側）── */
          txt('s-intro', '展覽說明', 'south', -6.2, 1.6, 1.1, '序章 · 歡迎', '在這裡寫展覽主題、策展理念與觀展方式。策展導覽會從這裡出發。', 'vinyl', '#1a1a1f'),   // 卡典西德割字直接貼在水泥牆上
          prop('s-sconce', 'glb:industrial_wall_sconce_1k', '入口壁燈', -8.6, 6.85, 180),
          prop('s-stand', 'info_stand', '導覽立台', -3.2, 5.4, 15, { mat: 'white' }),
          prop('s-gate', 'wall_arch', '入口拱牆', 0, 4.2, 0, { mat: 'white' }),   // 參考圖式的入口意象牆，穿過拱門進入展覽

          /* ── 第一章：西牆（4 件，由南往北看）── */
          art('a1', '作品 1', 'west', 3.6, 1.2, 0.8, '第一章 · 起點', '#8aa6b8'),
          art('a2', '作品 2', 'west', 0.9, 0.7, 1.0, '第一章 · 起點', '#9db39a'),
          art('a3', '作品 3', 'west', -1.8, 1.2, 0.8, '第一章 · 起點', '#b8a48a'),
          art('a4', '作品 4', 'west', -4.5, 1.0, 0.7, '第一章 · 起點', '#a89ab8'),
          prop('s-slat', 'slat_wall', '木格柵牆', -9.7, 6.0, 90, { color: '#edeae3' }),

          /* ── 第二章：北牆主視覺（中央大幅，兩側小幅，兩盞投射燈）── */
          art('b1', '側作品', 'north', -4.4, 1.0, 0.7, '第二章 · 主視覺', '#c9a97a'),
          art('b0', '主視覺作品', 'north', 0, 2.4, 1.6, '第二章 · 主視覺', '#6b8cae', '主牆作品：尺寸最大、兩盞投射燈打亮，是整個展覽的視覺核心。'),
          art('b2', '側作品', 'north', 4.4, 1.0, 0.7, '第二章 · 主視覺', '#b07a5a'),
          { id: 'L1', type: 'light', title: '主牆投射燈 A', x: -1.2, z: -4.6, height: 3.9, color: '#fff1d8', intensity: 7, angle: 34, pan: 180, tilt: 42 },
          { id: 'L2', type: 'light', title: '主牆投射燈 B', x: 1.2, z: -4.6, height: 3.9, color: '#fff1d8', intensity: 7, angle: 34, pan: 180, tilt: 42 },

          /* ── 第三章：東側立體區（靠落地玻璃，自然光）── */
          prop('p1', 'plinth', '展台 1', 7, -3.6, 0, { mat: 'concrete' }),
          prop('g1', 'glb:bronze_ray_statue_1k', '立體作品 1', 7, -3.6, 30, { y: 1.0, section: '第三章 · 立體', description: '靠自然光的立體作品。可換成任何真實模型。' }),
          prop('p2', 'plinth', '展台 2', 7, 0, 0, { mat: 'concrete' }),
          prop('g2', 'glb:moon_rock_01_1k', '立體作品 2', 7, 0, 20, { y: 1.0, section: '第三章 · 立體', description: '第二件立體作品。' }),
          prop('p3', 'plinth', '展台 3', 7, 3.6, 0, { mat: 'concrete' }),
          prop('g3', 'glb:IridescentDishWithOlives', '立體作品 3', 7, 3.6, 0, { y: 1.0, section: '第三章 · 立體', description: '第三件立體作品。' }),
          prop('pl1', 'glb:anthurium_botany_01_1k', '植栽', 8.8, -6.2, 0),
          prop('pl2', 'glb:anthurium_botany_01_1k', '植栽', 8.8, 6.2, 0),
          prop('bench', 'curved_bench', '曲線長椅', 2.4, 0.8, 90, { color: '#f5f3ef' }),
          prop('lamp', 'glb:modern_ceiling_lamp_01_1k', '休息區吊燈', 4.6, 0.8, 0),
          { id: 'hs1', type: 'hotspot', title: '彩蛋：策展人的話', section: '第三章 · 立體', description: '把語音導覽或幕後故事放在這裡。', src: '', x: 4.8, z: -5.4, height: 1.5 },

          /* ── 展區分隔（通透）：格柵屏風、壓克力隔屏、懸吊看板──分區但不擋視線 ── */
          prop('dv1', 'slat_screen', '屏風：序章／第一章', -5.6, 3.4, 90),                       // 入口區與西牆走廊之間，木條縫隙透光
          prop('dv2', 'hanging_panel', '懸吊看板：第一章', -6.8, -0.6, 90, { color: '#f2f0ea' }),   // 從天花板垂下，下方可走
          prop('dv3', 'glass_partition', '壓克力隔屏 A', -2.9, -3.6, 90),                       // 框住主視覺牆的「門檻」，透明
          prop('dv4', 'glass_partition', '壓克力隔屏 B', 2.9, -3.6, 90),
          prop('dv5', 'slat_screen', '屏風：立體區 A', 5.2, -2.9, 90),                          // 立體區與中央休息區之間，留中段通道
          prop('dv6', 'slat_screen', '屏風：立體區 B', 5.2, 2.9, 90),
          prop('dv7', 'hanging_panel', '懸吊看板：終章', 3.8, 4.6, 0, { color: '#f2f0ea' }),     // 標示終章區

          prop('dr1', 'doorway', '往和室展間', 8.2, 6.8, 0, { target: 1 }),

          /* ── 終章：南牆右側（2 件＋結語）── */
          art('c1', '收尾作品 1', 'south', 2.8, 1.0, 0.7, '終章 · 回望', '#9aa8b8'),
          art('c2', '收尾作品 2', 'south', 5.4, 1.0, 0.7, '終章 · 回望', '#b89a9a'),
          txt('s-end', '結語', 'south', 8.0, 1.4, 1.0, '終章 · 回望', '感謝觀看。留下你的想法——每件作品都可以按讚與留言。', 'foil', '#d4af37')   // 燙金箔結語
        ]
      }, {
        id: 'rm1', name: '和室展間', template: 'washitsu',
        items: [
          prop('jd1', 'doorway', '回主展廳', -6.8, 4, 90, { target: 0 }),
          txt('jt1', '和之間', 'north', -4.2, 1.2, 0.9, '別章 · 和室', '日式空間：格窗光影、深色木結構。作品用鋁框壓克力與展示架呈現。', 'vinyl', '#f5f2e8'),
          art('ja1', '光之一', 'north', -1.2, 1.0, 0.7, '別章 · 和室', '#4b6f9e'),
          art('ja2', '光之二', 'north', 1.8, 1.0, 0.7, '別章 · 和室', '#3f7d5a'),
          prop('js1', 'acrylic_stand', '壓克力展示架 A', -2.2, 0.3, 0),
          { id: 'jm1', type: 'image', title: '浮光', artist: '', section: '別章 · 和室', description: '掛在透明壓克力板上的作品——像浮在空間中。', size: { w: 1.1, h: 1.5 }, frame: 'acrylic', color: '#33508a', wall: 'north', offset: 0, height: 1.3, mount: { p: [-2.2, 1.32, 0.38], ry: 0 } },
          prop('js2', 'acrylic_stand', '壓克力展示架 B', 1.6, -1.4, 30),
          prop('jp1', 'glb:anthurium_botany_01_1k', '盆栽', -5.8, -3.6, 0)
        ]
      }]
    };
  };
})();
