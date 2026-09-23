"use client";
import React, { useCallback, useEffect, useMemo, useState } from "react";
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
import ContestList, { type ContestScope, type StatusFilter } from "./ContestList";
import ContestDetail from "./ContestDetail";
import { CreatePrivateContestModal, JoinPrivateContestModal } from "./PrivateLeagueTools";
import TradeModal from "../trade/TradeModal";
import { useAsyncEffect } from "../../hooks/useAsyncEffect";
import { apiErrorMessage } from "../../api/http";
import type { Contest as ContestData, ContestPortfolioData, ContestStanding } from "@tradexcel/shared";


function Contest() {

  const [scope, setScope] = useState<ContestScope>("public");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
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
      setError(apiErrorMessage(err, "Failed to load contests."));
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
      toast.error(apiErrorMessage(err, "Failed to load contest details."));
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
      toast.error(apiErrorMessage(err, "Failed to join contest."));
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
      toast.error(apiErrorMessage(err, "Failed to join private league."));
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
      toast.error(apiErrorMessage(err, "Failed to create private league."));
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
  const filteredContests = useMemo(
    () => (statusFilter === "ALL" ? contests : contests.filter((contest) => contest.status === statusFilter)),
    [contests, statusFilter]
  );


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
      <div
        className={
          "bg-white text-black min-h-screen transition-colors duration-300 font-pop dark:bg-gray-800 dark:text-white"
        }
      >
        <Header />
        <div className="flex flex-col lg:flex-row">
          <Vheader />
          <main className="flex-1 min-w-0 pb-24 md:pb-0 p-6 m-2 md:m-12">
            <h1 className="text-xl md:text-2xl font-bold">Contests</h1>
            <div className="h-2 w-32 md:w-36 bg-blue-500 rounded-full mb-6 animate-line"></div>

            {error && (
              <div className="mb-4 flex items-center gap-3">
                <p className="text-red-500 text-sm">{error}</p>
                <button onClick={() => fetchContests(scope)} className="text-sm text-blue-500 underline">
                  Retry
                </button>
              </div>
            )}

            {!selectedContestId ? (
              <ContestList
                filteredContests={filteredContests}
                isLoading={isLoading}
                scope={scope}
                onScopeChange={changeScope}
                statusFilter={statusFilter}
                onStatusFilterChange={setStatusFilter}
                isJoining={isJoining}
                onJoin={handleJoin}
                onSelect={selectContest}
                onCopyInviteCode={handleCopyInviteCode}
                onOpenJoin={() => setShowJoinModal(true)}
                onOpenCreate={() => setShowCreateModal(true)}
              />
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
