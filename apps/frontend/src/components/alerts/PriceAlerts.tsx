"use client";
import React, { useCallback, useContext, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Helmet } from "react-helmet";
import Header from "../dashboard/Header";
import Vheader from "../dashboard/Vheader";
import ThemeContext from "../../context/ThemeContext";
import { getAlerts, createAlert, deleteAlert } from "../../api/api";
import { formatInr } from "../../utils/format";

function PriceAlerts() {
  const { darkMode, toggleDarkMode } = useContext(ThemeContext);

  const [alerts, setAlerts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [symbol, setSymbol] = useState("");
  const [targetPrice, setTargetPrice] = useState("");
  const [direction, setDirection] = useState<"ABOVE" | "BELOW">("ABOVE");

  const fetchAlerts = useCallback(async () => {
    try {
      setIsLoading(true);
      setError("");
      const response = await getAlerts();
      setAlerts(response?.data || []);
    } catch (err: any) {
      setError(err.message || "Failed to load alerts.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAlerts();
  }, [fetchAlerts]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    const price = parseFloat(targetPrice);
    if (!symbol.trim() || !price || price <= 0) {
      toast.error("Enter a valid symbol and target price.");
      return;
    }

    try {
      setIsSubmitting(true);
      await createAlert(symbol.trim().toUpperCase(), price, direction);
      toast.success("Alert created.");
      setSymbol("");
      setTargetPrice("");
      await fetchAlerts();
    } catch (err: any) {
      toast.error(err.message || "Failed to create alert.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteAlert(id);
      toast.success("Alert deleted.");
      setAlerts((prev) => prev.filter((a) => a.id !== id));
    } catch (err: any) {
      toast.error(err.message || "Failed to delete alert.");
    }
  };

  const cardBg = darkMode ? "bg-gray-900" : "bg-gray-100";

  return (
    <>
      <Helmet>
        <title>Alerts</title>
      </Helmet>
      <div
        className={
          darkMode
            ? "bg-gray-800 text-white min-h-screen transition-all duration-300 font-pop"
            : "bg-white text-black min-h-screen transition-all duration-300 font-pop"
        }
      >
        <Header darkMode={darkMode} toggleDarkMode={toggleDarkMode} />
        <div className="flex flex-col md:flex-row">
          <Vheader darkMode={darkMode} />
          <main className="flex-1 pb-24 md:pb-0 p-6 m-2 md:m-10">
            <h1 className="text-2xl md:text-3xl font-bold">Price Alerts</h1>
            <div className="h-2 w-32 md:w-36 bg-blue-500 rounded-full mb-6 animate-line"></div>

            {/* Create alert form */}
            <form
              onSubmit={handleCreate}
              className={`p-6 rounded-xl shadow-lg mb-8 flex flex-col sm:flex-row gap-4 items-end ${cardBg}`}
            >
              <div className="flex-1 w-full">
                <label className="text-sm text-gray-400 mb-1 block">Symbol</label>
                <input
                  type="text"
                  value={symbol}
                  onChange={(e) => setSymbol(e.target.value)}
                  placeholder="e.g. AAPL or RELIANCE.NS"
                  className={`w-full px-4 py-2 rounded-md border ${
                    darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-300"
                  }`}
                />
              </div>
              <div className="w-full sm:w-40">
                <label className="text-sm text-gray-400 mb-1 block">Direction</label>
                <select
                  value={direction}
                  onChange={(e) => setDirection(e.target.value as "ABOVE" | "BELOW")}
                  className={`w-full px-4 py-2 rounded-md border ${
                    darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-300"
                  }`}
                >
                  <option value="ABOVE">Goes above</option>
                  <option value="BELOW">Goes below</option>
                </select>
              </div>
              <div className="w-full sm:w-40">
                <label className="text-sm text-gray-400 mb-1 block">Target Price (₹)</label>
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  value={targetPrice}
                  onChange={(e) => setTargetPrice(e.target.value)}
                  placeholder="0.00"
                  className={`w-full px-4 py-2 rounded-md border ${
                    darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-300"
                  }`}
                />
              </div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2 rounded-md bg-blue-500 text-white hover:bg-blue-600 disabled:opacity-50 w-full sm:w-auto"
              >
                {isSubmitting ? "Creating..." : "Create Alert"}
              </button>
            </form>

            {error && (
              <div className="mb-4 flex items-center gap-3">
                <p className="text-red-500">{error}</p>
                <button onClick={fetchAlerts} className="text-sm text-blue-500 underline">
                  Retry
                </button>
              </div>
            )}

            {isLoading ? (
              <p className="text-gray-400">Loading alerts...</p>
            ) : alerts.length === 0 ? (
              <p className="text-gray-400">No alerts yet - create one above to get notified by email.</p>
            ) : (
              <div className="space-y-3">
                {alerts.map((alert) => (
                  <div
                    key={alert.id}
                    className={`flex justify-between items-center p-4 rounded-lg shadow ${cardBg}`}
                  >
                    <div>
                      <p className="font-semibold">
                        {alert.symbol} {alert.direction === "ABOVE" ? "≥" : "≤"} {formatInr(alert.targetPrice)}
                      </p>
                      <p className="text-xs text-gray-400">
                        {alert.triggered
                          ? `Triggered ${new Date(alert.triggeredAt).toLocaleString("en-IN")}`
                          : `Created ${new Date(alert.createdAt).toLocaleString("en-IN")}`}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span
                        className={`text-xs px-2 py-1 rounded-full text-white ${
                          alert.triggered ? "bg-green-500" : "bg-yellow-500"
                        }`}
                      >
                        {alert.triggered ? "Triggered" : "Active"}
                      </span>
                      <button
                        onClick={() => handleDelete(alert.id)}
                        className="text-red-500 hover:text-red-400 text-sm underline"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </main>
        </div>
      </div>
    </>
  );
}

export default PriceAlerts;
