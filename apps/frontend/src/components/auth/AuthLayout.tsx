"use client";
import React from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import dashboard from "../../assets/dashboard.png";

// Shared by sign in and sign up: the form on the left, a calm product panel on
// the right (desktop only) that shows what's waiting on the other side.
export const AUTH_INPUT =
  "w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition-shadow placeholder:text-gray-400 focus:border-transparent focus:ring-2 focus:ring-blue-500";
export const AUTH_LABEL = "mb-1.5 block text-sm font-medium text-gray-800";
export const AUTH_SUBMIT =
  "flex w-full items-center justify-center rounded-xl bg-btn-blue px-4 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-60";

export function Divider({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-4">
      <span className="h-px flex-1 bg-gray-200" />
      <span className="text-xs font-medium text-gray-500">{children}</span>
      <span className="h-px flex-1 bg-gray-200" />
    </div>
  );
}

export function FormError({ children }: { children: React.ReactNode }) {
  return (
    <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
      {children}
    </p>
  );
}

export function Spinner() {
  return <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/40 border-t-white" aria-hidden="true" />;
}

function AuthLayout({
  title,
  subtitle,
  panelTitle,
  points,
  children,
}: {
  title: string;
  subtitle: React.ReactNode;
  panelTitle: string;
  points: string[];
  children: React.ReactNode;
}) {
  return (
    <div className="bg-grey px-4 py-10 font-pop md:py-16">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="mx-auto grid max-w-5xl overflow-hidden rounded-[2rem] border border-gray-200 bg-white lg:grid-cols-[1fr_1.05fr]"
      >
        <div className="px-6 py-10 sm:px-12 lg:py-12">
          <h1 className="text-3xl font-semibold text-gray-900">{title}</h1>
          <p className="mt-2 text-gray-600">{subtitle}</p>
          <div className="mt-8">{children}</div>
        </div>

        <div className="relative hidden flex-col justify-between overflow-hidden border-l border-gray-200 bg-grey p-10 lg:flex">
          <div>
            <p className="text-sm font-semibold uppercase tracking-widest text-blue-600">Tradexcel</p>
            <p className="mt-3 text-2xl font-semibold leading-snug text-gray-900">{panelTitle}</p>
            <ul className="mt-6 space-y-3">
              {points.map((point) => (
                <li key={point} className="flex gap-3 text-sm text-gray-700">
                  <span aria-hidden="true" className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-btn-blue" />
                  {point}
                </li>
              ))}
            </ul>
          </div>
          {/* The real dashboard, whole and uncropped */}
          <div className="mt-10 overflow-hidden rounded-2xl border border-gray-200 shadow-xl">
            <Image src={dashboard} alt="" sizes="480px" className="block h-auto w-full" />
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export default AuthLayout;
