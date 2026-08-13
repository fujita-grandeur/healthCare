import { getAllRecords } from "../db.js";
import { ALL_FIELDS, getField } from "../fields.js";
import { formatDateTime } from "../utils/date.js";

function formatValue(field, value) {
  return field.decimals > 0 ? Number(value).toFixed(field.decimals) : String(Math.round(value));
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

export async function renderHistory(onSelect) {
  const container = document.getElementById("history-list");
  container.innerHTML = "";

  const records = await getAllRecords();

  if (records.length === 0) {
    container.innerHTML = `<div class="empty-state">まだ記録がありません。<br>右下の「＋記録する」から最初の記録を追加しましょう。</div>`;
    return;
  }

  for (const record of records) {
    const item = document.createElement("button");
    item.type = "button";
    item.className = "history-item";
    item.style.cssText = "width:100%; text-align:left; display:block; cursor:pointer;";
    item.innerHTML = `
      <div class="history-date">${formatDateTime(record.measuredAt)}</div>
      <div class="history-values">${buildValuesMarkup(record)}</div>
    `;
    item.addEventListener("click", () => onSelect(record));
    container.appendChild(item);
  }
}
