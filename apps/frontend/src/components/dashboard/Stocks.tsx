"use client";
import React, { useRef, useEffect } from 'react';
import { Chart, CategoryScale, LinearScale, LineElement, LineController, PointElement } from 'chart.js';

Chart.register(CategoryScale, LinearScale, LineElement, LineController, PointElement);

function Stocks({ shortName, fullName, stockPrices, labels, percentageChange, price, todayChange, darkMode  }: any) {
  const chartRef = useRef(null);
  const chartInstance = useRef(null);

  const isPositive = parseFloat(todayChange) >= 0;

  useEffect(() => {
    const ctx = chartRef.current.getContext('2d');

    if (chartInstance.current) {
      chartInstance.current.destroy();
    }

    // Fades to transparent instead of white so it reads correctly in dark mode too.
    const gradient = ctx.createLinearGradient(0, 0, 0, 400);
    gradient.addColorStop(0, isPositive ? '#22c55e' : '#ef4444');
    gradient.addColorStop(1, isPositive ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)');

    chartInstance.current = new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [
          {
            label: shortName,
            data: stockPrices,
            borderColor: gradient,
            backgroundColor: 'transparent',
            cubicInterpolationMode: 'monotone',
            borderWidth: 2,
            pointRadius: 0,
            showLine: true,
            hoverBorderWidth: 2,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false,
          },
          tooltip: {
            enabled: false,
          },
        },
        scales: {
          y: {
            beginAtZero: false,
            ticks: {
              display: false,
            },
            grid: {
              drawOnChartArea: false,
              display: false,
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
              display: false,
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
  }, [percentageChange, shortName, stockPrices, labels, todayChange]);

  const formattedTodayChange = todayChange && todayChange !== 'NA' ? `${todayChange}` : 'NA';
  const formattedPercentageChange = percentageChange && percentageChange !== 'NA' ? `${percentageChange}` : 'NA';

  return (
    <div className={`p-3 w-full flex flex-row sm:flex-row items-center rounded-lg shadow-md hover:shadow-lg mb-2 md:mb-4 ${darkMode ? 'bg-gray-800 text-white' : 'bg-white text-black'} transition-[background-color,box-shadow] duration-300`}>
      <div className="flex flex-col items-center w-full sm:w-1/3 mb-4 sm:mb-0">
        <div className="text-sm md:text-base font-semibold">{shortName}</div>

        <div
          className={`text-xs md:text-sm ${darkMode ?  'text-gray-200' : ' text-gray-600'} transition-colors duration-300 overflow-hidden whitespace-nowrap text-ellipsis`}
          title={fullName}
        >
          {fullName.length > 15 ? `${fullName.substring(0, 15)}...` : fullName}
        </div>
      </div>

      <div className="flex justify-center w-full sm:w-1/3 mb-4 sm:mb-0">
        <canvas ref={chartRef} className="max-w-16 max-h-8"></canvas>
      </div>

      <div className="flex flex-col items-center justify-end w-full sm:w-1/3">
        <div className="text-sm md:text-base font-medium tabular-nums">{price}</div>

        <div className={`text-xs md:text-sm tabular-nums ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
          {formattedTodayChange} ({formattedPercentageChange})
        </div>
      </div>
    </div>
  );
}

export default Stocks;
