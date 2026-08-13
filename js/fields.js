// 記録項目のメタデータ定義。
// 将来項目を追加する場合はここにグループ/フィールドを足すだけでよい設計。

export const FIELD_GROUPS = [
  {
    key: "daily",
    label: "日常の記録",
    description: "血圧・脈拍・体重",
    fields: [
      {
        key: "systolic",
        label: "最高血圧",
        unit: "mmHg",
        step: 1,
        min: 40,
        max: 300,
        decimals: 0,
      },
      {
        key: "diastolic",
        label: "最低血圧",
        unit: "mmHg",
        step: 1,
        min: 20,
        max: 200,
        decimals: 0,
      },
      {
        key: "pulse",
        label: "脈拍",
        unit: "bpm",
        step: 1,
        min: 20,
        max: 260,
        decimals: 0,
      },
      {
        key: "weight",
        label: "体重",
        unit: "kg",
        step: 0.1,
        min: 10,
        max: 300,
        decimals: 1,
      },
    ],
  },
  {
    key: "labs",
    label: "検査結果",
    description: "HbA1c・尿酸値（数ヶ月に1回程度）",
    fields: [
      {
        key: "hba1c",
        label: "HbA1c",
        unit: "%",
        step: 0.1,
        min: 3,
        max: 16,
        decimals: 1,
      },
      {
        key: "uricAcid",
        label: "尿酸値",
        unit: "mg/dL",
        step: 0.1,
        min: 1,
        max: 20,
        decimals: 1,
      },
    ],
  },
];

// 全フィールドをフラットに取得
export const ALL_FIELDS = FIELD_GROUPS.flatMap((g) => g.fields);

export function getField(key) {
  return ALL_FIELDS.find((f) => f.key === key);
}

// ダッシュボードでの「今日の記録」対象（毎日測定するもの）
export const DAILY_FIELD_KEYS = ["systolic", "diastolic", "pulse", "weight"];

// ダッシュボードでの「最新の検査結果」対象（数ヶ月に1回）
export const LAB_FIELD_KEYS = ["hba1c", "uricAcid"];

// グラフの項目定義（血圧はsystolic/diastolicをまとめて1グラフにする）
// 色はdataviz手法の検証済みカテゴリカル配色（slot3 aqua / slot2 orange、隣接ペアで検証済み）を使用。
const COLOR_PRIMARY = "#1baf7a"; // aqua（アプリのブランドカラーに近い）
const COLOR_SECONDARY = "#eb6834"; // orange（血圧の最低血圧など第2系列用）

export const CHART_ITEMS = [
  {
    key: "bloodPressure",
    label: "血圧",
    unit: "mmHg",
    decimals: 0,
    series: [
      { key: "systolic", label: "最高血圧", color: COLOR_PRIMARY },
      { key: "diastolic", label: "最低血圧", color: COLOR_SECONDARY },
    ],
    frequency: "frequent",
  },
  {
    key: "pulse",
    label: "脈拍",
    unit: "bpm",
    decimals: 0,
    series: [{ key: "pulse", label: "脈拍", color: COLOR_PRIMARY }],
    frequency: "frequent",
  },
  {
    key: "weight",
    label: "体重",
    unit: "kg",
    decimals: 1,
    series: [{ key: "weight", label: "体重", color: COLOR_PRIMARY }],
    frequency: "frequent",
  },
  {
    key: "hba1c",
    label: "HbA1c",
    unit: "%",
    decimals: 1,
    series: [{ key: "hba1c", label: "HbA1c", color: COLOR_PRIMARY }],
    frequency: "rare",
  },
  {
    key: "uricAcid",
    label: "尿酸値",
    unit: "mg/dL",
    decimals: 1,
    series: [{ key: "uricAcid", label: "尿酸値", color: COLOR_PRIMARY }],
    frequency: "rare",
  },
];

export const RANGE_OPTIONS_FREQUENT = [
  { key: "7d", label: "7日", days: 7 },
  { key: "30d", label: "30日", days: 30 },
  { key: "3m", label: "3ヶ月", days: 90 },
  { key: "1y", label: "1年", days: 365 },
  { key: "all", label: "全期間", days: null },
];

export const RANGE_OPTIONS_RARE = [
  { key: "6m", label: "6ヶ月", days: 182 },
  { key: "1y", label: "1年", days: 365 },
  { key: "3y", label: "3年", days: 1095 },
  { key: "all", label: "全期間", days: null },
];
