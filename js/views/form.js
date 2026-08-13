import { FIELD_GROUPS } from "../fields.js";
import { addRecord, updateRecord, deleteRecord, getAllRecords } from "../db.js";
import {
  toDatetimeLocalValue,
  datetimeLocalToIso,
  isoToDatetimeLocalValue,
} from "../utils/date.js";

let currentMode = "create"; // "create" | "edit"
let currentRecord = null;
let onSavedCallback = null;

const overlay = document.getElementById("modal-form");
const titleEl = document.getElementById("form-title");
const measuredAtInput = document.getElementById("form-measured-at");
const fieldsContainer = document.getElementById("form-fields-container");
const form = document.getElementById("record-form");
const deleteBtn = document.getElementById("form-delete-btn");
const closeBtn = document.getElementById("form-close-btn");

function formatValueForHint(field, value) {
  return field.decimals > 0 ? Number(value).toFixed(field.decimals) : String(Math.round(value));
}

async function buildFields() {
  fieldsContainer.innerHTML = "";
  const allRecords = await getAllRecords(); // 降順、前回値検索に使う

  for (const group of FIELD_GROUPS) {
    const groupTitle = document.createElement("div");
    groupTitle.className = "field-group-title";
    groupTitle.textContent = group.label;
    fieldsContainer.appendChild(groupTitle);

    const groupDesc = document.createElement("div");
    groupDesc.className = "field-group-desc";
    groupDesc.textContent = group.description;
    fieldsContainer.appendChild(groupDesc);

    const card = document.createElement("div");
    card.className = "card";

    for (const field of group.fields) {
      const row = document.createElement("div");
      row.className = "field-row";

      const label = document.createElement("label");
      label.setAttribute("for", "input-" + field.key);
      label.textContent = field.label;
      row.appendChild(label);

      const wrap = document.createElement("div");
      wrap.className = "field-input-wrap";

      const input = document.createElement("input");
      input.type = "number";
      input.id = "input-" + field.key;
      input.name = field.key;
      input.inputMode = "decimal";
      input.step = String(field.step);
      input.min = String(field.min);
      input.max = String(field.max);
      input.placeholder = "-";

      const existingValue = currentRecord ? currentRecord.values[field.key] : undefined;
      if (existingValue !== undefined && existingValue !== null) {
        input.value = existingValue;
      }
      wrap.appendChild(input);

      const unit = document.createElement("span");
      unit.className = "field-unit";
      unit.textContent = field.unit;
      wrap.appendChild(unit);

      // 前回値のヒント（新規作成時のみ表示。タップで入力欄に反映）
      if (currentMode === "create") {
        const prevRecord = allRecords.find(
          (r) => r.values[field.key] !== undefined && r.values[field.key] !== null
        );
        if (prevRecord) {
          const hintBtn = document.createElement("button");
          hintBtn.type = "button";
          hintBtn.className = "prev-hint";
          hintBtn.textContent = "前回 " + formatValueForHint(field, prevRecord.values[field.key]);
          hintBtn.addEventListener("click", () => {
            input.value = prevRecord.values[field.key];
            input.focus();
          });
          wrap.appendChild(hintBtn);
        }
      }

      row.appendChild(wrap);
      card.appendChild(row);
    }
    fieldsContainer.appendChild(card);
  }
}

export async function openCreateForm(onSaved) {
  currentMode = "create";
  currentRecord = null;
  onSavedCallback = onSaved;
  titleEl.textContent = "記録する";
  deleteBtn.classList.add("hidden");
  measuredAtInput.value = toDatetimeLocalValue(new Date());
  await buildFields();
  show();
}

export async function openEditForm(record, onSaved) {
  currentMode = "edit";
  currentRecord = record;
  onSavedCallback = onSaved;
  titleEl.textContent = "記録を編集";
  deleteBtn.classList.remove("hidden");
  measuredAtInput.value = isoToDatetimeLocalValue(record.measuredAt);
  await buildFields();
  show();
}

function show() {
  overlay.classList.remove("hidden");
  window.scrollTo(0, 0);
}

function hide() {
  overlay.classList.add("hidden");
}

closeBtn.addEventListener("click", hide);

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const values = {};
  const inputs = fieldsContainer.querySelectorAll("input[type=number]");
  for (const input of inputs) {
    const raw = input.value.trim();
    if (raw === "") continue;
    const num = Number(raw);
    if (Number.isNaN(num)) continue;
    values[input.name] = num;
  }

  if (Object.keys(values).length === 0) {
    alert("少なくとも1つの項目を入力してください。");
    return;
  }

  const measuredAt = datetimeLocalToIso(measuredAtInput.value);

  if (currentMode === "create") {
    await addRecord(measuredAt, values);
  } else {
    await updateRecord(currentRecord.id, measuredAt, values);
  }

  hide();
  if (onSavedCallback) onSavedCallback();
});

deleteBtn.addEventListener("click", async () => {
  if (!currentRecord) return;
  const ok = confirm("この記録を削除します。よろしいですか？");
  if (!ok) return;
  await deleteRecord(currentRecord.id);
  hide();
  if (onSavedCallback) onSavedCallback();
});
