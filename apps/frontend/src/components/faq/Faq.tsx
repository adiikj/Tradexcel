"use client";
import React, { useState, useEffect, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Header from '../dashboard/Header';
import Vheader from '../dashboard/Vheader';
import ThemeContext from "../../context/ThemeContext";
import { Helmet } from 'react-helmet';

function Faq() {
  const { darkMode, toggleDarkMode } = useContext(ThemeContext);

  const [expandedIndex, setExpandedIndex] = useState<any>(null);

  const toggleAnswer = (index) => {
    setExpandedIndex(prevIndex => (prevIndex === index ? null : index));
  };

  const faqs = [
    {
      question: "What is Tradexcel?",
      answer: "Tradexcel is a virtual stock market game where users can simulate stock trading in real-time market conditions without any financial risk."
    },
    {
      question: "How do I get started with Tradexcel?",
      answer: "Simply sign up on the platform, create a portfolio, and start trading with virtual currency."
    },
    {
      question: "Is Tradexcel free to use?",
      answer: "Yes, Tradexcel is completely free to use and is designed to help users learn and practice trading."
    },
    {
      question: "Can I track my trading performance?",
      answer: "Absolutely! Tradexcel provides detailed performance analytics, including profit/loss tracking and portfolio insights."
    },
    {
      question: "Is Tradexcel suitable for beginners?",
      answer: "Yes, Tradexcel is ideal for beginners looking to learn trading strategies and understand market trends without financial risks."
    }
  ];

  return (
    <>
    <Helmet>
      <title>FAQ</title>
    </Helmet>
      <div className={darkMode ? "bg-gray-800 text-white min-h-screen transition-all duration-300 font-pop" : "bg-white text-black min-h-screen transition-all duration-300 font-pop"}>
        <Header darkMode={darkMode} toggleDarkMode={toggleDarkMode} />
        <div className="flex">
          <Vheader darkMode={darkMode} className=" noscroller" />
          <main className="flex-1 min-w-0 pb-24 md:pb-0 p-6 m-2 md:m-10">
            <h1 className="text-2xl md:text-3xl font-bold">Frequently Asked Questions</h1>
            <div className="h-2 w-32 md:w-36 bg-blue-500 rounded-full mb-2 animate-line"></div>
            <p className="text-sm text-gray-400 mb-8 max-w-2xl">
              Everything you need to know about trading on Tradexcel.
            </p>
            <div className="max-w-3xl space-y-3">
              {faqs.map((faq, index) => {
                const isOpen = expandedIndex === index;
                return (
                  <div
                    key={index}
                    className={`rounded-xl overflow-hidden transition-colors duration-300 ${
                      darkMode ? "bg-gray-900" : "bg-gray-100 shadow"
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => toggleAnswer(index)}
                      className="w-full text-left px-5 py-4 md:px-6 md:py-5 flex justify-between items-center gap-4 appearance-none bg-transparent"
                    >
                      <span className="text-base md:text-lg font-semibold">{faq.question}</span>
                      <span
                        className={`shrink-0 w-7 h-7 md:w-8 md:h-8 flex items-center justify-center rounded-full text-lg font-bold transition-all duration-300 ${
                          isOpen ? "rotate-45 bg-blue-500 text-white" : darkMode ? "bg-gray-700 text-white" : "bg-gray-300 text-black"
                        }`}
                      >
                        +
                      </span>
                    </button>
                    <AnimatePresence initial={false}>
                      {isOpen && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.25 }}
                          className="overflow-hidden"
                        >
                          <p
                            className={`px-5 pb-5 md:px-6 md:pb-6 pt-4 border-t text-sm md:text-base ${
                              darkMode ? "border-gray-700 text-gray-300" : "border-gray-300 text-gray-600"
                            }`}
                          >
                            {faq.answer}
                          </p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          </main>
        </div>
      </div>
    </>
  );
}

export default Faq;
