"use client";
import { useEffect, useRef } from "react";
import {
  AreaSeries,
  CandlestickSeries,
  ColorType,
  CrosshairMode,
  HistogramSeries,
  LineStyle,
  createChart,
  type AutoscaleInfo,
  type IChartApi,
  type ISeriesApi,
  type MouseEventParams,
  type UTCTimestamp,
} from "lightweight-charts";
import type { Candle, ChartRange } from "@tradexcel/shared";
import { useTheme } from "../../context/ThemeContext";
import { CHART_COLORS } from "./marketColors";

export type ChartMode = "area" | "candles";

type PriceChartProps = {
  candles: Candle[];
  range: ChartRange;
  mode: ChartMode;
  // Seconds east of UTC; lightweight-charts labels in UTC, so bars are shifted
  // to read in exchange time (IST).
  gmtOffset: number;
  previousClose: number | null;
  // The bar under the crosshair, or null when the pointer leaves the chart.
  onHover: (candle: Candle | null) => void;
};

const INTRADAY: ChartRange[] = ["1D", "5D"];

// Price (area or candles) in the main pane, volume in its own pane below -
// two panes with their own scales, never a second y-axis on the price plot.
export default function PriceChart({ candles, range, mode, gmtOffset, previousClose, onHover }: PriceChartProps) {
  const { darkMode } = useTheme();
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const onHoverRef = useRef(onHover);

  useEffect(() => {
    onHoverRef.current = onHover;
  }, [onHover]);

  // Create once; later effects only swap series and options.
  useEffect(() => {
    if (!containerRef.current) return;
    const chart = createChart(containerRef.current, {
      autoSize: true,
      layout: { attributionLogo: false, fontFamily: "Poppins, system-ui, sans-serif", fontSize: 11 },
      crosshair: { mode: CrosshairMode.Magnet },
      rightPriceScale: { borderVisible: false },
      timeScale: { borderVisible: false, fixLeftEdge: true, fixRightEdge: true },
      handleScale: { axisPressedMouseMove: false },
    });
    chartRef.current = chart;
    return () => {
      chart.remove();
      chartRef.current = null;
    };
  }, []);

  useEffect(() => {
    const chart = chartRef.current;
    if (!chart) return;
    const c = darkMode ? CHART_COLORS.dark : CHART_COLORS.light;
    chart.applyOptions({
      layout: {
        background: { type: ColorType.Solid, color: c.surface },
        textColor: c.muted,
        panes: { separatorColor: c.border, separatorHoverColor: c.border },
      },
      grid: { vertLines: { visible: false }, horzLines: { color: c.grid } },
      crosshair: {
        vertLine: { color: c.reference, labelBackgroundColor: c.text },
        horzLine: { color: c.reference, labelBackgroundColor: c.text },
      },
      timeScale: { timeVisible: INTRADAY.includes(range), secondsVisible: false },
    });
  }, [darkMode, range]);

  useEffect(() => {
    const chart = chartRef.current;
    if (!chart || candles.length === 0) return;
    const c = darkMode ? CHART_COLORS.dark : CHART_COLORS.light;

    const shift = (time: number) => (time + gmtOffset) as UTCTimestamp;
    const first = candles[0];
    const last = candles[candles.length - 1];
    const baseline = previousClose ?? first.open;
    const lineColor = last.close >= baseline ? c.up : c.down;

    // Stretch the price scale to include the reference line, so it's never off-screen.
    const autoscaleInfoProvider = (original: () => AutoscaleInfo | null) => {
      const res = original();
      if (!res?.priceRange || previousClose == null) return res;
      return {
        ...res,
        priceRange: {
          minValue: Math.min(res.priceRange.minValue, previousClose),
          maxValue: Math.max(res.priceRange.maxValue, previousClose),
        },
      };
    };

    let price: ISeriesApi<"Area"> | ISeriesApi<"Candlestick">;
    if (mode === "area") {
      const area = chart.addSeries(AreaSeries, {
        lineColor,
        lineWidth: 2,
        topColor: `${lineColor}33`,
        bottomColor: `${lineColor}00`,
        priceLineVisible: false,
        lastValueVisible: true,
        autoscaleInfoProvider,
      });
      area.setData(candles.map((k) => ({ time: shift(k.time), value: k.close })));
      price = area;
    } else {
      const bars = chart.addSeries(CandlestickSeries, {
        upColor: c.up,
        downColor: c.down,
        wickUpColor: c.up,
        wickDownColor: c.down,
        borderVisible: false,
        priceLineVisible: false,
        autoscaleInfoProvider,
      });
      bars.setData(candles.map((k) => ({ time: shift(k.time), open: k.open, high: k.high, low: k.low, close: k.close })));
      price = bars;
    }

    if (previousClose != null) {
      price.createPriceLine({
        price: previousClose,
        color: c.reference,
        lineWidth: 1,
        lineStyle: LineStyle.Solid,
        axisLabelVisible: true,
        title: "Prev close",
      });
    }

    const volume = chart.addSeries(
      HistogramSeries,
      { priceFormat: { type: "volume" }, priceLineVisible: false, lastValueVisible: false },
      1
    );
    volume.setData(
      candles.map((k) => ({
        time: shift(k.time),
        value: k.volume,
        color: `${k.close >= k.open ? c.up : c.down}99`,
      }))
    );
    // Series swaps recreate the volume pane at default size - pin both every time
    // (price 4 : volume 1).
    const [pricePane, volumePane] = chart.panes();
    pricePane?.setStretchFactor(4);
    volumePane?.setStretchFactor(1);
    chart.timeScale().fitContent();

    const byTime = new Map(candles.map((k) => [shift(k.time) as number, k]));
    const handleMove = (param: MouseEventParams) => {
      onHoverRef.current(param.time != null ? (byTime.get(param.time as number) ?? null) : null);
    };
    chart.subscribeCrosshairMove(handleMove);

    return () => {
      // On unmount React runs the create effect's cleanup first, which has
      // already destroyed this chart (chartRef is then null) - nothing to remove.
      if (chartRef.current !== chart) return;
      chart.unsubscribeCrosshairMove(handleMove);
      chart.removeSeries(price);
      chart.removeSeries(volume);
    };
  }, [candles, mode, gmtOffset, previousClose, darkMode]);

  return <div ref={containerRef} className="h-[380px] md:h-[440px] w-full" aria-hidden="true" />;
}
