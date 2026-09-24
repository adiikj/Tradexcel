"use client";
import React, { useState } from "react";
import Link from "next/link";
import { PiCaretRight, PiCheckCircle, PiEnvelopeSimple, PiQuestion } from "react-icons/pi";
import Header from "../dashboard/Header";
import Vheader from "../dashboard/Vheader";
import { sendSupportMessage } from "../../api/api";
import { apiErrorMessage } from "../../api/http";

const SUBJECTS = ["Bug report", "Account issue", "Trading question", "Contest issue", "Something else"];
// Matches the backend's support message limit.
const MAX_MESSAGE = 5000;
const EMAIL = "contact@tradexcel.site";

const SURFACE = "rounded-2xl bg-white shadow-sm ring-1 ring-gray-200 dark:bg-gray-900 dark:shadow-none dark:ring-gray-800";

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

  const reset = () => {
    setSent(false);
    setMessage("");
    setSubject(SUBJECTS[0]);
  };

  return (
    <div className="min-h-screen bg-gray-50 font-pop text-gray-900 transition-colors duration-300 dark:bg-gray-800 dark:text-white">
      <Header />
      <div className="flex">
        <Vheader />
        <main className="mb-20 min-w-0 flex-1 md:mb-0 px-5 py-6 md:px-8 md:py-8 lg:px-12 lg:py-10">
          <div className="mx-auto max-w-4xl space-y-6">
            <div>
              <h1 className="text-2xl font-bold md:text-3xl">Support</h1>
              <div className="mt-1 h-0.5 w-24 rounded-full bg-blue-600 dark:bg-blue-400 animate-line" />
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Found a bug or stuck on something? Tell us and we&apos;ll help.</p>
            </div>

            <div className="grid gap-4 lg:grid-cols-5">
              <section aria-label="Contact form" className={`p-5 md:p-6 lg:col-span-3 ${SURFACE}`}>
                {sent ? (
                  <div role="status" className="flex h-full flex-col items-center justify-center py-10 text-center">
                    <span className="flex h-14 w-14 items-center justify-center rounded-full bg-green-600/10 text-green-700 dark:text-green-300">
                      <PiCheckCircle aria-hidden="true" className="h-8 w-8" />
                    </span>
                    <h2 className="mt-4 text-lg font-semibold">Message sent</h2>
                    <p className="mt-1 max-w-xs text-sm text-gray-500 dark:text-gray-400">
                      We&apos;ll reply to the email on your account as soon as we can.
                    </p>
                    <button type="button" onClick={reset} className="mt-6 text-sm font-medium text-blue-600 hover:underline dark:text-blue-400">
                      Send another message
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-5">
                    <h2 className="text-base font-semibold">Send us a message</h2>
                    <fieldset>
                      <legend className="mb-2 text-sm font-medium">What&apos;s it about?</legend>
                      <div className="flex flex-wrap gap-2">
                        {SUBJECTS.map((s) => (
                          <label
                            key={s}
                            className={`cursor-pointer rounded-full px-3 py-1.5 text-xs font-medium transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-blue-500 ${
                              subject === s
                                ? "bg-gray-900 text-white dark:bg-white dark:text-gray-900"
                                : "bg-gray-100 text-gray-600 hover:text-gray-900 dark:bg-gray-800 dark:text-gray-300 dark:hover:text-white"
                            }`}
                          >
                            <input type="radio" name="subject" value={s} checked={subject === s} onChange={() => setSubject(s)} className="sr-only" />
                            {s}
                          </label>
                        ))}
                      </div>
                    </fieldset>
                    <div>
                      <div className="mb-2 flex items-baseline justify-between">
                        <label htmlFor="support-message" className="text-sm font-medium">
                          Message
                        </label>
                        <span className="text-xs tabular-nums text-gray-400">
                          {message.length}/{MAX_MESSAGE}
                        </span>
                      </div>
                      <textarea
                        id="support-message"
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        required
                        maxLength={MAX_MESSAGE}
                        rows={7}
                        placeholder="What happened, and what did you expect? For a trade, include the stock and roughly when."
                        className="w-full resize-y rounded-xl bg-gray-100 px-4 py-3 text-sm outline-none placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500 dark:bg-gray-800"
                      />
                    </div>
                    {error && (
                      <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-500/10 dark:text-red-300">
                        {error}
                      </p>
                    )}
                    <div className="flex flex-wrap items-center gap-3">
                      <button
                        type="submit"
                        disabled={sending || !message.trim()}
                        className="rounded-xl bg-blue-600 px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {sending ? "Sending…" : "Send message"}
                      </button>
                      <span className="text-xs text-gray-500 dark:text-gray-400">We reply to the email on your account.</span>
                    </div>
                  </form>
                )}
              </section>

              <aside className="space-y-4 lg:col-span-2">
                <Link
                  href="/faq"
                  className={`group flex items-center gap-3 p-4 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/60 ${SURFACE}`}
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300">
                    <PiQuestion aria-hidden="true" className="h-5 w-5" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-medium">Check the FAQ first</span>
                    <span className="block text-xs text-gray-500 dark:text-gray-400">Weekly resets, contests, alerts and more.</span>
                  </span>
                  <PiCaretRight aria-hidden="true" className="h-4 w-4 shrink-0 text-gray-400 transition-transform group-hover:translate-x-0.5" />
                </Link>
                <a
                  href={`mailto:${EMAIL}`}
                  className={`group flex items-center gap-3 p-4 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/60 ${SURFACE}`}
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300">
                    <PiEnvelopeSimple aria-hidden="true" className="h-5 w-5" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-medium">Prefer email?</span>
                    <span className="block truncate text-xs text-gray-500 dark:text-gray-400">{EMAIL}</span>
                  </span>
                  <PiCaretRight aria-hidden="true" className="h-4 w-4 shrink-0 text-gray-400 transition-transform group-hover:translate-x-0.5" />
                </a>
              </aside>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default Support;
