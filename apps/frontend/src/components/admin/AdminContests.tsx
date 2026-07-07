"use client";
import React, { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Helmet } from "react-helmet";
import { adminCreateContest, adminUpdateContest, adminUploadContestImage, adminGetContests } from "../../api/adminApi";
import wordmark from "../../assets/tradexcel-wordmark-dark.png";
import rawStockList from "../market/StockData.json";

const STATUS_STYLES: Record<string, string> = {
  UPCOMING: "bg-yellow-500",
  LIVE: "bg-green-500",
  ENDED: "bg-gray-500",
};

// StockData.json has a few duplicate entries; dedupe by symbol.
const STOCK_UNIVERSE = Array.from(
  new Map((rawStockList as { shortName: string; fullName: string; symbol: string }[]).map((s) => [s.symbol, s])).values()
);

// Sector groupings so an admin can build a contest universe without typing exact tickers.
const SYMBOL_GROUPS: Record<string, string[]> = {
  Banking: [
    "HDFCBANK.NS", "ICICIBANK.NS", "SBIN.NS", "AXISBANK.NS", "KOTAKBANK.NS", "PNB.NS", "BANKBARODA.NS", "CANBK.NS",
    "INDUSINDBK.NS", "FEDERALBNK.NS", "IDFCFIRSTB.NS", "BANDHANBNK.NS", "RBLBANK.NS", "AUBANK.NS", "YESBANK.NS",
    "UNIONBANK.NS", "BANKINDIA.NS", "INDIANB.NS", "UCOBANK.NS", "MAHABANK.NS", "IOB.NS", "SOUTHBANK.NS",
    "KARURVYSYA.NS", "CUB.NS", "DCBBANK.NS",
  ],
  "NBFC & Insurance": [
    "BAJFINANCE.NS", "BAJAJFINSV.NS", "HDFCLIFE.NS", "SBILIFE.NS", "ICICIPRULI.NS", "ICICIGI.NS", "SHRIRAMFIN.NS",
    "CHOLAFIN.NS", "MUTHOOTFIN.NS", "MANAPPURAM.NS", "LICHSGFIN.NS", "PFC.NS", "RECLTD.NS", "IRFC.NS",
    "PNBHOUSING.NS", "SBICARD.NS", "HDFCAMC.NS", "ANGELONE.NS", "CDSL.NS", "BSE.NS", "MCX.NS", "IEX.NS", "CAMS.NS",
    "LTF.NS", "M&MFIN.NS", "IIFL.NS",
  ],
  IT: [
    "TCS.NS", "WIPRO.NS", "HCLTECH.NS", "INFY.NS", "TECHM.NS", "MPHASIS.NS", "PERSISTENT.NS", "COFORGE.NS",
    "LTTS.NS", "OFSS.NS", "KPITTECH.NS", "CYIENT.NS", "TATAELXSI.NS", "ZENSARTECH.NS", "NEWGEN.NS",
  ],
  Auto: [
    "MARUTI.NS", "M&M.NS", "HEROMOTOCO.NS", "EICHERMOT.NS", "TVSMOTOR.NS", "ASHOKLEY.NS", "ESCORTS.NS",
    "BALKRISIND.NS", "MRF.NS", "APOLLOTYRE.NS", "CEATLTD.NS", "BOSCHLTD.NS", "MOTHERSON.NS", "BHARATFORG.NS",
    "EXIDEIND.NS",
  ],
  "Pharma & Healthcare": [
    "SUNPHARMA.NS", "TORNTPHARM.NS", "DRREDDY.NS", "CIPLA.NS", "DIVISLAB.NS", "LUPIN.NS", "AUROPHARMA.NS",
    "ALKEM.NS", "BIOCON.NS", "ZYDUSLIFE.NS", "GLENMARK.NS", "IPCALAB.NS", "ABBOTINDIA.NS", "LAURUSLABS.NS",
    "GRANULES.NS", "NATCOPHARM.NS", "JBCHEPHARM.NS", "GLAND.NS", "SYNGENE.NS", "APOLLOHOSP.NS", "FORTIS.NS",
    "MAXHEALTH.NS", "LALPATHLAB.NS", "METROPOLIS.NS",
  ],
  FMCG: [
    "ITC.NS", "HINDUNILVR.NS", "NESTLEIND.NS", "BRITANNIA.NS", "DABUR.NS", "MARICO.NS", "GODREJCP.NS", "COLPAL.NS",
    "TATACONSUM.NS", "UBL.NS", "VBL.NS", "EMAMILTD.NS", "PGHH.NS", "GILLETTE.NS",
  ],
  "Energy & Power": [
    "RELIANCE.NS", "GAIL.NS", "BPCL.NS", "ADANIPOWER.NS", "ADANIGREEN.NS", "JSWENERGY.NS", "POWERGRID.NS",
    "ONGC.NS", "IOC.NS", "HINDPETRO.NS", "OIL.NS", "PETRONET.NS", "IGL.NS", "MGL.NS", "ATGL.NS", "NTPC.NS",
    "TATAPOWER.NS", "NHPC.NS", "SJVN.NS", "TORNTPOWER.NS", "CESC.NS", "SUZLON.NS", "COALINDIA.NS", "ADANIENT.NS",
  ],
  "Metals & Mining": [
    "HINDALCO.NS", "TATASTEEL.NS", "JSWSTEEL.NS", "VEDL.NS", "JINDALSTEL.NS", "SAIL.NS", "NMDC.NS",
    "NATIONALUM.NS", "HINDCOPPER.NS", "MOIL.NS", "APLAPOLLO.NS", "RATNAMANI.NS",
  ],
  Cement: ["ULTRACEMCO.NS", "SHREECEM.NS", "AMBUJACEM.NS", "ACC.NS", "DALBHARAT.NS", "JKCEMENT.NS", "RAMCOCEM.NS"],
  "Infra & Capital Goods": [
    "BHEL.NS", "SIEMENS.NS", "BEL.NS", "LT.NS", "ABB.NS", "CUMMINSIND.NS", "HAL.NS", "BDL.NS", "MAZDOCK.NS",
    "COCHINSHIP.NS", "IRCON.NS", "RVNL.NS", "CONCOR.NS", "ADANIPORTS.NS", "IRB.NS", "NBCC.NS", "NCC.NS", "KEC.NS",
    "THERMAX.NS", "POLYCAB.NS", "HAVELLS.NS", "VOLTAS.NS", "BLUESTARCO.NS", "DIXON.NS", "AMBER.NS", "CROMPTON.NS",
    "WHIRLPOOL.NS", "CGPOWER.NS", "KAYNES.NS", "ASTRAL.NS", "SUPREMEIND.NS", "FINCABLES.NS", "CENTURYPLY.NS",
    "KEI.NS",
  ],
  Telecom: ["BHARTIARTL.NS", "IDEA.NS", "INDUSTOWER.NS", "TATACOMM.NS", "HFCL.NS"],
  "Retail & Consumer": [
    "TITAN.NS", "DMART.NS", "TRENT.NS", "ABFRL.NS", "PAGEIND.NS", "RELAXO.NS", "BATAINDIA.NS", "VMART.NS",
    "SHOPERSTOP.NS", "NYKAA.NS", "PAYTM.NS", "POLICYBZR.NS", "IRCTC.NS", "DELHIVERY.NS",
  ],
  Media: ["ZEEL.NS", "SUNTV.NS", "PVRINOX.NS", "NAZARA.NS", "SAREGAMA.NS"],
  "Real Estate": [
    "DLF.NS", "GODREJPROP.NS", "OBEROIRLTY.NS", "PRESTIGE.NS", "PHOENIXLTD.NS", "BRIGADE.NS", "SOBHA.NS", "LODHA.NS",
  ],
  "Chemicals & Agri": [
    "UPL.NS", "PIDILITIND.NS", "SRF.NS", "AARTIIND.NS", "DEEPAKNTR.NS", "NAVINFLUOR.NS", "TATACHEM.NS", "GNFC.NS",
    "CHAMBLFERT.NS", "COROMANDEL.NS", "PIIND.NS", "CLEAN.NS", "FLUOROCHEM.NS", "BALRAMCHIN.NS", "EIDPARRY.NS",
  ],
  "Diversified & Paints": [
    "GRASIM.NS", "GODREJIND.NS", "BAJAJHLDNG.NS", "3MINDIA.NS", "HONAUT.NS", "ASIANPAINT.NS", "BERGEPAINT.NS",
    "KANSAINER.NS", "TRIDENT.NS", "RAYMOND.NS", "WELCORP.NS",
  ],
  "Aviation & Logistics": ["INDIGO.NS", "BLUEDART.NS", "TCI.NS", "VRLLOG.NS"],
  "Adani Group": ["ADANIPORTS.NS", "ADANIGREEN.NS", "ADANIPOWER.NS", "ADANIENT.NS", "ATGL.NS"],
};

function toLocalInputValue(date: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(
    date.getHours()
  )}:${pad(date.getMinutes())}`;
}

function AdminContests() {
  const router = useRouter();
  const [contests, setContests] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [name, setName] = useState("");
  const [startAt, setStartAt] = useState("");
  const [endAt, setEndAt] = useState("");
  const [startingBalance, setStartingBalance] = useState("");
  const [selectedSymbols, setSelectedSymbols] = useState<string[]>([]);
  const [symbolFilter, setSymbolFilter] = useState("");
  const [prize, setPrize] = useState("");
  const [historicalStartDate, setHistoricalStartDate] = useState("");

  const [editingContestId, setEditingContestId] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);

  const resetForm = () => {
    setEditingContestId(null);
    setName("");
    setStartingBalance("");
    setSelectedSymbols([]);
    setSymbolFilter("");
    setPrize("");
    setHistoricalStartDate("");
    setImageFile(null);
    setImagePreviewUrl(null);
    const now = new Date();
    setStartAt(toLocalInputValue(new Date(now.getTime() + 60 * 60 * 1000)));
    setEndAt(toLocalInputValue(new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)));
  };

  const startEdit = (contest: any) => {
    setEditingContestId(contest.id);
    setName(contest.name);
    setStartAt(toLocalInputValue(new Date(contest.startAt)));
    setEndAt(toLocalInputValue(new Date(contest.endAt)));
    setStartingBalance(contest.startingBalance ? String(contest.startingBalance) : "");
    setSelectedSymbols(contest.symbols || []);
    setSymbolFilter("");
    setPrize(contest.prize || "");
    setHistoricalStartDate("");
    setImageFile(null);
    setImagePreviewUrl(contest.imageUrl || null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setImageFile(file);
    setImagePreviewUrl(file ? URL.createObjectURL(file) : null);
  };

  const toggleSymbol = (symbol: string) => {
    setSelectedSymbols((prev) =>
      prev.includes(symbol) ? prev.filter((s) => s !== symbol) : [...prev, symbol]
    );
  };

  const toggleGroup = (groupSymbols: string[]) => {
    setSelectedSymbols((prev) => {
      const allSelected = groupSymbols.every((s) => prev.includes(s));
      return allSelected
        ? prev.filter((s) => !groupSymbols.includes(s))
        : [...new Set([...prev, ...groupSymbols])];
    });
  };

  const filteredUniverse = STOCK_UNIVERSE.filter((stock) => {
    const q = symbolFilter.trim().toLowerCase();
    if (!q) return true;
    return stock.shortName.toLowerCase().includes(q) || stock.fullName.toLowerCase().includes(q) || stock.symbol.toLowerCase().includes(q);
  });

  const fetchContests = useCallback(async () => {
    try {
      setIsLoading(true);
      setError("");
      const response = await adminGetContests();
      setContests(response?.data || []);
    } catch (err: any) {
      setError(err.message || "Failed to load contests.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    resetForm();
    fetchContests();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchContests]);

  const handleLogout = () => {
    localStorage.removeItem("adminToken");
    router.push("/admin/login");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    if (selectedSymbols.length === 0) {
      toast.error("Select at least one stock symbol");
      return;
    }
    try {
      setIsSubmitting(true);
      let contestId = editingContestId;

      if (editingContestId) {
        await adminUpdateContest(editingContestId, {
          name,
          startAt: new Date(startAt).toISOString(),
          endAt: new Date(endAt).toISOString(),
          startingBalance: startingBalance ? Number(startingBalance) : undefined,
          symbols: selectedSymbols,
          prize: prize || undefined,
        });
      } else {
        const response = await adminCreateContest({
          name,
          startAt: new Date(startAt).toISOString(),
          endAt: new Date(endAt).toISOString(),
          startingBalance: startingBalance ? Number(startingBalance) : undefined,
          symbols: selectedSymbols,
          prize: prize || undefined,
          historicalStartDate: historicalStartDate || undefined,
        });
        contestId = response?.data?.id;
      }

      if (imageFile && contestId) {
        await adminUploadContestImage(contestId, imageFile);
      }

      toast.success(editingContestId ? "Contest updated" : "Contest created");
      resetForm();
      await fetchContests();
    } catch (err: any) {
      toast.error(err.message || (editingContestId ? "Failed to update contest" : "Failed to create contest"));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>Admin - Contests</title>
      </Helmet>
      <div className="bg-gray-900 text-white min-h-screen font-pop">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-700">
          <div className="flex items-center gap-2">
            <img className="h-5 w-auto" src={((wordmark)?.src || (wordmark)) as string} alt="Tradexcel" />
            <span className="text-sm text-gray-400">Admin</span>
          </div>
          <button onClick={handleLogout} className="text-sm text-gray-400 hover:text-white underline">
            Log out
          </button>
        </div>

        <main className="p-6 md:p-10 max-w-5xl mx-auto">
          <section className="mb-10 bg-gray-800 border border-gray-700 rounded-2xl p-6 shadow-lg">
            <h2 className="text-base font-semibold mb-4">
              {editingContestId ? `Edit contest - ${name}` : "Create a contest"}
            </h2>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="text-gray-300 text-sm mb-1 block">Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="bg-gray-900 border border-gray-600 w-full text-sm px-3 py-2 rounded-md outline-blue-500"
                  placeholder="Weekly Sprint #4"
                  required
                  maxLength={100}
                />
              </div>

              <div>
                <label className="text-gray-300 text-sm mb-1 block">Starts at</label>
                <input
                  type="datetime-local"
                  value={startAt}
                  onChange={(e) => setStartAt(e.target.value)}
                  className="bg-gray-900 border border-gray-600 w-full text-sm px-3 py-2 rounded-md outline-blue-500"
                  required
                />
              </div>

              <div>
                <label className="text-gray-300 text-sm mb-1 block">Ends at</label>
                <input
                  type="datetime-local"
                  value={endAt}
                  onChange={(e) => setEndAt(e.target.value)}
                  className="bg-gray-900 border border-gray-600 w-full text-sm px-3 py-2 rounded-md outline-blue-500"
                  required
                />
              </div>

              <div>
                <label className="text-gray-300 text-sm mb-1 block">Starting balance (optional)</label>
                <input
                  type="number"
                  min="1"
                  step="any"
                  value={startingBalance}
                  onChange={(e) => setStartingBalance(e.target.value)}
                  className="bg-gray-900 border border-gray-600 w-full text-sm px-3 py-2 rounded-md outline-blue-500"
                  placeholder="Defaults to standard wallet balance"
                />
              </div>

              <div className="md:col-span-2">
                <div className="flex items-center justify-between mb-1">
                  <label className="text-gray-300 text-sm block">Stock universe</label>
                  <span className="text-xs text-gray-500">{selectedSymbols.length} selected</span>
                </div>

                <div className="flex flex-wrap gap-1.5 mb-2">
                  {Object.entries(SYMBOL_GROUPS).map(([label, groupSymbols]) => {
                    const allSelected = groupSymbols.every((s) => selectedSymbols.includes(s));
                    return (
                      <button
                        key={label}
                        type="button"
                        onClick={() => toggleGroup(groupSymbols)}
                        className={`px-2.5 py-1 text-xs rounded-full transition-colors duration-150 active:scale-95 ${
                          allSelected
                            ? "bg-blue-500 text-white"
                            : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                        }`}
                      >
                        {label}
                      </button>
                    );
                  })}
                  {selectedSymbols.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setSelectedSymbols([])}
                      className="px-2.5 py-1 text-xs rounded-full bg-gray-700 text-gray-400 hover:bg-gray-600"
                    >
                      Clear
                    </button>
                  )}
                </div>

                <input
                  type="text"
                  value={symbolFilter}
                  onChange={(e) => setSymbolFilter(e.target.value)}
                  className="bg-gray-900 border border-gray-600 w-full text-sm px-3 py-2 rounded-md outline-blue-500 mb-2"
                  placeholder="Filter by name or symbol..."
                />

                <div className="border border-gray-600 rounded-md max-h-56 overflow-y-auto">
                  {filteredUniverse.length === 0 ? (
                    <p className="text-xs text-gray-500 p-3">No matching symbols.</p>
                  ) : (
                    filteredUniverse.map((stock) => (
                      <label
                        key={stock.symbol}
                        className="flex items-center gap-2 px-3 py-1.5 text-sm hover:bg-gray-700 cursor-pointer border-b border-gray-700 last:border-b-0"
                      >
                        <input
                          type="checkbox"
                          checked={selectedSymbols.includes(stock.symbol)}
                          onChange={() => toggleSymbol(stock.symbol)}
                          className="accent-blue-500"
                        />
                        <span className="font-medium">{stock.shortName}</span>
                        <span className="text-gray-500 truncate">{stock.fullName}</span>
                      </label>
                    ))
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-1">Only these symbols can be traded inside this contest.</p>
              </div>

              <div>
                <label className="text-gray-300 text-sm mb-1 block">Prize (optional)</label>
                <input
                  type="text"
                  value={prize}
                  onChange={(e) => setPrize(e.target.value)}
                  className="bg-gray-900 border border-gray-600 w-full text-sm px-3 py-2 rounded-md outline-blue-500"
                  placeholder="Bragging rights"
                  maxLength={200}
                />
              </div>

              <div className="md:col-span-2">
                <label className="text-gray-300 text-sm mb-1 block">Cover image (optional)</label>
                <div className="flex items-center gap-3">
                  {imagePreviewUrl && (
                    <img
                      src={imagePreviewUrl}
                      alt=""
                      className="w-16 h-16 rounded-lg object-cover border border-gray-600 shrink-0"
                    />
                  )}
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    onChange={handleImageChange}
                    className="text-sm text-gray-300 file:mr-3 file:px-3 file:py-1.5 file:rounded-md file:border-0 file:bg-gray-700 file:text-white file:text-xs file:cursor-pointer hover:file:bg-gray-600"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Shown as a banner on the contest card and detail page.
                </p>
              </div>

              {!editingContestId && (
                <div className="md:col-span-2">
                  <label className="text-gray-300 text-sm mb-1 block">
                    Historical replay start date (optional)
                  </label>
                  <input
                    type="date"
                    value={historicalStartDate}
                    onChange={(e) => setHistoricalStartDate(e.target.value)}
                    className="bg-gray-900 border border-gray-600 w-full text-sm px-3 py-2 rounded-md outline-blue-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Leave blank for a normal live-price contest. Set this to replay a past event - the
                    contest's real duration will step through that many historical trading days starting here.
                    Can't be changed once a contest is created.
                  </p>
                </div>
              )}

              <div className="md:col-span-2 flex items-center gap-3">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 text-sm rounded-md font-semibold bg-blue-500 hover:bg-blue-600 disabled:opacity-50"
                >
                  {isSubmitting ? "Saving..." : editingContestId ? "Save changes" : "Create contest"}
                </button>
                {editingContestId && (
                  <button
                    type="button"
                    onClick={resetForm}
                    className="px-5 py-2 text-sm rounded-md font-semibold bg-gray-700 hover:bg-gray-600"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </section>

          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold">Existing contests</h2>
              <button onClick={fetchContests} className="text-sm text-blue-400 underline">
                Refresh
              </button>
            </div>

            {error && <p className="text-red-500 text-sm mb-3">{error}</p>}

            {isLoading ? (
              <p className="text-gray-400 text-sm">Loading contests...</p>
            ) : contests.length === 0 ? (
              <p className="text-gray-400 text-sm">No contests yet - create one above.</p>
            ) : (
              <div className="overflow-x-auto border border-gray-700 rounded-xl">
                <table className="w-full text-left border-collapse text-sm">
                  <thead className="bg-gray-800">
                    <tr>
                      <th className="p-3"></th>
                      <th className="p-3">Name</th>
                      <th className="p-3">Status</th>
                      <th className="p-3">Starts</th>
                      <th className="p-3">Ends</th>
                      <th className="p-3">Participants</th>
                      <th className="p-3">Universe</th>
                      <th className="p-3">Prize</th>
                      <th className="p-3">Replay</th>
                      <th className="p-3"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {contests.map((contest) => (
                      <tr key={contest.id} className="border-t border-gray-700">
                        <td className="p-3">
                          {contest.imageUrl ? (
                            <img
                              src={contest.imageUrl}
                              alt=""
                              className="w-10 h-10 rounded-lg object-cover border border-gray-700"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-lg bg-gray-800 border border-gray-700" />
                          )}
                        </td>
                        <td className="p-3 font-medium">{contest.name}</td>
                        <td className="p-3">
                          <span
                            className={`text-xs px-2 py-1 rounded-full text-white ${STATUS_STYLES[contest.status]}`}
                          >
                            {contest.status}
                          </span>
                        </td>
                        <td className="p-3 text-gray-400">{new Date(contest.startAt).toLocaleString()}</td>
                        <td className="p-3 text-gray-400">{new Date(contest.endAt).toLocaleString()}</td>
                        <td className="p-3 text-gray-400">{contest._count?.entries ?? 0}</td>
                        <td className="p-3 text-gray-400">{(contest.symbols || []).join(", ") || "-"}</td>
                        <td className="p-3 text-gray-400">{contest.prize || "-"}</td>
                        <td className="p-3 text-gray-400">
                          {contest.historicalStartDate ? (
                            <span className="text-xs px-2 py-1 rounded-full bg-purple-600 text-white">
                              📼 {new Date(contest.historicalStartDate).toLocaleDateString()}
                            </span>
                          ) : (
                            "-"
                          )}
                        </td>
                        <td className="p-3">
                          <button
                            onClick={() => startEdit(contest)}
                            className="text-xs px-3 py-1 rounded-md bg-gray-700 hover:bg-gray-600 text-gray-200"
                          >
                            Edit
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </main>
      </div>
    </>
  );
}

export default AdminContests;
