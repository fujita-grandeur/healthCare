// 依存なしのシンプルな折れ線グラフ描画。実測点のみを描画し、補間は行わない。

function niceStep(range) {
  if (range <= 0) return 1;
  const rough = range / 4;
  const mag = Math.pow(10, Math.floor(Math.log10(rough)));
  const norm = rough / mag;
  let step;
  if (norm < 1.5) step = 1;
  else if (norm < 3) step = 2;
  else if (norm < 7) step = 5;
  else step = 10;
  return step * mag;
}

function formatXLabel(ms) {
  const d = new Date(ms);
  return d.getFullYear() + "/" + String(d.getMonth() + 1).padStart(2, "0") + "/" + String(d.getDate()).padStart(2, "0");
}

/**
 * @param {HTMLCanvasElement} canvas
 * @param {{series: {label:string, color:string, points:{t:number, v:number}[]}[], decimals?: number}} opts
 */
export function drawChart(canvas, opts) {
  const { series, decimals = 1 } = opts;
  const cssWidth = canvas.parentElement.clientWidth;
  const cssHeight = Math.round(cssWidth * 0.62);
  const dpr = window.devicePixelRatio || 1;

  canvas.style.width = cssWidth + "px";
  canvas.style.height = cssHeight + "px";
  canvas.width = Math.round(cssWidth * dpr);
  canvas.height = Math.round(cssHeight * dpr);

  const ctx = canvas.getContext("2d");
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, cssWidth, cssHeight);

  const allPoints = series.flatMap((s) => s.points);

  const padding = { top: 14, right: 12, bottom: 26, left: 40 };
  const plotW = cssWidth - padding.left - padding.right;
  const plotH = cssHeight - padding.top - padding.bottom;

  ctx.font = "11px -apple-system, sans-serif";
  ctx.fillStyle = "#6b7c76";
  ctx.strokeStyle = "#dde5e2";

  if (allPoints.length === 0) {
    ctx.textAlign = "center";
    ctx.fillText("この期間の記録はありません", cssWidth / 2, cssHeight / 2);
    return;
  }

  let minV = Math.min(...allPoints.map((p) => p.v));
  let maxV = Math.max(...allPoints.map((p) => p.v));
  if (minV === maxV) {
    minV -= 1;
    maxV += 1;
  }
  const step = niceStep(maxV - minV);
  const yMin = Math.floor(minV / step) * step - step * 0.15;
  const yMax = Math.ceil(maxV / step) * step + step * 0.15;

  let minT = Math.min(...allPoints.map((p) => p.t));
  let maxT = Math.max(...allPoints.map((p) => p.t));
  if (minT === maxT) {
    const oneDay = 86400000;
    minT -= oneDay;
    maxT += oneDay;
  }

  function xOf(t) {
    return padding.left + ((t - minT) / (maxT - minT)) * plotW;
  }
  function yOf(v) {
    return padding.top + (1 - (v - yMin) / (yMax - yMin)) * plotH;
  }

  // 横グリッド線 + Yラベル
  const gridLines = 4;
  ctx.textAlign = "right";
  ctx.textBaseline = "middle";
  for (let i = 0; i <= gridLines; i++) {
    const v = yMin + ((yMax - yMin) * i) / gridLines;
    const y = yOf(v);
    ctx.beginPath();
    ctx.moveTo(padding.left, y);
    ctx.lineTo(cssWidth - padding.right, y);
    ctx.strokeStyle = "#e5eae7";
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.fillStyle = "#8a9a94";
    ctx.fillText(v.toFixed(decimals), padding.left - 6, y);
  }

  // X軸ラベル（開始・終了）
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  ctx.fillStyle = "#8a9a94";
  ctx.fillText(formatXLabel(minT), padding.left, cssHeight - padding.bottom + 8);
  ctx.textAlign = "right";
  ctx.fillText(formatXLabel(maxT), cssWidth - padding.right, cssHeight - padding.bottom + 8);

  // 各系列の描画
  for (const s of series) {
    if (s.points.length === 0) continue;
    const sorted = [...s.points].sort((a, b) => a.t - b.t);

    if (sorted.length > 1) {
      ctx.beginPath();
      sorted.forEach((p, i) => {
        const x = xOf(p.t);
        const y = yOf(p.v);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.strokeStyle = s.color;
      ctx.lineWidth = 2;
      ctx.lineJoin = "round";
      ctx.stroke();
    }

    for (const p of sorted) {
      const x = xOf(p.t);
      const y = yOf(p.v);
      ctx.beginPath();
      ctx.arc(x, y, sorted.length === 1 ? 4 : 3, 0, Math.PI * 2);
      ctx.fillStyle = s.color;
      ctx.fill();
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = "#ffffff";
      ctx.stroke();
    }
  }
}
