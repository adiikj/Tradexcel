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
        console.error("Failed to fetch user name:", error.message);
        setUserName('User');
      }
    };

    const fetchAvatar = async () => {
      try {
        const data = await getAvatar();
        setAvatar(data.avatar);
      } catch (err) {
        console.error("Failed to fetch avatar:", err.message);
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
            ? "bg-gray-900 text-white"
            : "bg-white text-black"
        } min-h-screen transition-all duration-300`}
      >
        <Header darkMode={darkMode} toggleDarkMode={toggleDarkMode} />
        <div className="flex flex-col font-pop md:flex-row">
          <Vheader darkMode={darkMode} />
          <main className="flex-grow p-4 md:p-6 m-4 pb-24 md:m-10">
            <h1 className="text-3xl md:text-4xl font-bold">Wallet</h1>
            <div className="h-2 w-20 md:w-32 bg-blue-500 rounded-full mb-6"></div>

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
                darkMode ? "bg-gray-800" : "bg-gray-100 shadow"
              }`}
            >
              <div className="flex items-center">
                <div
                  className={`transition-all duration-300 rounded-full ${
                    darkMode ? "bg-blue-500 text-gray-100" : "bg-blue-100 text-blue-700"
                  }`}
                >
                  <img className=" w-10 h-10 md:w-16 md:h-16 cursor-pointer rounded-full overflow-hidden" src={((avatar || "https://via.placeholder.com/120x120.png?text=No+Avatar")?.src || (avatar || "https://via.placeholder.com/120x120.png?text=No+Avatar")) as string} alt="" />
                </div>
                <div className="ml-4">
                  <h2 className="text-2xl font-bold">{userName || 'User'}</h2>
                  <p className="text-sm text-gray-400">Virtual trading account</p>
                </div>
              </div>
            </div>

            {/* Cash Balance */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-6">
              <div
                className={`p-4 rounded-lg transition-colors duration-300 ${
                  darkMode ? "bg-gray-700" : "bg-gray-100 shadow"
                }`}
              >
                <h3 className="text-md md:text-xl font-semibold">Cash Balance</h3>
                <p className="text-lg md:text-2xl my-2 font-bold">
                  {isLoading ? '...' : formatInr(balance)}
                </p>
                <p className="text-xs text-gray-400">{currency}</p>
              </div>
            </div>

            {/* Transaction Filter Tabs */}
            <div className="flex flex-wrap items-center space-x-2 gap-2 mb-4">
              {(['All', 'BUY', 'SELL'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-2 text-xs md:text-lg rounded transition-colors duration-300 ${
                    activeTab === tab
                      ? "bg-blue-500 text-white"
                      : darkMode
                      ? "bg-gray-700 text-white"
                      : "bg-gray-200 text-black"
                  } hover:bg-blue-400`}
                >
                  {tab === 'All' ? 'All' : tab.charAt(0) + tab.slice(1).toLowerCase()}
                </button>
              ))}
            </div>

            {/* Transactions List */}
            <div
              className={`rounded-lg p-4 transition-colors duration-300 ${
                darkMode ? "bg-gray-800" : "bg-white shadow"
              }`}
            >
              <h2 className="text-lg md:text-2xl font-semibold mb-4">Transactions</h2>
              {isLoading ? (
                <p className="text-gray-400">Loading transactions...</p>
              ) : filteredTransactions.length === 0 ? (
                <div className="text-center py-10">
                  <p className="text-gray-400 mb-4">No transactions yet — make your first trade to see it here.</p>
                  <Link
                    href="/market"
                    className="inline-block px-6 py-2 rounded-md bg-blue-500 text-white hover:bg-blue-600 transition-all duration-300"
                  >
                    Go to Market
                  </Link>
                </div>
              ) : (
                <div className="space-y-4 overflow-y-auto max-h-80">
                  {filteredTransactions.map((transaction) => (
                    <div
                      key={transaction.id}
                      className={`flex flex-col md:flex-row justify-between items-start md:items-center p-4 rounded-lg transition-colors duration-300 ${
                        darkMode ? "bg-gray-900 hover:bg-gray-700" : "bg-gray-100 hover:bg-gray-300"
                      }`}
                    >
                      <div>
                        <h3 className="text-sm md:text-lg font-bold">
                          {transaction.side === 'BUY' ? 'Bought' : 'Sold'} {transaction.quantity} {transaction.symbol}
                        </h3>
                        <p className="text-xs md:text-sm text-gray-400">
                          {new Date(transaction.createdAt).toLocaleString('en-IN')} · @ {formatInr(transaction.price)}
                        </p>
                      </div>
                      <div
                        className={`text-sm md:text-lg font-bold mt-2 md:mt-0 ${
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
