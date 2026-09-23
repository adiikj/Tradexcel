"use client";
import React, { useState } from "react";
import Link from "next/link";
import { FiCheckCircle, FiHelpCircle, FiMail } from "react-icons/fi";
import Header from "../dashboard/Header";
import Vheader from "../dashboard/Vheader";
import { sendSupportMessage } from "../../api/api";
import { apiErrorMessage } from "../../api/http";

const SUBJECTS = ["Bug report", "Account issue", "Trading question", "Contest issue", "Something else"];

function Support() {
  const [subject, setSubject] = useState(SUBJECTS[0]);
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSending(true);
    try {
      await sendSupportMessage(subject, message);
      setSent(true);
    } catch (err) {
      setError(apiErrorMessage(err, "Something went wrong. Please try again."));
    } finally {
      setSending(false);
    }
  };

  const cardBg = "bg-gray-100 dark:bg-gray-900";
  const inputClasses = `w-full rounded-lg border px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
    "bg-white border-gray-300 text-gray-800 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
  }`;

  return (
    <>
      <div
        className={
          "bg-white text-black min-h-screen transition-colors duration-300 font-pop dark:bg-gray-800 dark:text-white"
        }
      >
        <Header />
        <div className="flex flex-col md:flex-row">
          <Vheader />
          <main className="flex-1 min-w-0 p-4 m-4 md:m-10 mb-20 md:mb-10">
            <h1 className="text-2xl md:text-3xl font-bold">Support</h1>
            <div className="h-2 w-32 bg-blue-500 rounded-full mb-6 animate-line"></div>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 max-w-4xl">
              <div className={`lg:col-span-2 rounded-2xl p-6 h-fit ${cardBg}`}>
                <h2 className="font-bold mb-3">Before you write in</h2>
                <Link
                  href="/faq"
                  className={`flex items-center gap-3 p-3 rounded-xl transition-colors duration-200 ${
                    "hover:bg-white dark:hover:bg-gray-700"
                  }`}
                >
                  <FiHelpCircle className="text-blue-500 text-xl shrink-0" />
                  <div>
                    <p className="text-sm font-semibold">Check the FAQ</p>
                    <p className="text-xs text-gray-400">Most common questions are answered there.</p>
                  </div>
                </Link>
                <div className="flex items-center gap-3 p-3 mt-1">
                  <FiMail className="text-blue-500 text-xl shrink-0" />
                  <div>
                    <p className="text-sm font-semibold">Email us directly</p>
                    <p className="text-xs text-gray-400">contact@tradexcel.site</p>
                  </div>
                </div>
              </div>

              <div className={`lg:col-span-3 rounded-2xl p-6 ${cardBg}`}>
                {sent ? (
                  <div className="h-full flex flex-col items-center justify-center text-center py-10">
                    <FiCheckCircle className="text-blue-500 text-5xl" />
                    <h3 className="text-xl font-semibold mt-4">Request sent</h3>
                    <p className="text-sm text-gray-400 mt-2">We&apos;ll get back to you as soon as we can.</p>
                    <button
                      onClick={() => {
                        setSent(false);
                        setMessage("");
                        setSubject(SUBJECTS[0]);
                      }}
                      className="mt-6 text-sm text-blue-500 hover:underline"
                    >
                      Send another request
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <label htmlFor="support-subject" className="block text-sm font-medium mb-1">Subject</label>
                      <select id="support-subject" value={subject} onChange={(e) => setSubject(e.target.value)} className={inputClasses}>
                        {SUBJECTS.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label htmlFor="support-message" className="block text-sm font-medium mb-1">Message</label>
                      <textarea
                        id="support-message"
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        required
                        rows={6}
                        placeholder="What's going on?"
                        className={`${inputClasses} resize-none`}
                      />
                    </div>
                    {error && <p className="text-sm text-red-500">{error}</p>}
                    <button
                      type="submit"
                      disabled={sending}
                      className="px-8 py-3 rounded-lg bg-blue-500 text-white text-sm font-semibold hover:bg-blue-600 transition-colors duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {sending ? "Sending..." : "Send request"}
                    </button>
                  </form>
                )}
              </div>
            </div>
          </main>
        </div>
      </div>
    </>
  );
}

export default Support;
