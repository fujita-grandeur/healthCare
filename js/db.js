// IndexedDBラッパー。records（測定記録）とmeta（設定・スキーマバージョン）の2ストアを持つ。
const DB_NAME = "health-records-db";
const DB_VERSION = 1;
const STORE_RECORDS = "records";
const STORE_META = "meta";

let dbPromise = null;

function openDb() {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = (event) => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_RECORDS)) {
        const store = db.createObjectStore(STORE_RECORDS, { keyPath: "id" });
        store.createIndex("measuredAt", "measuredAt", { unique: false });
      }
      if (!db.objectStoreNames.contains(STORE_META)) {
        db.createObjectStore(STORE_META, { keyPath: "key" });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  return dbPromise;
}

function genId() {
  if (crypto.randomUUID) return crypto.randomUUID();
  return "id-" + Date.now() + "-" + Math.random().toString(16).slice(2);
}

export async function addRecord(measuredAt, values) {
  const db = await openDb();
  const now = new Date().toISOString();
  const record = {
    id: genId(),
    measuredAt,
    createdAt: now,
    updatedAt: now,
    values,
  };
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_RECORDS, "readwrite");
    tx.objectStore(STORE_RECORDS).add(record);
    tx.oncomplete = () => resolve(record);
    tx.onerror = () => reject(tx.error);
  });
}

export async function updateRecord(id, measuredAt, values) {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_RECORDS, "readwrite");
    const store = tx.objectStore(STORE_RECORDS);
    const getReq = store.get(id);
    getReq.onsuccess = () => {
      const existing = getReq.result;
      if (!existing) {
        reject(new Error("record not found: " + id));
        return;
      }
      const updated = {
        ...existing,
        measuredAt,
        values,
        updatedAt: new Date().toISOString(),
      };
      store.put(updated);
      tx.oncomplete = () => resolve(updated);
    };
    tx.onerror = () => reject(tx.error);
  });
}

export async function deleteRecord(id) {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_RECORDS, "readwrite");
    tx.objectStore(STORE_RECORDS).delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function getRecord(id) {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_RECORDS, "readonly");
    const req = tx.objectStore(STORE_RECORDS).get(id);
    req.onsuccess = () => resolve(req.result || null);
    req.onerror = () => reject(req.error);
  });
}

// 全件を measuredAt 降順で取得
export async function getAllRecords() {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_RECORDS, "readonly");
    const store = tx.objectStore(STORE_RECORDS);
    const index = store.index("measuredAt");
    const results = [];
    const req = index.openCursor(null, "prev");
    req.onsuccess = () => {
      const cursor = req.result;
      if (cursor) {
        results.push(cursor.value);
        cursor.continue();
      } else {
        resolve(results);
      }
    };
    req.onerror = () => reject(req.error);
  });
}

// ISO日時範囲でのフィルタ取得（measuredAt 降順）
export async function getRecordsInRange(fromIso, toIso) {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_RECORDS, "readonly");
    const store = tx.objectStore(STORE_RECORDS);
    const index = store.index("measuredAt");
    const range =
      fromIso && toIso
        ? IDBKeyRange.bound(fromIso, toIso)
        : fromIso
          ? IDBKeyRange.lowerBound(fromIso)
          : toIso
            ? IDBKeyRange.upperBound(toIso)
            : null;
    const results = [];
    const req = index.openCursor(range, "prev");
    req.onsuccess = () => {
      const cursor = req.result;
      if (cursor) {
        results.push(cursor.value);
        cursor.continue();
      } else {
        resolve(results);
      }
    };
    req.onerror = () => reject(req.error);
  });
}

export async function getMeta(key) {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_META, "readonly");
    const req = tx.objectStore(STORE_META).get(key);
    req.onsuccess = () => resolve(req.result ? req.result.value : undefined);
    req.onerror = () => reject(req.error);
  });
}

export async function setMeta(key, value) {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_META, "readwrite");
    tx.objectStore(STORE_META).put({ key, value });
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

// バックアップ用：全レコードを置き換える（インポート時に使用）
export async function replaceAllRecords(records) {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_RECORDS, "readwrite");
    const store = tx.objectStore(STORE_RECORDS);
    store.clear();
    for (const r of records) {
      store.put(r);
    }
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function mergeRecords(records) {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_RECORDS, "readwrite");
    const store = tx.objectStore(STORE_RECORDS);
    for (const r of records) {
      store.put(r);
    }
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}
