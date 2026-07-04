"use client";
import React, { useState } from "react";
import { motion } from "framer-motion";
import { FiMail, FiMapPin, FiPhone, FiCheckCircle } from "react-icons/fi";

const details = [
  { icon: FiMail, label: "Email", value: "contact@mocket.app" },
  { icon: FiMapPin, label: "Office", value: "New Delhi, India" },
  { icon: FiPhone, label: "Phone", value: "+91 9876 543 210" },
];

function Contact() {
  const [sent, setSent] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", message: "" });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSent(true);
  };

  return (
    <>
      {/* Hero */}
      <section className="bg-grey w-full px-6 md:px-16 lg:px-24 pt-16 pb-20 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="max-w-3xl mx-auto"
        >
          <p className="text-blue-500 font-pop text-lg font-semibold">Contact us</p>
          <h1 className="py-4 font-pop font-semibold text-4xl md:text-5xl lg:leading-tight">
            We'd love to <span className="text-blue-500">hear from you</span>
          </h1>
          <p className="text-gray-600 text-lg">
            Questions, feedback or just want to say hi? Drop us a message and we'll get back
            to you.
          </p>
        </motion.div>
      </section>

      {/* Content */}
      <section className="bg-white w-full px-6 md:px-16 lg:px-24 py-16 md:py-20">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-10 lg:gap-16 max-w-6xl mx-auto">
          {/* Info */}
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.6 }}
            className="lg:col-span-2"
          >
            <h2 className="text-2xl font-semibold font-pop">Get in touch</h2>
            <p className="text-gray-600 mt-3 leading-relaxed">
              Mocket is a portfolio project built to showcase a real trading engine. Reach
              out through any of the channels below.
            </p>
            <div className="space-y-6 mt-8">
              {details.map((d) => {
                const Icon = d.icon;
                return (
                  <div key={d.label} className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center text-blue-500 text-xl">
                      <Icon />
                    </div>
                    <div>
                      <div className="text-sm text-gray-500">{d.label}</div>
                      <div className="font-medium text-gray-800">{d.value}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>

          {/* Form */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.6 }}
            className="lg:col-span-3 bg-grey rounded-3xl p-8 md:p-10"
          >
            {sent ? (
              <div className="h-full flex flex-col items-center justify-center text-center py-10">
                <FiCheckCircle className="text-blue-500 text-5xl" />
                <h3 className="text-2xl font-semibold font-pop mt-4">Message sent!</h3>
                <p className="text-gray-600 mt-2">
                  Thanks for reaching out, {form.name || "friend"}. We'll be in touch soon.
                </p>
                <button
                  onClick={() => {
                    setSent(false);
                    setForm({ name: "", email: "", message: "" });
                  }}
                  className="mt-6 text-btn-blue font-medium text-sm"
                >
                  Send another message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Name
                  </label>
                  <input
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    required
                    placeholder="Your name"
                    className="w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    name="email"
                    type="email"
                    value={form.email}
                    onChange={handleChange}
                    required
                    placeholder="you@example.com"
                    className="w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Message
                  </label>
                  <textarea
                    name="message"
                    value={form.message}
                    onChange={handleChange}
                    required
                    rows={5}
                    placeholder="How can we help?"
                    className="w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full sm:w-auto px-10 py-3.5 rounded-lg bg-btn-blue text-white text-sm font-medium hover:bg-blue-500 transition-colors"
                >
                  Send Message
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
