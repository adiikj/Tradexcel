"use client";
import React, { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Helmet } from "react-helmet";
import { adminCreateContest, adminGetContests } from "../../api/adminApi";

const STATUS_STYLES: Record<string, string> = {
  UPCOMING: "bg-yellow-500",
  LIVE: "bg-green-500",
  ENDED: "bg-gray-500",
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
  const [prize, setPrize] = useState("");

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
    const now = new Date();
    const inAnHour = new Date(now.getTime() + 60 * 60 * 1000);
    const inAWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    setStartAt(toLocalInputValue(inAnHour));
    setEndAt(toLocalInputValue(inAWeek));
    fetchContests();
  }, [fetchContests]);

  const handleLogout = () => {
    localStorage.removeItem("adminToken");
    router.push("/admin/login");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    try {
      setIsSubmitting(true);
      await adminCreateContest({
        name,
        startAt: new Date(startAt).toISOString(),
        endAt: new Date(endAt).toISOString(),
        startingBalance: startingBalance ? Number(startingBalance) : undefined,
        prize: prize || undefined,
      });
      toast.success("Contest created");
      setName("");
      setStartingBalance("");
      setPrize("");
      await fetchContests();
    } catch (err: any) {
      toast.error(err.message || "Failed to create contest");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>Admin — Contests</title>
      </Helmet>
      <div className="bg-gray-900 text-white min-h-screen font-pop">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-700">
          <h1 className="text-lg font-bold">Mocket Admin</h1>
          <button onClick={handleLogout} className="text-sm text-gray-400 hover:text-white underline">
            Log out
          </button>
        </div>

        <main className="p-6 md:p-10 max-w-5xl mx-auto">
          <section className="mb-10 bg-gray-800 border border-gray-700 rounded-2xl p-6 shadow-lg">
            <h2 className="text-base font-semibold mb-4">Create a contest</h2>
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
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 text-sm rounded-md font-semibold bg-blue-500 hover:bg-blue-600 disabled:opacity-50"
                >
                  {isSubmitting ? "Creating..." : "Create contest"}
                </button>
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
              <p className="text-gray-400 text-sm">No contests yet — create one above.</p>
            ) : (
              <div className="overflow-x-auto border border-gray-700 rounded-xl">
                <table className="w-full text-left border-collapse text-sm">
                  <thead className="bg-gray-800">
                    <tr>
                      <th className="p-3">Name</th>
                      <th className="p-3">Status</th>
                      <th className="p-3">Starts</th>
                      <th className="p-3">Ends</th>
                      <th className="p-3">Participants</th>
                      <th className="p-3">Prize</th>
                    </tr>
                  </thead>
                  <tbody>
                    {contests.map((contest) => (
                      <tr key={contest.id} className="border-t border-gray-700">
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
                        <td className="p-3 text-gray-400">{contest.prize || "—"}</td>
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
