import { getRecordsInRange, getAllRecords } from "../db.js";
import { getField, DAILY_FIELD_KEYS, LAB_FIELD_KEYS } from "../fields.js";
import { formatDate, formatTime, startOfToday, isToday } from "../utils/date.js";

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

function renderDailyTile(key, latestToday) {
  const field = getField(key);
  const record = latestToday;
  const value = record ? record.values[key] : undefined;

  const tile = document.createElement("div");
  if (value === undefined || value === null) {
    tile.className = "metric-tile empty";
    tile.innerHTML = `
      <div class="metric-label">${field.label}</div>
      <div class="metric-value">未記録</div>
    `;
  } else {
    tile.className = "metric-tile";
    tile.innerHTML = `
      <div class="metric-label">${field.label}</div>
      <div class="metric-value">${formatValue(field, value)}<span class="unit">${field.unit}</span></div>
      <div class="metric-time">${formatTime(record.measuredAt)}</div>
    `;
  }
  return tile;
}

function renderBloodPressureTile(latestToday) {
  const sys = latestToday ? latestToday.values.systolic : undefined;
  const dia = latestToday ? latestToday.values.diastolic : undefined;
  const tile = document.createElement("div");
  if (sys === undefined && dia === undefined) {
    tile.className = "metric-tile empty";
    tile.innerHTML = `
      <div class="metric-label">血圧</div>
      <div class="metric-value">未記録</div>
    `;
  } else {
    tile.className = "metric-tile";
    const labelSuffix = latestToday.label ? ` · ${escapeHtml(latestToday.label)}` : "";
    tile.innerHTML = `
      <div class="metric-label">血圧</div>
      <div class="metric-value">${sys ?? "-"}/${dia ?? "-"}<span class="unit">mmHg</span></div>
      <div class="metric-time">${formatTime(latestToday.measuredAt)}${labelSuffix}</div>
    `;
  }
  return tile;
}

function renderLabTile(key, latestRecordWithValue) {
  const field = getField(key);
  const tile = document.createElement("div");
  if (!latestRecordWithValue) {
    tile.className = "lab-tile empty";
    tile.innerHTML = `
      <div class="metric-label">${field.label}</div>
      <div class="metric-value">記録なし</div>
    `;
    return tile;
  }
  const value = latestRecordWithValue.values[key];
  tile.className = "lab-tile";
  tile.innerHTML = `
    <div class="metric-label">${field.label}</div>
    <div class="metric-value">${formatValue(field, value)}<span class="unit">${field.unit}</span></div>
    <div class="metric-time">${formatDate(latestRecordWithValue.measuredAt)}測定</div>
  `;
  return tile;
}

export async function renderDashboard() {
  const todayGrid = document.getElementById("today-grid");
  const labGrid = document.getElementById("lab-grid");
  todayGrid.innerHTML = "";
  labGrid.innerHTML = "";

  // 今日の記録：今日の範囲のレコードの中で、各項目の最新値を採用
  const fromIso = startOfToday();
  const todaysRecords = await getRecordsInRange(fromIso, null);
  const todaysOnly = todaysRecords.filter((r) => isToday(r.measuredAt));

  function latestTodayFor(key) {
    return todaysOnly.find((r) => r.values[key] !== undefined && r.values[key] !== null);
  }

  const bpRecord = todaysOnly.find(
    (r) => r.values.systolic !== undefined || r.values.diastolic !== undefined
  );

  todayGrid.appendChild(renderBloodPressureTile(bpRecord));
  todayGrid.appendChild(renderDailyTile("pulse", latestTodayFor("pulse")));
  todayGrid.appendChild(renderDailyTile("weight", latestTodayFor("weight")));

  // 最新の検査結果：全期間から最新の値を探す
  const allRecords = await getAllRecords(); // 降順
  for (const key of LAB_FIELD_KEYS) {
    const latest = allRecords.find((r) => r.values[key] !== undefined && r.values[key] !== null);
    labGrid.appendChild(renderLabTile(key, latest));
  }
}
