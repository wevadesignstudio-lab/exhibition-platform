# Firebase 協作設定（一次性，約 3 分鐘）

平台已接上你的 Firebase 專案 `student-bd3e9`（與 WÉVA 共用）。要讓協作生效，需在 Firebase Console 做兩件事：

## 1. 啟用匿名登入
Console → student-bd3e9 → **Authentication → Sign-in method → 匿名（Anonymous）→ 啟用**
（若 WÉVA 已啟用就不用動。）

## 2. 加上 Firestore 規則
Console → **Firestore Database → 規則**，在既有規則的 `match /databases/{database}/documents {` 內**加入**這段（不要動到 WÉVA 原有的規則）：

```
    // 線上展覽平台（vex_ 前綴，與其他系統隔離）
    match /vex_exhibitions/{exId} {
      allow read: if true;
      allow create: if request.auth != null;
      allow update, delete: if request.auth != null;
    }
    // 同行觀眾（互相看見彼此的位置光球）
    match /vex_presence/{exId}/users/{uid} {
      allow read: if true;
      allow write: if request.auth != null;
    }
    // 策展工作室審核名單（Google 登入後自動申請；管理者核准）
    match /vex_curators/{uid} {
      allow read: if true;
      allow write: if request.auth != null;
    }
```

## 帳號與權限
- **管理者**：`js/site.js` 的 `adminEmails` 裡的 Google 信箱登入即自動開通，並在工作室看到「帳號審核」區。
- **策展人**：其他人以 Google 登入後自動送出申請，管理者核准後才能進入策展工作室。
- **共同策展**：每檔展覽有 6 碼「加入代號」（成員面板可見）；夥伴在「加入協作」輸入即可加入。新成員預設「僅限自己的作品」，創辦人可改為「全權編輯」或移除。

> 這是課堂友善版：任何登入者可編輯（方便學生互相協作）。若之後要收緊成「僅擁有者與協作成員可改」，告訴 Claude 換嚴格版規則。

## 運作方式
- 每個瀏覽器自動取得一個雲端身分（匿名 uid），不用註冊。
- 你建立／編輯的展覽會自動同步上雲（存檔後約 1 秒）。
- **協作**：把展覽網址（view.html?id=…）傳給同學 → 對方在首頁按「**加入協作展覽**」貼上 → 兩人即可共編，變更即時互相同步。
- **發佈**的展覽，全班在「公開展覽」都看得到。
- 雲端沒設定好也不影響使用——一切照常，只是不同步（首頁會顯示狀態）。

## 注意
- 單檔展覽超過約 900KB 不會同步（Firestore 限制）——**圖片請用 assets/img/ 或網址**，避免大量「上傳檔案」的內嵌圖。
- 協作衝突採「後存檔者為準」；建議分工（每人負責一個房間／一面牆）。
