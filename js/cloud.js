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
import { getFirestore, doc, getDoc, getDocs, setDoc, updateDoc, collection, query, where, onSnapshot, arrayUnion } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';

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

window.Cloud = { status: '連線中…', uid: null, user: null, enabled: false, err: null, join, watch, pushNow, signInGoogle, signOutGoogle };

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
      const payload = { data: JSON.parse(json), published: !!ex.published, updatedAt: ex.updatedAt || Date.now(), client: CLIENT_ID, members: arrayUnion(Cloud.uid) };
      if (!knownDocs.has(ex.id)) payload.owner = Cloud.uid;
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
  await updateDoc(doc(db, COL, id), { members: arrayUnion(Cloud.uid) });
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

let syncStarted = false;
function startSync() { hookStore(); pull(); if (!syncStarted) { syncStarted = true; setInterval(pull, 45000); } }
hookStore(); setInterval(hookStore, 1000);
