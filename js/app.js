import { renderDashboard } from "./views/dashboard.js";
import { renderHistory } from "./views/history.js";
import { renderCharts, refreshChartOnResize } from "./views/charts.js";
import { openCreateForm, openEditForm } from "./views/form.js";
import { exportJson, exportCsv, importJsonFile } from "./backup.js";
import { formatDate } from "./utils/date.js";

const views = ["dashboard", "history", "charts", "settings"];

function showToast(message) {
  const toast = document.getElementById("toast");
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(showToast._t);
  showToast._t = setTimeout(() => toast.classList.remove("show"), 2200);
}

async function refreshAll() {
  await Promise.all([renderDashboard(), renderHistory(handleHistorySelect), renderCharts()]);
}

function handleHistorySelect(record) {
  openEditForm(record, async () => {
    await refreshAll();
    showToast("記録を更新しました");
  });
}

function switchView(name) {
  for (const v of views) {
    document.getElementById(`view-${v}`).classList.toggle("active", v === name);
  }
  for (const btn of document.querySelectorAll(".nav-btn")) {
    btn.classList.toggle("active", btn.dataset.view === name);
  }
  window.scrollTo(0, 0);
  if (name === "charts") {
    renderCharts();
  } else if (name === "history") {
    renderHistory(handleHistorySelect);
  } else if (name === "dashboard") {
    renderDashboard();
  }
}

function setupNav() {
  for (const btn of document.querySelectorAll(".nav-btn")) {
    btn.addEventListener("click", () => switchView(btn.dataset.view));
  }
}

function setupFab() {
  document.getElementById("fab-add").addEventListener("click", () => {
    openCreateForm(async () => {
      await refreshAll();
      showToast("記録を保存しました");
    });
  });
}

function setupSettings() {
  document.getElementById("btn-export-json").addEventListener("click", async () => {
    await exportJson();
    showToast("JSONファイルを書き出しました");
  });
  document.getElementById("btn-export-csv").addEventListener("click", async () => {
    await exportCsv();
    showToast("CSVファイルを書き出しました");
  });

  const fileInput = document.getElementById("import-file-input");
  document.getElementById("btn-import-json").addEventListener("click", () => {
    fileInput.value = "";
    fileInput.click();
  });
  fileInput.addEventListener("change", async () => {
    const file = fileInput.files[0];
    if (!file) return;
    try {
      const count = await importJsonFile(file);
      await refreshAll();
      showToast(`${count}件の記録を読み込みました`);
    } catch (err) {
      alert(err.message || "インポートに失敗しました。");
    }
  });

  document.getElementById("btn-clear-cache").addEventListener("click", async () => {
    const ok = confirm(
      "アプリのキャッシュをクリアして再読み込みします。記録データは削除されません。よろしいですか？"
    );
    if (!ok) return;
    try {
      await clearAppCache();
    } finally {
      window.location.reload();
    }
  });
}

function setupHeaderDate() {
  document.getElementById("header-date").textContent = formatDate(new Date().toISOString());
}

function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) return;

  // 新しいService Workerが有効化されたら1回だけ再読み込みし、常に最新のコードに切り替える。
  // 初回登録時（コントローラーがまだ無い状態）は「更新」ではないのでリロードしない。
  const hadController = !!navigator.serviceWorker.controller;
  let refreshedForUpdate = false;
  navigator.serviceWorker.addEventListener("controllerchange", () => {
    if (!hadController || refreshedForUpdate) return;
    refreshedForUpdate = true;
    window.location.reload();
  });

  window.addEventListener("load", () => {
    // updateViaCache: "none" でsw.js自体はHTTPキャッシュを経由せず毎回確認する
    navigator.serviceWorker
      .register("sw.js", { updateViaCache: "none" })
      .then((registration) => {
        // ホーム画面から再度開いた時（バックグラウンド復帰時）にも更新を確認する
        document.addEventListener("visibilitychange", () => {
          if (document.visibilityState === "visible") {
            registration.update().catch(() => {});
          }
        });
      })
      .catch((err) => {
        console.warn("Service worker registration failed:", err);
      });
  });
}

async function clearAppCache() {
  if ("serviceWorker" in navigator) {
    const registrations = await navigator.serviceWorker.getRegistrations();
    await Promise.all(registrations.map((r) => r.unregister()));
  }
  if (window.caches) {
    const keys = await caches.keys();
    await Promise.all(keys.map((k) => caches.delete(k)));
  }
}

async function init() {
  setupNav();
  setupFab();
  setupSettings();
  setupHeaderDate();
  refreshChartOnResize();
  registerServiceWorker();
  await refreshAll();
}

init();
