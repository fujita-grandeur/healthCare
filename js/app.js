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
}

function setupHeaderDate() {
  document.getElementById("header-date").textContent = formatDate(new Date().toISOString());
}

function registerServiceWorker() {
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("sw.js").catch((err) => {
        console.warn("Service worker registration failed:", err);
      });
    });
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
