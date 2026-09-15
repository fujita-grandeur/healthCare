import { getAllRecords } from "../db.js";
import { ALL_FIELDS } from "../fields.js";
import { formatDateTime } from "../utils/date.js";

let activeLabelFilter = null; // null = すべて表示

function formatValue(field, value) {
  return field.decimals > 0 ? Number(value).toFixed(field.decimals) : String(Math.round(value));
}

function escapeHtml(str) {
  return str.replace(/[&<>"']/g, (c) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[c]);
}

function buildValuesMarkup(record) {
  const parts = [];

  const hasSys = record.values.systolic !== undefined;
  const hasDia = record.values.diastolic !== undefined;
  if (hasSys || hasDia) {
    parts.push(
      `<span class="history-value"><span class="label">血圧</span>${record.values.systolic ?? "-"}/${record.values.diastolic ?? "-"}<span class="unit"> mmHg</span></span>`
    );
  }

  for (const field of ALL_FIELDS) {
    if (field.key === "systolic" || field.key === "diastolic") continue;
    const v = record.values[field.key];
    if (v === undefined || v === null) continue;
    parts.push(
      `<span class="history-value"><span class="label">${field.label}</span>${formatValue(field, v)}<span class="unit"> ${field.unit}</span></span>`
    );
  }
  return parts.join("");
}

function makeChip(text, active, onClick) {
  const chip = document.createElement("button");
  chip.type = "button";
  chip.className = "chip" + (active ? " active" : "");
  chip.textContent = text;
  chip.addEventListener("click", onClick);
  return chip;
}

export async function renderHistory(onSelect) {
  const container = document.getElementById("history-list");
  const filterContainer = document.getElementById("history-label-filter");
  container.innerHTML = "";

  const allRecords = await getAllRecords();
  const labels = [...new Set(allRecords.map((r) => r.label).filter(Boolean))];

  // ラベルが存在しない場合は選んでいたフィルタを無効化
  if (activeLabelFilter && !labels.includes(activeLabelFilter)) {
    activeLabelFilter = null;
  }

  filterContainer.innerHTML = "";
  if (labels.length > 0) {
    filterContainer.classList.remove("hidden");
    filterContainer.appendChild(
      makeChip("すべて", activeLabelFilter === null, () => {
        activeLabelFilter = null;
        renderHistory(onSelect);
      })
    );
    for (const label of labels) {
      filterContainer.appendChild(
        makeChip(label, activeLabelFilter === label, () => {
          activeLabelFilter = label;
          renderHistory(onSelect);
        })
      );
    }
  } else {
    filterContainer.classList.add("hidden");
  }

  const records = activeLabelFilter
    ? allRecords.filter((r) => r.label === activeLabelFilter)
    : allRecords;

  if (records.length === 0) {
    container.innerHTML = activeLabelFilter
      ? `<div class="empty-state">「${escapeHtml(activeLabelFilter)}」の記録はまだありません。</div>`
      : `<div class="empty-state">まだ記録がありません。<br>右下の「＋記録する」から最初の記録を追加しましょう。</div>`;
    return;
  }

  for (const record of records) {
    const item = document.createElement("button");
    item.type = "button";
    item.className = "history-item";
    item.style.cssText = "width:100%; text-align:left; display:block; cursor:pointer;";
    const labelBadge = record.label
      ? `<span class="history-label-badge">${escapeHtml(record.label)}</span>`
      : "";
    item.innerHTML = `
      <div class="history-date">${formatDateTime(record.measuredAt)}${labelBadge}</div>
      <div class="history-values">${buildValuesMarkup(record)}</div>
    `;
    item.addEventListener("click", () => onSelect(record));
    container.appendChild(item);
  }
}
