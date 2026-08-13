import { getAllRecords } from "../db.js";
import { CHART_ITEMS, RANGE_OPTIONS_FREQUENT, RANGE_OPTIONS_RARE } from "../fields.js";
import { drawChart } from "../utils/canvas-chart.js";

let selectedItemKey = CHART_ITEMS[0].key;
const selectedRangeByItem = {}; // itemKey -> rangeKey

function rangeOptionsFor(item) {
  return item.frequency === "frequent" ? RANGE_OPTIONS_FREQUENT : RANGE_OPTIONS_RARE;
}

function currentItem() {
  return CHART_ITEMS.find((i) => i.key === selectedItemKey);
}

function currentRangeKey(item) {
  if (!selectedRangeByItem[item.key]) {
    selectedRangeByItem[item.key] = rangeOptionsFor(item)[1].key; // デフォルト2番目（30日/1年など）
  }
  return selectedRangeByItem[item.key];
}

function renderItemTabs() {
  const wrap = document.getElementById("chart-item-tabs");
  wrap.innerHTML = "";
  for (const item of CHART_ITEMS) {
    const chip = document.createElement("button");
    chip.type = "button";
    chip.className = "chip" + (item.key === selectedItemKey ? " active" : "");
    chip.textContent = item.label;
    chip.addEventListener("click", () => {
      selectedItemKey = item.key;
      renderItemTabs();
      renderRangeTabs();
      renderChartBody();
    });
    wrap.appendChild(chip);
  }
}

function renderRangeTabs() {
  const item = currentItem();
  const options = rangeOptionsFor(item);
  const activeKey = currentRangeKey(item);
  const wrap = document.getElementById("chart-range-tabs");
  wrap.innerHTML = "";
  for (const opt of options) {
    const chip = document.createElement("button");
    chip.type = "button";
    chip.className = "chip" + (opt.key === activeKey ? " active" : "");
    chip.textContent = opt.label;
    chip.addEventListener("click", () => {
      selectedRangeByItem[item.key] = opt.key;
      renderRangeTabs();
      renderChartBody();
    });
    wrap.appendChild(chip);
  }
}

function filterByRange(records, days) {
  if (days === null) return records;
  const from = new Date();
  from.setHours(0, 0, 0, 0);
  from.setDate(from.getDate() - days + 1);
  const fromTime = from.getTime();
  return records.filter((r) => new Date(r.measuredAt).getTime() >= fromTime);
}

function computeStats(points, decimals) {
  if (points.length === 0) return null;
  const values = points.map((p) => p.v);
  const latest = points[points.length - 1].v;
  const max = Math.max(...values);
  const min = Math.min(...values);
  const avg = values.reduce((a, b) => a + b, 0) / values.length;
  return {
    latest: latest.toFixed(decimals),
    max: max.toFixed(decimals),
    min: min.toFixed(decimals),
    avg: avg.toFixed(decimals),
  };
}

async function renderChartBody() {
  const item = currentItem();
  const rangeKey = currentRangeKey(item);
  const options = rangeOptionsFor(item);
  const rangeOpt = options.find((o) => o.key === rangeKey);

  const allRecords = await getAllRecords(); // 降順
  const ascending = [...allRecords].reverse();
  const inRange = filterByRange(ascending, rangeOpt.days);

  const series = item.series.map((s) => ({
    label: s.label,
    color: s.color,
    points: inRange
      .filter((r) => r.values[s.key] !== undefined && r.values[s.key] !== null)
      .map((r) => ({ t: new Date(r.measuredAt).getTime(), v: r.values[s.key] })),
  }));

  const canvas = document.getElementById("chart-canvas");
  drawChart(canvas, { series, decimals: item.decimals });

  // 凡例：系列が2つ以上のときのみ表示
  const legendEl = document.getElementById("chart-legend");
  legendEl.innerHTML = "";
  if (item.series.length > 1) {
    for (const s of item.series) {
      const span = document.createElement("span");
      span.innerHTML = `<span class="legend-dot" style="background:${s.color}"></span>${s.label}`;
      legendEl.appendChild(span);
    }
  }

  // 統計サマリー：系列ごとに 最新/平均/最高/最低
  const statsEl = document.getElementById("chart-stats");
  statsEl.innerHTML = "";
  for (let i = 0; i < item.series.length; i++) {
    const s = item.series[i];
    const stats = computeStats(series[i].points, item.decimals);
    const label = item.series.length > 1 ? s.label + " 最新" : "最新";
    const box = document.createElement("div");
    box.className = "chart-stat";
    box.innerHTML = `
      <div class="stat-label">${label}</div>
      <div class="stat-value">${stats ? stats.latest : "-"}</div>
    `;
    statsEl.appendChild(box);
  }
}

export async function renderCharts() {
  renderItemTabs();
  renderRangeTabs();
  await renderChartBody();
}

export function refreshChartOnResize() {
  window.addEventListener("resize", () => {
    const view = document.getElementById("view-charts");
    if (view.classList.contains("active")) {
      renderChartBody();
    }
  });
}
