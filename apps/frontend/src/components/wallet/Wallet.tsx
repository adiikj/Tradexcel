"use client";
import React, { useCallback, useState } from 'react';
import Link from 'next/link';
import Header from '../dashboard/Header';
import Vheader from '../dashboard/Vheader';
import { getUserName, getAvatar, getWallet, getTransactions } from '../../api/api';
import { formatInr } from '../../utils/format';
import { useAsyncEffect } from "../../hooks/useAsyncEffect";
import Avatar from "../ui/Avatar";
import { apiErrorMessage } from "../../api/http";
import type { TransactionRecord } from "@tradexcel/shared";

function Wallet() {
  const [userName, setUserName] = useState('');
  const [isLoadingUserName, setIsLoadingUserName] = useState(true);
  const [avatar, setAvatar] = useState<string | null>(null);
  const [error, setError] = useState('');

  const [balance, setBalance] = useState<number | null>(null);
  const [currency, setCurrency] = useState('INR');
  const [transactions, setTransactions] = useState<TransactionRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'All' | 'BUY' | 'SELL'>('All');

  // State is only set after the first await, so effects can call this directly.
  const loadWalletAndTransactions = useCallback(async (isActive: () => boolean = () => true) => {
    try {
      const [walletResponse, transactionsResponse] = await Promise.all([
        getWallet(),
        getTransactions(),
      ]);
      if (!isActive()) return;
      setBalance(Number(walletResponse?.data?.balance ?? 0));
      setCurrency(walletResponse?.data?.currency ?? 'INR');
      setTransactions(transactionsResponse?.data?.transactions || []);
    } catch (err) {
      if (!isActive()) return;
      setError(apiErrorMessage(err, 'Failed to load wallet.'));
    } finally {
      if (isActive()) setIsLoading(false);
    }
  }, []);

  // For buttons/handlers: show the loading state, then load.
  const fetchWalletAndTransactions = useCallback(
    () => {
      setIsLoading(true);
      setError('');
      return loadWalletAndTransactions();
    },
    [loadWalletAndTransactions]
  );

  useAsyncEffect(
    (isActive) =>
      Promise.all([
        getAvatar()
          .then((data) => {
            if (isActive()) setAvatar(data?.data?.avatar || null);
          })
          .catch(() => {
            // Avatar stays null; the placeholder image covers this.
          }),
        getUserName()
          .then((name) => {
            if (isActive()) setUserName(name.data.name);
          })
          .catch(() => {
            if (isActive()) setUserName('User');
          })
          .finally(() => {
            if (isActive()) setIsLoadingUserName(false);
          }),
        loadWalletAndTransactions(isActive),
      ]),
    [loadWalletAndTransactions]
  );

  const filteredTransactions =
    activeTab === 'All'
      ? transactions
      : transactions.filter((t) => t.side === activeTab);

  return (
    <>
      <div
        className={`${
          "bg-white text-black dark:bg-gray-800 dark:text-white"
        } min-h-screen transition-colors duration-300`}
      >
        <Header />
        <div className="flex flex-col font-pop md:flex-row">
          <Vheader />
          <main className="flex-grow min-w-0 p-4 md:p-6 m-4 pb-24 md:m-10">
            <h1 className="text-2xl md:text-3xl font-bold">Wallet</h1>
            <div className="h-2 w-20 md:w-32 bg-blue-500 rounded-full mb-6 animate-line"></div>

            {error && (
              <div className="mb-4 flex items-center gap-3">
                <p className="text-red-500">{error}</p>
                <button onClick={fetchWalletAndTransactions} className="text-sm text-blue-500 underline">
                  Retry
                </button>
              </div>
            )}

            {/* Profile Section */}
            <div
              className={`rounded-lg p-4 mb-6 transition-colors duration-300 ${
                "bg-gray-100 shadow dark:bg-gray-900 dark:shadow-none"
              }`}
            >
              <div className="flex items-center">
                <Link
                  href="/your-profile"
                  className={`shrink-0 rounded-full transition-transform duration-200 hover:scale-105 ${
                    "bg-blue-100 text-blue-700 dark:bg-blue-500 dark:text-gray-100"
                  }`}
                >
                  <Avatar
                    src={avatar}
                    size={64}
                    className="w-10 h-10 md:w-16 md:h-16 cursor-pointer rounded-full overflow-hidden object-cover"
                  />
                </Link>
                <div className="ml-4">
                  {isLoadingUserName ? (
                    <span className={`inline-block h-6 w-32 rounded animate-pulse bg-gray-300 dark:bg-gray-700`} />
                  ) : (
                    <h2 className="text-xl font-bold">{userName}</h2>
                  )}
                  <p className="text-sm text-gray-400">Virtual trading account</p>
                </div>
              </div>
            </div>

            {/* Cash Balance */}
            <div
              className={`p-5 md:p-6 rounded-lg mb-6 transition-colors duration-300 ${
                "bg-gray-100 shadow dark:bg-gray-900 dark:shadow-none"
              }`}
            >
              <div className="text-xs uppercase tracking-widest text-gray-400 mb-1">Cash Balance</div>
              <div className="flex flex-wrap items-baseline gap-2">
                <span className="text-2xl md:text-3xl font-bold tabular-nums">
                  {isLoading ? (
                    <span className={`inline-block h-8 md:h-10 w-40 rounded animate-pulse bg-gray-300 dark:bg-gray-700`} />
                  ) : (
                    formatInr(balance)
                  )}
                </span>
                <span className="text-xs text-gray-400">{currency}</span>
              </div>
            </div>

            {/* Transactions List */}
            <div
              className={`rounded-lg p-4 transition-colors duration-300 ${
                "bg-white shadow dark:bg-gray-900 dark:shadow-none"
              }`}
            >
              <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                <h2 className="text-base md:text-xl font-semibold">Transactions</h2>
                <div className={`flex p-1 rounded-lg bg-gray-200 dark:bg-gray-800`}>
                  {(['All', 'BUY', 'SELL'] as const).map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`px-4 py-1.5 text-xs md:text-sm rounded-md font-medium transition-colors duration-200 active:scale-95 ${
                        activeTab === tab
                          ? "bg-blue-500 text-white shadow"
                          : "text-gray-600 hover:text-black dark:text-gray-300 dark:hover:text-white"
                      }`}
                    >
                      {tab === 'All' ? 'All' : tab.charAt(0) + tab.slice(1).toLowerCase()}
                    </button>
                  ))}
                </div>
              </div>
              {isLoading ? (
                <div className="space-y-4">
                  {[0, 1, 2].map((i) => (
                    <div key={i} className={`h-16 rounded-lg animate-pulse bg-gray-100 dark:bg-gray-800`} />
                  ))}
                </div>
              ) : filteredTransactions.length === 0 ? (
                <div className="text-center py-10">
                  <p className="text-gray-400 mb-4">No transactions yet. Make your first trade to see it here.</p>
                  <Link
                    href="/market"
                    className="inline-block px-6 py-2 rounded-md bg-blue-500 text-white hover:bg-blue-600 transition-colors duration-200"
                  >
                    Go to Market
                  </Link>
                </div>
              ) : (
                <div className="space-y-4 overflow-y-auto max-h-80">
                  {filteredTransactions.map((transaction) => (
                    <div
                      key={transaction.id}
                      className={`flex flex-col md:flex-row justify-between items-start md:items-center p-4 rounded-lg transition-colors duration-200 ${
                        "bg-gray-100 hover:bg-gray-300 dark:bg-gray-800 dark:hover:bg-gray-700"
                      }`}
                    >
                      <div>
                        <h3 className="text-sm md:text-base font-bold">
                          {transaction.side === 'BUY' ? 'Bought' : 'Sold'} {transaction.quantity} {transaction.symbol}
                        </h3>
                        <p className="text-xs md:text-sm text-gray-400 tabular-nums">
                          {new Date(transaction.createdAt).toLocaleString('en-IN')} · @ {formatInr(transaction.price)}
                        </p>
                      </div>
                      <div
                        className={`text-sm md:text-base font-bold mt-2 md:mt-0 tabular-nums ${
                          transaction.side === 'BUY' ? "text-red-400" : "text-green-400"
                        }`}
                      >
                        {transaction.side === 'BUY' ? '-' : '+'}{formatInr(transaction.total)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </main>
        </div>
      </div>
    </>
  );
}

export default Wallet;
