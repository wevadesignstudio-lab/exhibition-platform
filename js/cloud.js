/* =========================================================================
   雲端協作層（Firebase / Firestore）—— 本機優先＋背景同步
   - 匿名登入取得雲端身分（uid）
   - 我的展覽自動上傳；「加入協作」後多人共編同一檔展覽
   - 已發佈的展覽全班（所有人）都拉得到
   - 完全不影響本機模式：雲端失敗時一切照常，只是不同步
   資料模型：collection `vex_exhibitions/{exId}` =
     { data:<整個展覽物件>, owner:<uid>, members:[uid...], published, updatedAt, client }
   ========================================================================= */
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js';
import { getAuth, signInAnonymously, onAuthStateChanged, GoogleAuthProvider, signInWithPopup, signOut as fbSignOut } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';
import { getFirestore, doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc, collection, query, where, onSnapshot, arrayUnion, arrayRemove, deleteField } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';

const firebaseConfig = {
  apiKey: "AIzaSyACR6Pf0icDgsopS2n60su5Uc7KD3f-uNw",
  authDomain: "student-bd3e9.firebaseapp.com",
  projectId: "student-bd3e9",
  storageBucket: "student-bd3e9.firebasestorage.app",
  messagingSenderId: "420242427960",
  appId: "1:420242427960:web:15940016b6b60508a916cd"
};
const COL = 'vex_exhibitions';
const CLIENT_ID = 'c' + Math.random().toString(36).slice(2, 10);
const KEY = 'exhib_platform_v1';

window.Cloud = { status: '連線中…', uid: null, user: null, enabled: false, err: null, join, watch, pushNow, signInGoogle, signOutGoogle, presence,
  curatorStatus, listCurators, setCurator, setCuratorAdmin, joinByCode, exMeta, ensureJoinCode, setRole, removeMember,
  getSiteConfig, saveSiteConfig, listPubRequests, approvePublish, rejectPublish,
  applyCurator, listLive, setExPass, sha256 };

let db, auth;
try {
  const app = initializeApp(firebaseConfig);
  auth = getAuth(app); db = getFirestore(app);
  onAuthStateChanged(auth, u => {
    if (!u) {   // 尚未登入（或剛登出 Google）→ 退回匿名身分
      signInAnonymously(auth).catch(e => setStatus('雲端未啟用（匿名登入被拒：' + (e.code || e) + '）', e));
      return;
    }
    Cloud.uid = u.uid;
    Cloud.user = u.isAnonymous ? null : { uid: u.uid, name: u.displayName, email: u.email, photo: u.photoURL };
    Cloud.enabled = true; setStatus('已連線'); startSync();
    if (Cloud.user) ensureCurator();   // Google 使用者：確保有審核名單記錄（管理者自動開通）
    for (const k in lastPushed) delete lastPushed[k];   // 換身分後重推，讓 members 掛上新 uid
    pushNow();
    window.dispatchEvent(new CustomEvent('cloud-auth'));
  });
} catch (e) { setStatus('雲端初始化失敗', e); }

async function signInGoogle() {
  const cred = await signInWithPopup(auth, new GoogleAuthProvider());
  return cred.user;
}
async function signOutGoogle() { await fbSignOut(auth); }   // onAuthStateChanged 會自動退回匿名

function setStatus(s, e) { Cloud.status = s; if (e) { Cloud.err = e.code || String(e); console.warn('[cloud]', s, e); } window.dispatchEvent(new CustomEvent('cloud-status')); }
function localDB() { try { return JSON.parse(localStorage.getItem(KEY)) || { users: {}, exhibitions: {} }; } catch (e) { return { users: {}, exhibitions: {} }; } }
function saveLocal(d) { localStorage.setItem(KEY, JSON.stringify(d)); window.dispatchEvent(new CustomEvent('cloud-sync')); }
const knownDocs = new Set();

function mergeIn(cloudDocs) {
  const ldb = localDB(); let changed = false;
  const me = localStorage.getItem('exhib_current_user');
  for (const cd of cloudDocs) {
    const ex = cd.data; if (!ex || !ex.id) continue;
    knownDocs.add(ex.id);
    const loc = ldb.exhibitions[ex.id];
    if (!loc || (ex.updatedAt || 0) > (loc.updatedAt || 0)) {
      if (cd.members && cd.members.includes(Cloud.uid) && me) ex.ownerId = me;   // 我是協作者 → 本機可編輯
      ldb.exhibitions[ex.id] = ex; changed = true;
    }
  }
  if (changed) saveLocal(ldb);
  return changed;
}

async function pull() {
  const out = [];
  try {
    for (const q of [query(collection(db, COL), where('published', '==', true)), query(collection(db, COL), where('members', 'array-contains', Cloud.uid))]) {
      (await getDocs(q)).forEach(d => out.push(d.data()));
    }
    mergeIn(out); setStatus('已連線');
  } catch (e) { setStatus('雲端被拒（需設定 Firestore 規則，見 FIREBASE_SETUP.md）', e); }
}

/* 推送：包住 Store._commit，本機每次存檔後 1.2 秒批次上傳我擁有的展覽 */
let pushTimer = null; const lastPushed = {};
function hookStore() {
  if (!window.Store || Store.__cloudHooked) return;
  Store.__cloudHooked = true;
  const orig = Store._commit.bind(Store);
  Store._commit = function () { orig(); clearTimeout(pushTimer); pushTimer = setTimeout(pushNow, 1200); };
}
async function pushNow() {
  if (!Cloud.enabled) return;
  const me = localStorage.getItem('exhib_current_user'); if (!me) return;
  const ldb = localDB();
  for (const ex of Object.values(ldb.exhibitions)) {
    if (ex.ownerId !== me) continue;
    if (lastPushed[ex.id] === ex.updatedAt) continue;
    const json = JSON.stringify(ex);
    if (json.length > 900000) { console.warn('[cloud] 展覽過大無法同步（圖片請改用網址或 assets/img/）', ex.id); continue; }
    try {
      const payload = { data: JSON.parse(json), published: !!ex.published, pubPending: !!ex.pubPending, updatedAt: ex.updatedAt || Date.now(), client: CLIENT_ID, members: arrayUnion(Cloud.uid) };
      if (!knownDocs.has(ex.id)) { payload.owner = Cloud.uid; payload.joinCode = makeCode(); }
      await setDoc(doc(db, COL, ex.id), payload, { merge: true });
      knownDocs.add(ex.id); lastPushed[ex.id] = ex.updatedAt; setStatus('已連線・已同步');
    } catch (e) { setStatus('上傳被拒（需設定 Firestore 規則）', e); return; }
  }
}

/* 加入協作：貼上展覽連結或 ID → 把自己加進 members → 本機可編輯 */
async function join(idOrUrl) {
  const m = String(idOrUrl).match(/id=([\w-]+)/); const id = m ? m[1] : String(idOrUrl).trim();
  if (!id) throw new Error('無效的連結或 ID');
  const snap = await getDoc(doc(db, COL, id));
  if (!snap.exists()) throw new Error('雲端找不到這檔展覽（對方可能尚未同步）');
  await updateDoc(doc(db, COL, id), { members: arrayUnion(Cloud.uid), ['roles.' + Cloud.uid]: 'full' });
  const cd = snap.data(); cd.members = (cd.members || []).concat([Cloud.uid]);
  mergeIn([cd]);
  return cd.data;
}

/* 即時協作：訂閱單一展覽，別人改了就通知（觀展器用） */
function watch(exId, cb) {
  if (!Cloud.enabled || !db) return () => {};
  return onSnapshot(doc(db, COL, exId), snap => {
    if (!snap.exists()) return;
    const cd = snap.data();
    if (cd.client === CLIENT_ID) return;   // 自己的變更不用理
    if (mergeIn([cd]) && cb) cb();
  }, e => console.warn('[cloud] watch', e));
}

/* ===== 策展工作室審核名單（vex_curators/{uid}） =====
   Google 登入後自動建立申請記錄；SITE.adminEmails 內的信箱自動核准並成為管理者。 */
const CUR_COL = 'vex_curators';
async function ensureCurator() {
  try {
    const ref = doc(db, CUR_COL, Cloud.uid);
    const snap = await getDoc(ref);
    if (!snap.exists()) {
      const admin = ((window.SITE && SITE.adminEmails) || []).includes(Cloud.user.email);
      await setDoc(ref, { uid: Cloud.uid, name: Cloud.user.name || '', email: Cloud.user.email || '', approved: admin, admin, requestedAt: Date.now() });
    }
  } catch (e) { console.warn('[cloud] curator', e); }
}
async function curatorStatus() {
  if (!Cloud.enabled || !Cloud.user) return null;
  try {
    const snap = await getDoc(doc(db, CUR_COL, Cloud.uid));
    if (!snap.exists()) { await ensureCurator(); return curatorStatus(); }
    const d = snap.data(); return { approved: !!d.approved, admin: !!d.admin, applied: !!(d.applied || d.org || d.exp) };
  } catch (e) { return null; }   // 讀不到（規則未設）→ 呼叫端決定放行與否
}
/* 送出策展工作室開通申請（單位名稱＋相關經驗或作品） */
async function applyCurator(fields) {
  await setDoc(doc(db, CUR_COL, Cloud.uid), { org: fields.org || '', exp: fields.exp || '', applied: true, appliedAt: Date.now() }, { merge: true });
}
async function listCurators() {
  const out = []; (await getDocs(collection(db, CUR_COL))).forEach(d => out.push(d.data()));
  return out.sort((a, b) => (a.approved ? 1 : 0) - (b.approved ? 1 : 0) || (b.requestedAt || 0) - (a.requestedAt || 0));
}
async function setCurator(uid, approved) { await updateDoc(doc(db, CUR_COL, uid), { approved: !!approved }); }
async function setCuratorAdmin(uid, admin) { await updateDoc(doc(db, CUR_COL, uid), admin ? { admin: true, approved: true } : { admin: false }); }

/* ===== 網站設定（vex_site/config）：首頁 banner 與策展活動，由管理後台編輯 ===== */
async function getSiteConfig() {
  try { const snap = await getDoc(doc(db, 'vex_site', 'config')); return snap.exists() ? snap.data() : null; }
  catch (e) { return null; }
}
async function saveSiteConfig(patch) { await setDoc(doc(db, 'vex_site', 'config'), patch, { merge: true }); }

/* ===== 策展上線審核：策展人申請（pubPending）→ 管理者核准後 published ===== */
async function listPubRequests() {
  const out = [];
  (await getDocs(query(collection(db, COL), where('pubPending', '==', true)))).forEach(d => {
    const cd = d.data(); out.push({ id: d.id, title: (cd.data || {}).title || d.id, thumb: (cd.data || {}).thumb || '' });
  });
  return out;
}
async function approvePublish(exId) {
  await updateDoc(doc(db, COL, exId), { published: true, pubPending: false, 'data.published': true, 'data.pubPending': false, 'data.updatedAt': Date.now(), updatedAt: Date.now() });
}
async function rejectPublish(exId) {
  await updateDoc(doc(db, COL, exId), { pubPending: false, 'data.pubPending': false, 'data.updatedAt': Date.now(), updatedAt: Date.now() });
}

/* ===== 展覽密碼（僅管理員設定）：存 SHA-256 雜湊，觀眾進場輸入比對 ===== */
async function listLive() {
  const out = [];
  (await getDocs(query(collection(db, COL), where('published', '==', true)))).forEach(d => {
    const cd = d.data(); out.push({ id: d.id, title: (cd.data || {}).title || d.id, hasPass: !!cd.passHash });
  });
  return out;
}
async function setExPass(exId, passHash) {
  await updateDoc(doc(db, COL, exId), { passHash: passHash || null, 'data.passHash': passHash || null, 'data.updatedAt': Date.now(), updatedAt: Date.now() });
}
async function sha256(s) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s));
  return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join('');
}

/* ===== 共同策展：加入代號與成員權限 =====
   雲端展覽 doc 增加 joinCode（6 碼）、roles:{uid:'full'|'own'}、memberInfo:{uid:{name}}。
   'full'=全權編輯，'own'=僅能新增／編輯自己上架的作品。 */
function makeCode() { const A = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'; let s = ''; for (let i = 0; i < 6; i++) s += A[Math.floor(Math.random() * A.length)]; return s; }
async function exMeta(exId) {
  const snap = await getDoc(doc(db, COL, exId));
  if (!snap.exists()) return null;
  const d = snap.data();
  return { owner: d.owner, roles: d.roles || {}, joinCode: d.joinCode || '', memberInfo: d.memberInfo || {}, members: d.members || [], title: (d.data || {}).title || '' };
}
async function ensureJoinCode(exId) {
  const m = await exMeta(exId); if (!m) throw new Error('這檔展覽尚未同步到雲端');
  if (m.joinCode) return m.joinCode;
  const code = makeCode();
  await updateDoc(doc(db, COL, exId), { joinCode: code });
  return code;
}
async function joinByCode(code) {
  code = String(code).trim().toUpperCase();
  if (!code) throw new Error('請輸入代號');
  const qs = await getDocs(query(collection(db, COL), where('joinCode', '==', code)));
  if (qs.empty) throw new Error('找不到這個代號，請向創辦人確認');
  const d0 = qs.docs[0]; const cd = d0.data();
  const patch = { members: arrayUnion(Cloud.uid) };
  patch['roles.' + Cloud.uid] = (cd.roles || {})[Cloud.uid] || 'own';   // 新成員預設：僅限自己的作品
  patch['memberInfo.' + Cloud.uid] = { name: (window.Auth && Auth.current()?.name) || (Cloud.user && Cloud.user.name) || '協作者' };
  await updateDoc(doc(db, COL, d0.id), patch);
  cd.members = (cd.members || []).concat([Cloud.uid]);
  mergeIn([cd]);
  return cd.data;
}
async function setRole(exId, uid, role) { await updateDoc(doc(db, COL, exId), { ['roles.' + uid]: role }); }
async function removeMember(exId, uid) { await updateDoc(doc(db, COL, exId), { members: arrayRemove(uid), ['roles.' + uid]: deleteField(), ['memberInfo.' + uid]: deleteField() }); }

/* 同行觀眾：在 vex_presence/{exId}/users/{uid} 回報自己的位置，並訂閱其他人。
   規則未開通時安靜停用，不影響觀展。回傳 { stop, kick }。 */
const PCOL = 'vex_presence';
function presence(exId, getState, onPeers) {
  if (!Cloud.enabled || !db) return { stop() {}, kick() {} };
  const myRef = doc(db, PCOL, exId, 'users', Cloud.uid);
  let lastKey = null, lastT = 0, stopped = false, denied = false;
  async function push(force) {
    if (stopped || denied) return;
    const s = getState(); if (!s) return;
    const key = JSON.stringify([Math.round(s.x * 3), Math.round(s.z * 3), s.room, s.msg, s.name]);
    const now = Date.now();
    if (!force && key === lastKey && now - lastT < 20000) return;   // 沒移動 → 20 秒心跳
    lastKey = key; lastT = now;
    try { await setDoc(myRef, { ...s, uid: Cloud.uid, ts: now }); }
    catch (e) { denied = true; }
  }
  const iv = setInterval(() => push(false), 3000); push(true);
  let unsub = () => {};
  try {
    unsub = onSnapshot(collection(db, PCOL, exId, 'users'), snap => {
      const now = Date.now(), peers = [];
      snap.forEach(d => { const p = d.data(); if (p.uid !== Cloud.uid && now - (p.ts || 0) < 30000) peers.push(p); });
      onPeers(peers);
    }, () => {});
  } catch (e) {}
  const bye = () => { try { deleteDoc(myRef); } catch (e) {} };
  addEventListener('pagehide', bye);
  return {
    kick() { push(true); },
    stop() { stopped = true; clearInterval(iv); unsub(); removeEventListener('pagehide', bye); bye(); }
  };
}

let syncStarted = false;
function startSync() { hookStore(); pull(); if (!syncStarted) { syncStarted = true; setInterval(pull, 45000); } }
hookStore(); setInterval(hookStore, 1000);
