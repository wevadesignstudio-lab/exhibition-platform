/* =========================================================================
   帳號層 —— 目前用「本機策展人帳號」（存在這台瀏覽器，零設定、免費）。
   可建立多個帳號、切換，各自擁有自己的展覽。
   之後要換真正的雲端登入：把這幾個方法改成呼叫 Firebase Auth 即可，
   介面（current / signUp / signOut）維持不變。
   需在 store.js 之後載入。
   ========================================================================= */
(function () {
  const CUR = 'exhib_current_user';

  const Auth = {
    current() {
      const id = localStorage.getItem(CUR);
      return (id && Store.db.users[id]) ? Store.db.users[id] : null;
    },
    list() { return Object.values(Store.db.users); },
    signUp(name) {
      const id = Store.newId('u');
      const u = { id, name: (name || '').trim() || '策展人', createdAt: Date.now() };
      Store.db.users[id] = u;
      Store._commit();
      localStorage.setItem(CUR, id);
      return u;
    },
    signIn(id) {
      if (Store.db.users[id]) { localStorage.setItem(CUR, id); return Store.db.users[id]; }
      return null;
    },
    /* Google 登入：以 Firebase 使用者建立／更新本機檔案（id 固定 g_<uid>，跨裝置一致） */
    signInCloud(info) {
      const id = 'g_' + info.uid;
      const u = Store.db.users[id] || { id, createdAt: Date.now() };
      u.name = info.displayName || info.name || u.name || '策展人';
      if (info.email) u.email = info.email;
      if (info.photoURL || info.photo) u.photo = info.photoURL || info.photo;
      u.cloud = true;
      Store.db.users[id] = u;
      Store._commit();
      localStorage.setItem(CUR, id);
      return u;
    },
    signOut() { localStorage.removeItem(CUR); },
    requireOrRedirect() { if (!this.current()) location.href = 'index.html'; }
  };

  window.Auth = Auth;
})();
