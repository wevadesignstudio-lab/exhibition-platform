/* =========================================================================
   展間模板 —— 預先做好的展間樣式（牆色、地板、天花板、燈光氛圍）。
   策展人選一個模板，再把展品掛上去。
   ========================================================================= */
window.TEMPLATES = {
  gallery: {
    name: '採光藝廊',
    desc: '白牆、天窗＋整面落地玻璃，戶外綠意',
    room: {
      width: 20, height: 4.4, depth: 14,
      wallColor: '#f4f3f0', floorColor: '#dcc6a3', ceilingColor: '#fbfaf7',
      skirtingColor: '#e6e3dc', lightColor: '#fff6e8', floorType: 'wood', ambient: 0.7, glassWall: 'east'
    }
  },
  washitsu: {
    name: '日式和室',
    desc: '深色木結構、障子格窗、庭園光影',
    room: {
      width: 14, height: 3.3, depth: 10,
      wallColor: '#efe8d8', floorColor: '#43301e', ceilingColor: '#3a2c1e',
      skirtingColor: '#2e2118', lightColor: '#ffe9c2', floorType: 'darkwood', ambient: 0.42, glassWall: 'east', jp: true
    }
  },
  white: {
    name: '白盒美術館',
    desc: '經典純白展間，天窗自然採光',
    room: {
      width: 18, height: 4.2, depth: 13,
      wallColor: '#eceae4', floorColor: '#b9b6ad', ceilingColor: '#f6f4ee',
      skirtingColor: '#d8d5cd', lightColor: '#fff6e8', floorType: 'concrete', ambient: 0.55
    }
  },
  studio: {
    name: '木地板畫室',
    desc: '溫潤木地板＋斜頂天窗，藝術家工作室感',
    room: {
      width: 16, height: 4.6, depth: 12,
      wallColor: '#efece6', floorColor: '#c79b6a', ceilingColor: '#faf8f3',
      skirtingColor: '#e2ddd3', lightColor: '#fff3df', floorType: 'wood', ambient: 0.6
    }
  },
  warm: {
    name: '暖色畫廊',
    desc: '溫暖米色調，適合溫潤的作品',
    room: {
      width: 16, height: 4, depth: 12,
      wallColor: '#ddc9b2', floorColor: '#b08d68', ceilingColor: '#f3ead9',
      skirtingColor: '#c2a684', lightColor: '#ffedcf', floorType: 'wood', ambient: 0.6
    }
  },
  loft: {
    name: '工業風 Loft',
    desc: '挑高灰調空間，適合裝置與大型物件',
    room: {
      width: 20, height: 5, depth: 14,
      wallColor: '#a6a6ac', floorColor: '#5a5a62', ceilingColor: '#cdcdd3',
      skirtingColor: '#6a6a72', lightColor: '#eef2ff', floorType: 'concrete', ambient: 0.5
    }
  }
};
