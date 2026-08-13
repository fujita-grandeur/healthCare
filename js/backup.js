import { getAllRecords, mergeRecords } from "./db.js";
import { ALL_FIELDS } from "./fields.js";
import { formatDateTime } from "./utils/date.js";

const SCHEMA_VERSION = 1;

function downloadBlob(content, filename, mime) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function timestampForFilename() {
  const d = new Date();
  const p = (n) => String(n).padStart(2, "0");
  return (
    d.getFullYear() + p(d.getMonth() + 1) + p(d.getDate()) + "-" + p(d.getHours()) + p(d.getMinutes())
  );
}

export async function exportJson() {
  const records = await getAllRecords();
  const payload = {
    schemaVersion: SCHEMA_VERSION,
    exportedAt: new Date().toISOString(),
    records,
  };
  const json = JSON.stringify(payload, null, 2);
  downloadBlob(json, `health-records-${timestampForFilename()}.json`, "application/json");
}

export async function exportCsv() {
  const records = await getAllRecords();
  const ascending = [...records].reverse();

  const headers = ["measuredAt", ...ALL_FIELDS.map((f) => f.key)];
  const headerLabels = ["測定日時", ...ALL_FIELDS.map((f) => `${f.label}(${f.unit})`)];

  const rows = [headerLabels.join(",")];
  for (const r of ascending) {
    const cols = [formatDateTime(r.measuredAt)];
    for (const f of ALL_FIELDS) {
      const v = r.values[f.key];
      cols.push(v === undefined || v === null ? "" : String(v));
    }
    rows.push(cols.join(","));
  }

  const csv = "﻿" + rows.join("\n"); // BOM付き（Excelでの文字化け対策）
  downloadBlob(csv, `health-records-${timestampForFilename()}.csv`, "text/csv");
}

function isValidRecord(r) {
  return (
    r &&
    typeof r.id === "string" &&
    typeof r.measuredAt === "string" &&
    !Number.isNaN(new Date(r.measuredAt).getTime()) &&
    typeof r.values === "object" &&
    r.values !== null
  );
}

export async function importJsonFile(file) {
  const text = await file.text();
  let payload;
  try {
    payload = JSON.parse(text);
  } catch {
    throw new Error("ファイルの形式が正しくありません（JSONとして読み込めませんでした）。");
  }

  const records = Array.isArray(payload) ? payload : payload.records;
  if (!Array.isArray(records)) {
    throw new Error("記録データが見つかりませんでした。");
  }

  const validRecords = records.filter(isValidRecord);
  if (validRecords.length === 0) {
    throw new Error("有効な記録が見つかりませんでした。");
  }

  await mergeRecords(validRecords);
  return validRecords.length;
}
