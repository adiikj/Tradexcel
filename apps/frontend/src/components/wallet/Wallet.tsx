"use client";
import React, { useCallback, useContext, useState, useEffect } from 'react';
import Link from 'next/link';
import Header from '../dashboard/Header';
import Vheader from '../dashboard/Vheader';
import { Helmet } from 'react-helmet';
import ThemeContext from '../../context/ThemeContext';
import { getUserName, getAvatar, getWallet, getTransactions } from '../../api/api';
import { formatInr } from '../../utils/format';

function Wallet() {
  const { darkMode, toggleDarkMode } = useContext(ThemeContext);
  const [userName, setUserName] = useState<any>('');
  const [isLoadingUserName, setIsLoadingUserName] = useState(true);
  const [avatar, setAvatar] = useState<any>(null);
  const [error, setError] = useState<any>('');

  const [balance, setBalance] = useState<number | null>(null);
  const [currency, setCurrency] = useState('INR');
  const [transactions, setTransactions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'All' | 'BUY' | 'SELL'>('All');

  const fetchWalletAndTransactions = useCallback(async () => {
    try {
      setIsLoading(true);
      setError('');
      const [walletResponse, transactionsResponse] = await Promise.all([
        getWallet(),
        getTransactions(),
      ]);
      setBalance(Number(walletResponse?.data?.balance ?? 0));
      setCurrency(walletResponse?.data?.currency ?? 'INR');
      setTransactions(transactionsResponse?.data?.transactions || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load wallet.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const fetchUserName = async () => {
      try {
        const authToken = (typeof window !== 'undefined' ? localStorage.getItem("authToken") : null);
        if (!authToken) {
          throw new Error("Authentication token is missing. Please log in again.");
        }

        const name = await getUserName();
        setUserName(name.data.name);
      } catch (error) {
        setUserName('User');
      } finally {
        setIsLoadingUserName(false);
      }
    };

    const fetchAvatar = async () => {
      try {
        const data = await getAvatar();
        setAvatar(data?.data?.avatar || null);
      } catch (err) {
        // Avatar stays null; the placeholder image covers this.
      }
    };

    fetchAvatar();
    fetchUserName();
    fetchWalletAndTransactions();
  }, [fetchWalletAndTransactions]);

  const filteredTransactions =
    activeTab === 'All'
      ? transactions
      : transactions.filter((t) => t.side === activeTab);

  return (
    <>
      <Helmet>
        <title>Wallet</title>
      </Helmet>
      <div
        className={`${
          darkMode
            ? "bg-gray-800 text-white"
            : "bg-white text-black"
        } min-h-screen transition-colors duration-300`}
      >
        <Header darkMode={darkMode} toggleDarkMode={toggleDarkMode} />
        <div className="flex flex-col font-pop md:flex-row">
          <Vheader darkMode={darkMode} />
          <main className="flex-grow p-4 md:p-6 m-4 pb-24 md:m-10">
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
                darkMode ? "bg-gray-900" : "bg-gray-100 shadow"
              }`}
            >
              <div className="flex items-center">
                <Link
                  href="/your-profile"
                  className={`shrink-0 rounded-full transition-transform duration-200 hover:scale-105 ${
                    darkMode ? "bg-blue-500 text-gray-100" : "bg-blue-100 text-blue-700"
                  }`}
                >
                  <img
                    className="w-10 h-10 md:w-16 md:h-16 cursor-pointer rounded-full overflow-hidden object-cover"
                    src={avatar || "https://via.placeholder.com/120x120.png?text=No+Avatar"}
                    alt=""
                  />
                </Link>
                <div className="ml-4">
                  {isLoadingUserName ? (
                    <span className={`inline-block h-6 w-32 rounded animate-pulse ${darkMode ? 'bg-gray-700' : 'bg-gray-300'}`} />
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
                darkMode ? "bg-gray-900" : "bg-gray-100 shadow"
              }`}
            >
              <div className="text-xs uppercase tracking-widest text-gray-400 mb-1">Cash Balance</div>
              <div className="flex flex-wrap items-baseline gap-2">
                <span className="text-2xl md:text-3xl font-bold tabular-nums">
                  {isLoading ? (
                    <span className={`inline-block h-8 md:h-10 w-40 rounded animate-pulse ${darkMode ? 'bg-gray-700' : 'bg-gray-300'}`} />
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
                darkMode ? "bg-gray-900" : "bg-white shadow"
              }`}
            >
              <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                <h2 className="text-base md:text-xl font-semibold">Transactions</h2>
                <div className={`flex p-1 rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-gray-200'}`}>
                  {(['All', 'BUY', 'SELL'] as const).map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`px-4 py-1.5 text-xs md:text-sm rounded-md font-medium transition-colors duration-200 active:scale-95 ${
                        activeTab === tab
                          ? "bg-blue-500 text-white shadow"
                          : darkMode
                          ? "text-gray-300 hover:text-white"
                          : "text-gray-600 hover:text-black"
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
                    <div key={i} className={`h-16 rounded-lg animate-pulse ${darkMode ? 'bg-gray-800' : 'bg-gray-100'}`} />
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
                        darkMode ? "bg-gray-800 hover:bg-gray-700" : "bg-gray-100 hover:bg-gray-300"
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
