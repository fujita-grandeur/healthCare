// 日付ユーティリティ。ローカルタイムでの表示・input[type=datetime-local]変換を扱う。

function pad(n) {
  return String(n).padStart(2, "0");
}

// Date -> "YYYY-MM-DDTHH:mm"（datetime-local入力用、ローカルタイム）
export function toDatetimeLocalValue(date) {
  return (
    date.getFullYear() +
    "-" +
    pad(date.getMonth() + 1) +
    "-" +
    pad(date.getDate()) +
    "T" +
    pad(date.getHours()) +
    ":" +
    pad(date.getMinutes())
  );
}

// datetime-local の値 -> ISO文字列（ローカルタイムのオフセット付き）
export function datetimeLocalToIso(value) {
  // value: "YYYY-MM-DDTHH:mm"
  const d = new Date(value);
  return d.toISOString();
}

// ISO文字列 -> "YYYY-MM-DDTHH:mm"（datetime-local表示用）
export function isoToDatetimeLocalValue(iso) {
  const d = new Date(iso);
  return toDatetimeLocalValue(d);
}

// "YYYY-MM-DDTHH:mm" -> { date: "YYYY-MM-DD", time: "HH:mm" }
// iOSのdatetime-local入力は幅が広くなりすぎるため、日付/時刻を別々のinputに分けて表示する
export function splitDatetimeLocalValue(value) {
  const [date, time] = value.split("T");
  return { date, time };
}

// { date, time } -> "YYYY-MM-DDTHH:mm"
export function joinDateTimeValue(date, time) {
  return `${date}T${time}`;
}

// ISO文字列 -> "2026/08/13 07:30" 表示用
export function formatDateTime(iso) {
  const d = new Date(iso);
  return (
    d.getFullYear() +
    "/" +
    pad(d.getMonth() + 1) +
    "/" +
    pad(d.getDate()) +
    " " +
    pad(d.getHours()) +
    ":" +
    pad(d.getMinutes())
  );
}

// ISO文字列 -> "2026/08/13"
export function formatDate(iso) {
  const d = new Date(iso);
  return d.getFullYear() + "/" + pad(d.getMonth() + 1) + "/" + pad(d.getDate());
}

// ISO文字列 -> "07:30"
export function formatTime(iso) {
  const d = new Date(iso);
  return pad(d.getHours()) + ":" + pad(d.getMinutes());
}

// 今日かどうか（ローカルタイム基準）
export function isToday(iso) {
  const d = new Date(iso);
  const now = new Date();
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  );
}

// 現在から days 日前のISO文字列（開始境界として使用、00:00:00）
// 例: daysAgoIso(7) → 今日を含めて直近7日間の開始時刻
export function daysAgoIso(days) {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - days + 1);
  return d.toISOString();
}

// 今日の00:00:00のISO文字列
export function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

export function nowIso() {
  return new Date().toISOString();
}
