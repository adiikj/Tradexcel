"use client";
import React, { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { sendContactMessage } from "../../api/api";
import { apiErrorMessage } from "../../api/http";
import { PageHero, reveal } from "../landingPage/marketing";

const EMAIL = "contact@tradexcel.site";
const MAX_MESSAGE = 5000; // matches the backend's contact form limit

const INPUT =
  "w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition-shadow placeholder:text-gray-400 focus:border-transparent focus:ring-2 focus:ring-blue-500";
const LABEL = "mb-1.5 block text-sm font-medium text-gray-800";

function Contact() {
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ name: "", email: "", message: "" });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSending(true);
    try {
      await sendContactMessage(form.name, form.email, form.message);
      setSent(true);
    } catch (err) {
      setError(apiErrorMessage(err, "Something went wrong. Please try again."));
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      <PageHero
        eyebrow="Contact us"
        title={
          <>
            We&apos;d love to <span className="text-blue-500">hear from you</span>
          </>
        }
        subtitle="Questions, feedback, or just want to say hi? Send a message and we'll get back to you."
      />

      <section className="bg-white px-6 py-16 md:px-12 md:py-20">
        <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[1fr_1.4fr]">
          {/* Ways to reach us */}
          <motion.div {...reveal()} className="space-y-4">
            <a href={`mailto:${EMAIL}`} className="group block rounded-3xl border border-gray-200 p-6 transition-colors hover:border-blue-300">
              <p className="text-xs font-semibold uppercase tracking-widest text-gray-500">Email</p>
              <p className="mt-2 font-pop text-lg font-semibold group-hover:text-blue-600">{EMAIL}</p>
              <p className="mt-1 text-sm text-gray-600">Best for anything detailed.</p>
            </a>
            <Link href="/support" className="group block rounded-3xl border border-gray-200 p-6 transition-colors hover:border-blue-300">
              <p className="text-xs font-semibold uppercase tracking-widest text-gray-500">Already playing?</p>
              <p className="mt-2 font-pop text-lg font-semibold group-hover:text-blue-600">Use Support in the app</p>
              <p className="mt-1 text-sm text-gray-600">We&apos;ll see your account details, so we can help faster.</p>
            </Link>
            <div className="rounded-3xl bg-grey p-6">
              <p className="text-xs font-semibold uppercase tracking-widest text-gray-500">Based in</p>
              <p className="mt-2 font-pop text-lg font-semibold">New Delhi, India</p>
            </div>
          </motion.div>

          {/* Form */}
          <motion.div {...reveal(0.08)} className="rounded-3xl border border-gray-200 p-6 md:p-10">
            {sent ? (
              <div role="status" className="flex h-full flex-col items-center justify-center py-12 text-center">
                <span className="flex h-14 w-14 items-center justify-center rounded-full bg-green-600/10 font-pop text-2xl font-semibold text-green-700" aria-hidden="true">
                  ✓
                </span>
                <h2 className="mt-5 font-pop text-2xl font-semibold">Message sent</h2>
                <p className="mt-2 max-w-sm text-gray-600">Thanks for reaching out. We&apos;ll reply to {form.email || "your email"} as soon as we can.</p>
                <button
                  type="button"
                  onClick={() => {
                    setSent(false);
                    setForm({ name: "", email: "", message: "" });
                  }}
                  className="mt-6 text-sm font-semibold text-blue-600 hover:underline"
                >
                  Send another message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <h2 className="font-pop text-2xl font-semibold">Send a message</h2>
                {error && (
                  <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
                    {error}
                  </p>
                )}
                <div className="grid gap-5 sm:grid-cols-2">
                  <div>
                    <label htmlFor="contact-name" className={LABEL}>
                      Name
                    </label>
                    <input id="contact-name" name="name" type="text" autoComplete="name" required value={form.name} onChange={handleChange} placeholder="Your name" className={INPUT} />
                  </div>
                  <div>
                    <label htmlFor="contact-email" className={LABEL}>
                      Email
                    </label>
                    <input id="contact-email" name="email" type="email" autoComplete="email" required value={form.email} onChange={handleChange} placeholder="you@example.com" className={INPUT} />
                  </div>
                </div>
                <div>
                  <div className="mb-1.5 flex items-baseline justify-between">
                    <label htmlFor="contact-message" className="text-sm font-medium text-gray-800">
                      Message
                    </label>
                    <span className="text-xs tabular-nums text-gray-400">
                      {form.message.length}/{MAX_MESSAGE}
                    </span>
                  </div>
                  <textarea
                    id="contact-message"
                    name="message"
                    required
                    rows={6}
                    maxLength={MAX_MESSAGE}
                    value={form.message}
                    onChange={handleChange}
                    placeholder="How can we help?"
                    className={`${INPUT} resize-y`}
                  />
                </div>
                <button
                  type="submit"
                  disabled={sending}
                  className="w-full rounded-xl bg-btn-blue px-8 py-4 text-base font-semibold text-white transition-colors duration-200 hover:bg-blue-600 disabled:opacity-60 sm:w-auto"
                >
                  {sending ? "Sending…" : "Send message"}
                </button>
              </form>
            )}
          </motion.div>
        </div>
      </section>
    </>
  );
}

export default Contact;
