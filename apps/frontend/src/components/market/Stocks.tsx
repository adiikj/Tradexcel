"use client";
import React, { useRef, useEffect } from 'react';
import { Chart, CategoryScale, LinearScale, LineElement, LineController, PointElement, Tooltip, Filler } from 'chart.js';

Chart.register(CategoryScale, LinearScale, LineElement, LineController, PointElement, Tooltip, Filler);

function Stocks({ shortName, fullName, stockPrices, labels, percentageChange, price, todayChange, darkMode, ownedQuantity, onBuy, onSell }: any) {
  const chartRef = useRef(null);
  const chartInstance = useRef(null);

  const isPositive = parseFloat(todayChange) >= 0;

  const validPrices = (stockPrices || []).filter((p: number) => typeof p === 'number' && !Number.isNaN(p));
  const thirtyDayHigh = validPrices.length ? Math.max(...validPrices) : null;
  const thirtyDayLow = validPrices.length ? Math.min(...validPrices) : null;

  useEffect(() => {
    const ctx = chartRef.current.getContext('2d');

    if (chartInstance.current) {
      chartInstance.current.destroy();
    }

    const lineColor = isPositive ? '#22c55e' : '#ef4444';
    const gridColor = darkMode ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.06)';
    const axisTextColor = darkMode ? '#9ca3af' : '#6b7280';

    const gradientFill = ctx.createLinearGradient(0, 0, 0, 400);
    gradientFill.addColorStop(0, isPositive ? 'rgba(34, 197, 94, 0.25)' : 'rgba(239, 68, 68, 0.25)');
    gradientFill.addColorStop(1, isPositive ? 'rgba(34, 197, 94, 0)' : 'rgba(239, 68, 68, 0)');

    // Vanilla canvas draw for the price line instead of pulling in chartjs-plugin-annotation.
    const currentPriceNum = parseFloat(String(price).replace(/[^0-9.-]/g, ''));
    const currentPriceLine = {
      id: 'currentPriceLine',
      afterDraw(chart: any) {
        if (!Number.isFinite(currentPriceNum)) return;
        const { ctx: c, chartArea, scales } = chart;
        const y = scales.y.getPixelForValue(currentPriceNum);
        if (y < chartArea.top || y > chartArea.bottom) return;

        c.save();
        c.setLineDash([4, 4]);
        c.strokeStyle = darkMode ? 'rgba(255, 255, 255, 0.35)' : 'rgba(0, 0, 0, 0.35)';
        c.lineWidth = 1;
        c.beginPath();
        c.moveTo(chartArea.left, y);
        c.lineTo(chartArea.right, y);
        c.stroke();
        c.restore();
      },
    };

    chartInstance.current = new Chart(ctx, {
      plugins: [currentPriceLine],
      type: 'line', // Line chart to simulate stock price trend
      data: {
        labels: labels, // X-axis labels (days of the week)
        datasets: [
          {
            label: shortName, // Stock name (short form)
            data: stockPrices, // Stock price data
            borderColor: lineColor,
            backgroundColor: gradientFill, // Fades to transparent, not a solid block
            cubicInterpolationMode: 'monotone', // Smooth, natural curve without overshooting real values
            borderWidth: 2,
            pointRadius: 0, // Points only appear on hover, not on every day
            pointHoverRadius: 4,
            pointHoverBackgroundColor: lineColor,
            pointHoverBorderColor: darkMode ? '#111827' : '#ffffff',
            pointHoverBorderWidth: 2,
            fill: 'origin',
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false, // Hide legend
          },
          tooltip: {
            enabled: true, // Enable tooltips
            mode: 'nearest', // Display tooltip for the nearest point
            intersect: false, // Allow tooltip when hovering over the line
            displayColors: false, // No color swatch - only one series, it's redundant
            backgroundColor: darkMode ? '#1f2937' : '#ffffff',
            titleColor: darkMode ? '#9ca3af' : '#6b7280',
            bodyColor: darkMode ? '#ffffff' : '#111827',
            borderColor: darkMode ? '#374151' : '#e5e7eb',
            borderWidth: 1,
            padding: 10,
            cornerRadius: 8,
            bodyFont: { weight: 'bold' as const },
            callbacks: {
              label: function (tooltipItem: any) {
                return `₹${tooltipItem.raw.toFixed(2)}`; // Format tooltip value as currency
              },
            },
          },
        },
        scales: {
          y: {
            beginAtZero: false, // Don't start the Y-axis from 0 for a more realistic stock chart
            position: 'right',
            ticks: {
              display: true,
              maxTicksLimit: 5,
              color: axisTextColor,
              font: { size: 11 },
              callback: (value: any) => `₹${Number(value).toFixed(0)}`,
            },
            grid: {
              drawOnChartArea: true,
              display: true,
              color: gridColor,
            },
            border: {
              width: 0,
            },
          },
          x: {
            grid: {
              drawOnChartArea: false,
              display: false,
            },
            ticks: {
              display: true,
              autoSkip: true,
              maxTicksLimit: 6,
              color: axisTextColor,
              font: { size: 11 },
            },
            border: {
              width: 0,
            },
          },
        },
      },
    });

    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, [percentageChange, shortName, stockPrices, labels, darkMode, todayChange, price]);

  const formattedTodayChange = todayChange && todayChange !== 'NA' ? `${todayChange}` : 'NA';
  const formattedPercentageChange = percentageChange && percentageChange !== 'NA' ? `${percentageChange}` : 'NA';

  return (
    <div
      className={`rounded-2xl p-5 md:p-8 shadow-lg transition-colors duration-300 ${
        darkMode ? "bg-gray-900 text-white" : "bg-grey text-black"
      }`}
    >
      <div className="flex flex-col p-2 sm:p-4">
        <div className="flex items-center gap-2">
          <span
            className={`text-xs font-bold px-2 py-1 rounded-md tracking-wide ${
              darkMode ? "bg-blue-500/20 text-blue-400" : "bg-blue-100 text-blue-700"
            }`}
          >
            {shortName}
          </span>
        </div>
        <h1 className={`text-lg sm:text-xl mt-2 transition-colors duration-300 ${darkMode ? "text-white" : "text-black"}`}>{fullName}</h1>
        <div className="h-1 w-44 bg-blue-500 rounded-full animate-line"></div>
        <div className="flex flex-col sm:flex-row sm:gap-3 mt-3">
          <p className={`tabular-nums text-2xl sm:text-3xl mt-1 md:mt-3 transition-colors duration-300 ${darkMode ? "text-white" : "text-black"}`}> {price}</p>
          <p className={`tabular-nums ${isPositive ? (darkMode ? "text-green-400 mt-0 md:mt-6" : "text-green-500 mt-2 md:mt-6") : (darkMode ? "text-red-400 mt-0 md:mt-6" : "text-red-500 mt-0 md:mt-6")}`}>
            {formattedTodayChange} ({formattedPercentageChange})
          </p>
        </div>

        {(thirtyDayHigh !== null || thirtyDayLow !== null || ownedQuantity > 0) && (
          <div className={`flex flex-wrap items-center gap-x-6 gap-y-1 mt-3 pt-3 border-t ${darkMode ? "border-gray-700" : "border-gray-300"}`}>
            {thirtyDayHigh !== null && (
              <div className="flex items-baseline gap-1.5">
                <span className="text-xs uppercase tracking-wide text-gray-400">30D High</span>
                <span className="tabular-nums text-sm font-semibold">₹{thirtyDayHigh?.toFixed(2)}</span>
              </div>
            )}
            {thirtyDayLow !== null && (
              <div className="flex items-baseline gap-1.5">
                <span className="text-xs uppercase tracking-wide text-gray-400">30D Low</span>
                <span className="tabular-nums text-sm font-semibold">₹{thirtyDayLow?.toFixed(2)}</span>
              </div>
            )}
            {ownedQuantity > 0 && (
              <div className="flex items-baseline gap-1.5">
                <span className="text-xs uppercase tracking-wide text-gray-400">You own</span>
                <span className="tabular-nums text-sm font-semibold">{ownedQuantity} shares</span>
              </div>
            )}
          </div>
        )}

        {(onBuy || onSell) && (
          <div className="flex flex-row gap-2 mt-4">
            <button
              className={`${
                darkMode ? "bg-green-600 hover:bg-green-500" : "bg-green-500 hover:bg-green-400"
              } text-white px-7 py-2 rounded transition-colors duration-200 active:scale-95 flex-1 sm:flex-none`}
              onClick={onBuy}
            >
              Buy
            </button>
            <button
              className={`${
                darkMode ? "bg-red-600 hover:bg-red-500" : "bg-red-500 hover:bg-red-400"
              } text-white px-7 py-2 rounded transition-colors duration-200 active:scale-95 flex-1 sm:flex-none disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-red-600`}
              onClick={onSell}
              disabled={!ownedQuantity}
            >
              Sell
            </button>
          </div>
        )}
      </div>
      <div
        className={`flex justify-center w-full h-full mt-4 rounded-xl p-2 md:p-4 ${
          darkMode ? "bg-gray-800" : "bg-white"
        }`}
      >
        <canvas ref={chartRef} className="w-full h-72 sm:h-96 lg:h-[400px]"></canvas>
      </div>
    </div>
  );
}

export default Stocks;
