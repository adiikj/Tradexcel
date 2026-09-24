"use client";
import React, { useCallback, useEffect, useState } from "react";
import { PiKey, PiPlus } from "react-icons/pi";
import toast from "react-hot-toast";
import Header from "../dashboard/Header";
import Vheader from "../dashboard/Vheader";
import {
  createPrivateContest,
  getContests,
  getContest,
  joinContest,
  joinPrivateContest,
  getContestStandings,
  getContestPortfolio,
  getUserProfile,
} from "../../api/api";
import ContestList, { type ContestScope } from "./ContestList";
import ContestDetail from "./ContestDetail";
import { CreatePrivateContestModal, JoinPrivateContestModal } from "./PrivateLeagueTools";
import TradeModal from "../trade/TradeModal";
import { useAsyncEffect } from "../../hooks/useAsyncEffect";
import { apiErrorMessage } from "../../api/http";
import type { Contest as ContestData, ContestPortfolioData, ContestStanding } from "@tradexcel/shared";

const SCOPES: { key: ContestScope; label: string }[] = [
  { key: "public", label: "Public" },
  { key: "private", label: "My leagues" },
];

function Contest() {
  const [scope, setScope] = useState<ContestScope>("public");
  const [contests, setContests] = useState<ContestData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const [selectedContestId, setSelectedContestId] = useState<string | null>(null);
  const [selectedContest, setSelectedContest] = useState<ContestData | null>(null);
  const [standings, setStandings] = useState<ContestStanding[]>([]);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [isJoining, setIsJoining] = useState(false);

  const [contestPortfolio, setContestPortfolio] = useState<ContestPortfolioData | null>(null);
  const [buyTarget, setBuyTarget] = useState<{ symbol: string; price: number } | null>(null);
  const [sellTarget, setSellTarget] = useState<ContestPortfolioData["holdings"][number] | null>(null);
  const [isJoiningPrivate, setIsJoiningPrivate] = useState(false);
  const [isCreatingPrivate, setIsCreatingPrivate] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // State is only set after the first await, so effects can call this directly.
  const loadContests = useCallback(async (nextScope: "public" | "private", isActive: () => boolean = () => true) => {
    try {
      const response = await getContests(nextScope);
      if (!isActive()) return;
      setContests(response?.data || []);
    } catch (err) {
      if (!isActive()) return;
      setError(apiErrorMessage(err, "We couldn't load contests. Please try again."));
    } finally {
      if (isActive()) setIsLoading(false);
    }
  }, []);

  // For buttons/handlers: show the loading state, then load.
  const fetchContests = useCallback(
    (nextScope: "public" | "private") => {
      setIsLoading(true);
      setError("");
      return loadContests(nextScope);
    },
    [loadContests]
  );

  // Changing what's shown flips the loading state here, in the event, rather
  // than synchronously inside the effects that refetch.
  const changeScope = (next: typeof scope) => {
    if (next !== scope) {
      setIsLoading(true);
      setError("");
    }
    setScope(next);
  };

  const selectContest = (id: string | null) => {
    if (id && id !== selectedContestId) setIsDetailLoading(true);
    setSelectedContestId(id);
    window.scrollTo({ top: 0 });
  };

  useAsyncEffect((isActive) => loadContests(scope, isActive), [loadContests, scope]);

  useEffect(() => {
    getUserProfile()
      .then((res) => setCurrentUserId(res?.data?.id ?? null))
      .catch(() => {});
  }, []);

  // State is only set after the first await, so effects can call this directly.
  const loadContestDetail = useCallback(async (contestId: string, isActive: () => boolean = () => true) => {
    try {
      const [contestRes, standingsRes] = await Promise.all([
        getContest(contestId),
        getContestStandings(contestId),
      ]);
      if (!isActive()) return;
      const contest = contestRes?.data || null;
      setSelectedContest(contest);
      setStandings(standingsRes?.data?.standings || []);

      const portfolioRes = await getContestPortfolio(contestId).catch(() => null);
      if (!isActive()) return;
      setContestPortfolio(portfolioRes?.data || null);
    } catch (err) {
      if (!isActive()) return;
      toast.error(apiErrorMessage(err, "We couldn't load this contest. Please try again."));
    } finally {
      if (isActive()) setIsDetailLoading(false);
    }
  }, []);

  // For buttons/handlers: show the loading state, then load.
  const fetchContestDetail = useCallback(
    (contestId: string) => {
      setIsDetailLoading(true);
      return loadContestDetail(contestId);
    },
    [loadContestDetail]
  );

  useAsyncEffect(
    (isActive) => (selectedContestId ? loadContestDetail(selectedContestId, isActive) : Promise.resolve()),
    [selectedContestId, loadContestDetail]
  );

  const handleJoin = async (contestId: string) => {
    if (isJoining) return;
    try {
      setIsJoining(true);
      await joinContest(contestId);
      toast.success("Joined contest!");
      await fetchContests(scope);
      if (selectedContestId === contestId) {
        await fetchContestDetail(contestId);
      }
    } catch (err) {
      toast.error(apiErrorMessage(err, "We couldn't join this contest. Please try again."));
    } finally {
      setIsJoining(false);
    }
  };

  const handleJoinPrivate = async (inviteCode: string) => {
    if (isJoiningPrivate) return;
    try {
      setIsJoiningPrivate(true);
      const response = await joinPrivateContest(inviteCode);
      const joinedContest = response?.data?.contest;
      toast.success("Joined private league!");
      changeScope("private");
      setShowJoinModal(false);
      await fetchContests("private");
      if (joinedContest?.id) {
        selectContest(joinedContest.id);
      }
    } catch (err) {
      toast.error(apiErrorMessage(err, "We couldn't join that league. Check the code and try again."));
    } finally {
      setIsJoiningPrivate(false);
    }
  };

  const handleCreatePrivate = async (payload: {
    name: string;
    startAt: string;
    endAt: string;
    startingBalance?: number;
    symbols: string[];
    prize?: string;
  }) => {
    if (isCreatingPrivate) return;
    if (!payload.name || !payload.startAt || !payload.endAt || payload.symbols.length === 0) {
      toast.error("Name, schedule, and at least one symbol are required.");
      return;
    }

    try {
      setIsCreatingPrivate(true);
      const response = await createPrivateContest(payload);
      const createdContest = response?.data;
      toast.success(`Private contest created. Code: ${createdContest?.inviteCode || "ready"}`);
      changeScope("private");
      setShowCreateModal(false);
      await fetchContests("private");
      if (createdContest?.id) {
        selectContest(createdContest.id);
      }
    } catch (err) {
      toast.error(apiErrorMessage(err, "We couldn't create your league. Please try again."));
    } finally {
      setIsCreatingPrivate(false);
    }
  };

  const handleCopyInviteCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      toast.success("Invite code copied!");
    } catch {
      toast.error("Couldn't copy - copy it manually instead.");
    }
  };

  const hasJoined = Boolean(selectedContest?.isJoined ?? (currentUserId && standings.some((entry) => entry.userId === currentUserId)));

  const closeDetail = () => {
    selectContest(null);
    setSelectedContest(null);
    setStandings([]);
    setContestPortfolio(null);
    setBuyTarget(null);
    setSellTarget(null);
  };

  return (
    <>
      <div className="min-h-screen bg-gray-50 font-pop text-gray-900 transition-colors duration-300 dark:bg-gray-800 dark:text-white">
        <Header />
        <div className="flex">
          <Vheader />
          <main className="mb-20 min-w-0 flex-1 space-y-5 md:mb-0 px-5 py-6 md:px-8 md:py-8 lg:px-12 lg:py-10">
            {!selectedContestId ? (
              <>
                <div className="flex flex-wrap items-end justify-between gap-3">
                  <div>
                    <h1 className="text-2xl font-bold md:text-3xl">Contests</h1>
                    <div className="mt-1 h-0.5 w-24 rounded-full bg-blue-600 dark:bg-blue-400 animate-line" />
                    <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Compete with separate starting cash. Your weekly wallet isn&apos;t touched.</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setShowJoinModal(true)}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-white px-3.5 py-2 text-sm font-medium shadow-sm ring-1 ring-gray-200 hover:bg-gray-50 dark:bg-gray-900 dark:ring-gray-700 dark:hover:bg-gray-800"
                    >
                      <PiKey aria-hidden="true" className="h-4 w-4" /> Join with code
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowCreateModal(true)}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-3.5 py-2 text-sm font-medium text-white hover:bg-blue-700"
                    >
                      <PiPlus aria-hidden="true" className="h-4 w-4" /> Create league
                    </button>
                  </div>
                </div>

                <div
                  role="group"
                  aria-label="Contest type"
                  className="inline-flex rounded-xl bg-white p-0.5 shadow-sm ring-1 ring-gray-200 dark:bg-gray-900 dark:shadow-none dark:ring-gray-800"
                >
                  {SCOPES.map((tab) => (
                    <button
                      key={tab.key}
                      type="button"
                      aria-pressed={scope === tab.key}
                      onClick={() => changeScope(tab.key)}
                      className={`rounded-lg px-4 py-1.5 text-sm font-medium transition-colors ${
                        scope === tab.key
                          ? "bg-gray-100 text-gray-900 dark:bg-gray-700 dark:text-white"
                          : "text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                {error && (
                  <div className="flex items-center gap-3 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-500/10 dark:text-red-300">
                    <span className="flex-1">{error}</span>
                    <button type="button" onClick={() => fetchContests(scope)} className="font-medium underline">
                      Retry
                    </button>
                  </div>
                )}

                <ContestList
                  contests={contests}
                  isLoading={isLoading}
                  scope={scope}
                  isJoining={isJoining}
                  onJoin={handleJoin}
                  onSelect={selectContest}
                  onOpenJoin={() => setShowJoinModal(true)}
                  onOpenCreate={() => setShowCreateModal(true)}
                />
              </>
            ) : (
              <ContestDetail
                contest={selectedContest}
                isLoading={isDetailLoading}
                standings={standings}
                portfolio={contestPortfolio}
                currentUserId={currentUserId}
                hasJoined={hasJoined}
                isJoining={isJoining}
                onBack={closeDetail}
                onJoin={handleJoin}
                onCopyInviteCode={handleCopyInviteCode}
                onBuy={setBuyTarget}
                onSell={setSellTarget}
              />
            )}
          </main>
        </div>
      </div>

      {buyTarget && selectedContestId && (
        <TradeModal
          symbol={buyTarget.symbol}
          side="BUY"
          initialPrice={buyTarget.price}
          availableCash={Number(contestPortfolio?.summary?.balance ?? 0)}
          contestId={selectedContestId}
          onClose={() => setBuyTarget(null)}
          onSuccess={() => fetchContestDetail(selectedContestId)}
        />
      )}
      {sellTarget && selectedContestId && (
        <TradeModal
          symbol={sellTarget.symbol}
          side="SELL"
          initialPrice={Number(sellTarget.currentPrice ?? sellTarget.avgBuyPrice)}
          availableQty={sellTarget.quantity}
          contestId={selectedContestId}
          onClose={() => setSellTarget(null)}
          onSuccess={() => fetchContestDetail(selectedContestId)}
        />
      )}
      {showJoinModal && (
        <JoinPrivateContestModal
          isJoining={isJoiningPrivate}
          onJoin={handleJoinPrivate}
          onClose={() => setShowJoinModal(false)}
        />
      )}
      {showCreateModal && (
        <CreatePrivateContestModal
          isCreating={isCreatingPrivate}
          onCreate={handleCreatePrivate}
          onClose={() => setShowCreateModal(false)}
        />
      )}
    </>
  );
}

export default Contest;
