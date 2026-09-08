/* =========================================================================
   資料層 —— 目前用 localStorage（零設定、免費）。
   之後要換 Firebase / Supabase，只要把這支檔的方法改成呼叫雲端 API 即可，
   其他頁面（列表、編輯器、觀展器）完全不用動。
   ========================================================================= */
(function () {
  const KEY = 'exhib_platform_v1';

  function load() {
    try { return JSON.parse(localStorage.getItem(KEY)) || null; }
    catch (e) { return null; }
  }
  function save(db) { localStorage.setItem(KEY, JSON.stringify(db)); }
  function init() {
    let db = load();
    if (!db) db = { users: {}, exhibitions: {} };
    if (!db.users) db.users = {};
    if (!db.exhibitions) db.exhibitions = {};
    return db;
  }
  function uid(prefix) {
    return prefix + '_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  }

  const Store = {
    db: init(),
    _commit() { save(this.db); },

    // ---- 展覽 ----
    listByOwner(ownerId) {
      return Object.values(this.db.exhibitions)
        .filter(e => e.ownerId === ownerId)
        .sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
    },
    listPublished() {
      return Object.values(this.db.exhibitions)
        .filter(e => e.published)
        .sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
    },
    get(id) { return this.db.exhibitions[id] || null; },
    create(ownerId, data) {
      const id = uid('ex');
      const ex = Object.assign({
        id, ownerId,
        title: '未命名展覽', description: '', template: 'white',
        published: false,
        start: { x: 0, z: 4.5, lookAt: { x: 0, z: -1 } },
        style: {},          // 場景外觀：牆色、字體、光源、展框、背景音樂
        items: [],
        createdAt: Date.now(), updatedAt: Date.now()
      }, data || {});
      ex.id = id; ex.ownerId = ownerId;
      this.db.exhibitions[id] = ex;
      this._commit();
      return ex;
    },
    update(id, patch) {
      const ex = this.db.exhibitions[id];
      if (!ex) return null;
      Object.assign(ex, patch);
      ex.updatedAt = Date.now();
      this._commit();
      return ex;
    },
    remove(id) { delete this.db.exhibitions[id]; this._commit(); },

    // ---- 確保每件展品都有穩定 id（按讚/留言用來定位）----
    ensureIds(ex) {
      let changed = false;
      for (const it of (ex.items || [])) if (!it.id) { it.id = uid('it'); changed = true; }
      if (changed && this.db.exhibitions[ex.id]) this._commit();
      return ex;
    },

    // ---- 訪客互動：按讚 / 留言 ----
    _itemReact(exId, itemId) {
      const ex = this.db.exhibitions[exId]; if (!ex) return null;
      if (!ex.reactions) ex.reactions = {};
      if (!ex.reactions[itemId]) ex.reactions[itemId] = { likes: 0, comments: [] };
      return ex.reactions[itemId];
    },
    getReactions(exId, itemId) { return this._itemReact(exId, itemId) || { likes: 0, comments: [] }; },
    setLike(exId, itemId, liked) {
      const r = this._itemReact(exId, itemId); if (!r) return 0;
      r.likes = Math.max(0, r.likes + (liked ? 1 : -1)); this._commit(); return r.likes;
    },
    addComment(exId, itemId, name, text) {
      const r = this._itemReact(exId, itemId); if (!r) return [];
      r.comments.push({ name: (name || '訪客').slice(0, 24), text: text.slice(0, 300), ts: Date.now() });
      this._commit(); return r.comments;
    },

    newId: uid
  };

  window.Store = Store;
})();
