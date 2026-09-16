/* =========================================================================
   Sight 通用對話窗 —— 取代原生 alert / confirm / prompt 的美術館風格視窗。
   用法（皆回傳 Promise）：
     UI.alert('訊息')                    → 按確定後 resolve
     await UI.confirm('確定嗎？')        → true / false
     await UI.prompt('請輸入：', {placeholder, value, type:'password'}) → 字串或 null
   ========================================================================= */
(function () {
  const css = `
  .uiOv { position: fixed; inset: 0; z-index: 96; display: flex; align-items: center; justify-content: center; padding: 24px; background: rgba(26,25,22,.48); backdrop-filter: blur(3px); opacity: 0; transition: opacity .18s; }
  .uiOv.show { opacity: 1; }
  .uiCard { background: #f7f5f0; color: #1a1916; border: 1px solid rgba(26,25,22,.2); max-width: 400px; width: 100%; padding: 32px 34px 26px; box-shadow: 0 30px 80px rgba(0,0,0,.35); text-align: center; transform: translateY(8px); transition: transform .18s; font-family: "Noto Sans TC", -apple-system, sans-serif; }
  .uiOv.show .uiCard { transform: none; }
  .uiK { font-family: "Cormorant Garamond", serif; font-size: 11px; letter-spacing: .38em; text-transform: uppercase; color: #8a6f45; margin-bottom: 12px; }
  .uiMsg { font-size: 14px; line-height: 2; letter-spacing: .5px; color: #1a1916; white-space: pre-wrap; }
  .uiIn { width: 100%; margin-top: 20px; padding: 11px 4px; font-size: 15px; letter-spacing: 1px; background: transparent; border: none; border-bottom: 1px solid rgba(26,25,22,.3); color: #1a1916; font-family: inherit; text-align: center; }
  .uiIn:focus { outline: none; border-color: #1a1916; }
  .uiActs { display: flex; gap: 12px; justify-content: center; margin-top: 28px; }
  .uiBtn { min-width: 108px; padding: 11px 20px; font-size: 13px; letter-spacing: 3px; text-indent: 3px; font-family: inherit; cursor: pointer; border: 1px solid #1a1916; background: transparent; color: #1a1916; border-radius: 0; transition: background .2s, color .2s; }
  .uiBtn:hover { background: rgba(26,25,22,.06); }
  .uiBtn.uiPri { background: #1a1916; color: #f7f5f0; }
  .uiBtn.uiPri:hover { background: #3a372f; }`;
  const style = document.createElement('style'); style.textContent = css;
  (document.head || document.documentElement).appendChild(style);

  function build(msg, opt) {
    opt = opt || {};
    return new Promise(resolve => {
      const ov = document.createElement('div'); ov.className = 'uiOv';
      ov.innerHTML = `<div class="uiCard">
        <div class="uiK">${opt.kicker || 'SIGHT'}</div>
        <div class="uiMsg"></div>
        ${opt.input ? `<input class="uiIn" type="${opt.type || 'text'}" />` : ''}
        <div class="uiActs">
          ${opt.cancel ? `<button class="uiBtn" data-x="0">${opt.cancelText || '取消'}</button>` : ''}
          <button class="uiBtn uiPri" data-x="1">${opt.okText || '確定'}</button>
        </div>
      </div>`;
      ov.querySelector('.uiMsg').textContent = msg || '';
      const inp = ov.querySelector('.uiIn');
      if (inp) { inp.placeholder = opt.placeholder || ''; inp.value = opt.value || ''; }
      document.body.appendChild(ov);
      requestAnimationFrame(() => ov.classList.add('show'));
      const done = (v) => { removeEventListener('keydown', onKey, true); ov.classList.remove('show'); setTimeout(() => ov.remove(), 190); resolve(v); };
      const ok = () => done(opt.input ? (inp ? inp.value : '') : true);
      const no = () => done(opt.input ? null : false);
      ov.querySelector('[data-x="1"]').onclick = ok;
      const cb = ov.querySelector('[data-x="0"]'); if (cb) cb.onclick = no;
      ov.addEventListener('mousedown', e => { if (e.target === ov && opt.cancel) no(); });
      function onKey(e) {
        if (e.key === 'Escape' && opt.cancel) { e.stopPropagation(); no(); }
        else if (e.key === 'Enter') { e.stopPropagation(); ok(); }
        else if (inp) e.stopPropagation();   // 輸入時不觸發頁面快捷鍵
      }
      addEventListener('keydown', onKey, true);
      if (inp) setTimeout(() => inp.focus(), 60);
    });
  }
  window.UI = {
    alert: (m, o) => build(m, Object.assign({ cancel: false }, o)),
    confirm: (m, o) => build(m, Object.assign({ cancel: true }, o)),
    prompt: (m, o) => build(m, Object.assign({ cancel: true, input: true }, o))
  };
})();
