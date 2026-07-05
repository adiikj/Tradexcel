"use client";
import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { FiUserPlus, FiDollarSign, FiActivity, FiAward } from "react-icons/fi";

const steps = [
  {
    icon: FiUserPlus,
    title: "Create your account",
    desc: "Sign up in under a minute with your email or phone. No payment details, no real money, ever.",
  },
  {
    icon: FiDollarSign,
    title: "Get ₹1,00,000 virtual cash",
    desc: "Your wallet is funded instantly with virtual money to invest however you like.",
  },
  {
    icon: FiActivity,
    title: "Trade real stocks",
    desc: "Buy and sell at live market prices. Track holdings, returns and balance from your portfolio in real time.",
  },
  {
    icon: FiAward,
    title: "Climb the leaderboard",
    desc: "Watch your portfolio grow, enter contests, and compete with traders across Tradexcel to reach the top.",
  },
];

function HowItWorks() {
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
          <p className="text-blue-500 font-pop text-lg font-semibold">How it works</p>
          <h1 className="py-4 font-pop font-semibold text-4xl md:text-5xl lg:leading-tight">
            From sign-up to your first trade in <span className="text-blue-500">minutes</span>
          </h1>
          <p className="text-gray-600 text-lg">
            Four simple steps stand between you and a smarter way to learn the market.
          </p>
        </motion.div>
      </section>

      {/* Steps */}
      <section className="bg-white w-full px-6 md:px-16 lg:px-24 py-16 md:py-24">
        <div className="max-w-3xl mx-auto relative">
          {/* vertical line */}
          <div className="hidden sm:block absolute left-8 top-4 bottom-4 w-px bg-blue-100" />
          <div className="space-y-12">
            {steps.map((s, i) => {
              const Icon = s.icon;
              return (
                <motion.div
                  key={s.title}
                  initial={{ opacity: 0, x: -30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, amount: 0.4 }}
                  transition={{ duration: 0.5 }}
                  className="relative flex items-start gap-6"
                >
                  <div className="relative z-10 shrink-0 w-16 h-16 rounded-2xl bg-btn-blue text-white flex items-center justify-center text-2xl shadow-md">
                    <Icon />
                  </div>
                  <div className="pt-1">
                    <div className="text-blue-500 font-pop font-semibold text-sm">
                      STEP {i + 1}
                    </div>
                    <h3 className="text-xl md:text-2xl font-semibold font-pop mt-1">
                      {s.title}
                    </h3>
                    <p className="text-gray-600 mt-2 leading-relaxed">{s.desc}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        <div className="text-center mt-16">
          <Link href="/signup">
            <button className="px-10 py-4 rounded-lg bg-btn-blue text-white text-sm font-medium">
              Create Your Free Account
            </button>
          </Link>
          <p className="text-gray-500 text-sm mt-4">
            Already have an account?{" "}
            <Link href="/signin" className="text-blue-500 font-medium">
              Sign in
            </Link>
          </p>
        </div>
      </section>
    </>
  );
}

export default HowItWorks;
