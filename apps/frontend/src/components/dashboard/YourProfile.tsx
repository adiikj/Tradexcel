"use client";
import React, { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import { PiEye, PiEyeSlash } from "react-icons/pi";
import { FcGoogle } from "react-icons/fc";
import Header from "./Header";
import Vheader from "./Vheader";
import { getUserProfile, updateUserProfile, changePasswordAndPin, updateAvatar } from "../../api/api";
import { useAsyncEffect } from "../../hooks/useAsyncEffect";
import { apiErrorMessage } from "../../api/http";
import Avatar from "../ui/Avatar";

const SURFACE = "rounded-2xl bg-white shadow-sm ring-1 ring-gray-200 dark:bg-gray-900 dark:shadow-none dark:ring-gray-800";
const INPUT =
  "w-full rounded-xl bg-gray-100 px-3.5 py-2.5 text-sm outline-none placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500 disabled:opacity-60 dark:bg-gray-800";
const LABEL = "mb-1.5 block text-sm font-medium";
const HINT = "mt-1 text-xs text-gray-500 dark:text-gray-400";
const PRIMARY = "rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50";
const SECONDARY =
  "rounded-xl px-4 py-2 text-sm font-medium ring-1 ring-gray-200 hover:bg-gray-50 disabled:opacity-50 dark:ring-gray-700 dark:hover:bg-gray-800";

// Mirrors the backend's rules (user.controller.ts), so problems show before saving.
const USERNAME_RE = /^[a-zA-Z0-9_]{3,20}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PIN_RE = /^\d{4}$/;

type Details = { name: string; username: string; email: string; dob: string };
const EMPTY_DETAILS: Details = { name: "", username: "", email: "", dob: "" };

function SecretInput({
  id,
  value,
  onChange,
  numeric = false,
  autoComplete,
  invalid,
  describedBy,
}: {
  id: string;
  value: string;
  onChange: (v: string) => void;
  numeric?: boolean;
  autoComplete: string;
  invalid?: boolean;
  describedBy?: string;
}) {
  const [shown, setShown] = useState(false);
  return (
    <div className="relative">
      <input
        id={id}
        type={shown ? "text" : "password"}
        value={value}
        onChange={(e) => onChange(numeric ? e.target.value.replace(/\D/g, "").slice(0, 4) : e.target.value)}
        inputMode={numeric ? "numeric" : undefined}
        maxLength={numeric ? 4 : undefined}
        autoComplete={autoComplete}
        aria-invalid={invalid || undefined}
        aria-describedby={describedBy}
        className={`${INPUT} pr-11 ${numeric ? "font-mono tracking-[0.4em]" : ""} ${invalid ? "ring-2 ring-red-500" : ""}`}
      />
      <button
        type="button"
        onClick={() => setShown((s) => !s)}
        aria-label={shown ? "Hide" : "Show"}
        aria-pressed={shown}
        className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
      >
        {shown ? <PiEyeSlash aria-hidden="true" className="h-4 w-4" /> : <PiEye aria-hidden="true" className="h-4 w-4" />}
      </button>
    </div>
  );
}

function Section({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return (
    <section className={`grid gap-6 p-5 md:p-6 lg:grid-cols-3 ${SURFACE}`}>
      <div>
        <h2 className="text-base font-semibold">{title}</h2>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{description}</p>
      </div>
      <div className="lg:col-span-2">{children}</div>
    </section>
  );
}

function YourProfile() {
  const [loaded, setLoaded] = useState(false);
  const [saved, setSaved] = useState<Details>(EMPTY_DETAILS);
  const [details, setDetails] = useState<Details>(EMPTY_DETAILS);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [flags, setFlags] = useState({ hasGoogleLogin: false, hasPassword: false, hasPin: false });
  const [streak, setStreak] = useState({ current: 0, longest: 0 });
  const [savingDetails, setSavingDetails] = useState(false);
  const [savingAvatar, setSavingAvatar] = useState(false);

  const [pw, setPw] = useState({ current: "", next: "", confirm: "" });
  const [savingPw, setSavingPw] = useState(false);
  const [pin, setPin] = useState({ current: "", next: "" });
  const [savingPin, setSavingPin] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // One object URL per picked file, released when it changes or on unmount.
  const previewUrl = useMemo(() => (avatarFile ? URL.createObjectURL(avatarFile) : null), [avatarFile]);
  useEffect(() => () => void (previewUrl && URL.revokeObjectURL(previewUrl)), [previewUrl]);

  const loadProfile = async (isActive: () => boolean = () => true) => {
    try {
      const response = await getUserProfile();
      if (!isActive() || !response?.data) return;
      const p = response.data;
      const next: Details = {
        name: p.name || "",
        username: p.username || "",
        email: p.email || "",
        dob: p.dob ? new Date(p.dob).toISOString().split("T")[0] : "",
      };
      setSaved(next);
      setDetails(next);
      setAvatarUrl(p.avatar || null);
      setFlags({ hasGoogleLogin: !!p.hasGoogleLogin, hasPassword: !!p.hasPassword, hasPin: !!p.hasPin });
      setStreak({ current: p.currentStreak || 0, longest: p.longestStreak || 0 });
    } catch (err) {
      if (isActive()) toast.error(apiErrorMessage(err, "Couldn't load your profile."));
    } finally {
      if (isActive()) setLoaded(true);
    }
  };

  // Mount-only load.
  useAsyncEffect((isActive) => loadProfile(isActive), []);

  // ---- personal details ----
  const changed = (Object.keys(details) as (keyof Details)[]).filter((k) => details[k].trim() !== saved[k]);
  const detailErrors: Partial<Record<keyof Details, string>> = {};
  if (details.name.trim().length < 2) detailErrors.name = "Enter at least 2 characters.";
  if (!USERNAME_RE.test(details.username.trim())) detailErrors.username = "3 to 20 letters, numbers or underscores.";
  if (!EMAIL_RE.test(details.email.trim())) detailErrors.email = "Enter a valid email address.";
  // An empty date of birth is never sent (the API can't parse it), so clearing it alone isn't a saveable change.
  const toSend = changed.filter((k) => !(k === "dob" && !details.dob.trim()));
  const canSaveDetails = loaded && toSend.length > 0 && Object.keys(detailErrors).length === 0 && !savingDetails;

  const saveDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSaveDetails) return;
    // Only send what changed.
    const payload = Object.fromEntries(toSend.map((k) => [k, details[k].trim()]));
    setSavingDetails(true);
    try {
      await updateUserProfile(payload);
      const next = { ...details, name: details.name.trim(), username: details.username.trim(), email: details.email.trim() };
      setSaved(next);
      setDetails(next);
      toast.success("Profile saved");
    } catch (err) {
      toast.error(apiErrorMessage(err, "Couldn't save your profile."));
    } finally {
      setSavingDetails(false);
    }
  };

  // ---- photo ----
  const saveAvatar = async () => {
    if (!avatarFile) return;
    setSavingAvatar(true);
    try {
      const payload = new FormData();
      payload.append("avatar", avatarFile);
      const res = await updateAvatar(payload);
      setAvatarUrl(res?.data?.avatar ?? avatarUrl);
      setAvatarFile(null);
      toast.success("Photo updated");
    } catch (err) {
      toast.error(apiErrorMessage(err, "Couldn't upload your photo."));
    } finally {
      setSavingAvatar(false);
    }
  };

  // ---- password ----
  const pwTooShort = pw.next.length > 0 && pw.next.length < 8;
  const pwMismatch = pw.confirm.length > 0 && pw.confirm !== pw.next;
  const canSavePw =
    !savingPw && pw.next.length >= 8 && pw.confirm === pw.next && (!flags.hasPassword || pw.current.length > 0);

  const savePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSavePw) return;
    setSavingPw(true);
    try {
      await changePasswordAndPin({ newPassword: pw.next, ...(flags.hasPassword ? { oldPassword: pw.current } : {}) });
      toast.success(flags.hasPassword ? "Password changed" : "Password set");
      setPw({ current: "", next: "", confirm: "" });
      setFlags((f) => ({ ...f, hasPassword: true }));
    } catch (err) {
      toast.error(apiErrorMessage(err, "Couldn't update your password."));
    } finally {
      setSavingPw(false);
    }
  };

  // ---- PIN ----
  const canSavePin = !savingPin && PIN_RE.test(pin.next) && (!flags.hasPin || PIN_RE.test(pin.current));

  const savePin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSavePin) return;
    setSavingPin(true);
    try {
      await changePasswordAndPin({ newPin: pin.next, ...(flags.hasPin ? { oldPin: pin.current } : {}) });
      toast.success(flags.hasPin ? "PIN changed" : "PIN set");
      setPin({ current: "", next: "" });
      setFlags((f) => ({ ...f, hasPin: true }));
    } catch (err) {
      toast.error(apiErrorMessage(err, "Couldn't update your PIN."));
    } finally {
      setSavingPin(false);
    }
  };

  const field = (key: keyof Details) => ({
    id: `profile-${key}`,
    value: details[key],
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => setDetails((d) => ({ ...d, [key]: e.target.value })),
    disabled: !loaded,
    "aria-invalid": (details[key] !== saved[key] && !!detailErrors[key]) || undefined,
    "aria-describedby": `profile-${key}-hint`,
  });
  const showError = (key: keyof Details) => details[key] !== saved[key] && detailErrors[key];

  return (
    <div className="min-h-screen bg-gray-50 font-pop text-gray-900 transition-colors duration-300 dark:bg-gray-800 dark:text-white">
      <Header />
      <div className="flex">
        <Vheader />
        <main className="mb-20 min-w-0 flex-1 px-5 py-6 md:mb-0 md:px-8 md:py-8 lg:px-12 lg:py-10">
          <div className="mx-auto max-w-4xl space-y-5">
            <div>
              <h1 className="text-2xl font-bold md:text-3xl">Your profile</h1>
              <div className="mt-1 h-0.5 w-24 rounded-full bg-blue-600 dark:bg-blue-400 animate-line" />
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Manage how you appear to other traders and how you sign in.</p>
            </div>

            {/* Identity */}
            <div className={`flex flex-wrap items-center gap-5 p-5 md:p-6 ${SURFACE}`}>
              <div className="relative">
                <Avatar src={previewUrl ?? avatarUrl} size={96} alt="" className="h-20 w-20 rounded-full object-cover ring-1 ring-gray-200 dark:ring-gray-700" />
              </div>
              <div className="min-w-0 flex-1">
                {loaded ? (
                  <>
                    <p className="truncate text-lg font-semibold">{saved.name || "Your name"}</p>
                    <p className="truncate text-sm text-gray-500 dark:text-gray-400">@{saved.username}</p>
                    {streak.current > 0 && (
                      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        <span className="font-semibold text-amber-600 dark:text-amber-400">{streak.current}-day</span> login streak · best {streak.longest}
                      </p>
                    )}
                  </>
                ) : (
                  <div className="space-y-2">
                    <span className="block h-5 w-40 animate-pulse rounded bg-gray-100 dark:bg-gray-800" />
                    <span className="block h-4 w-24 animate-pulse rounded bg-gray-100 dark:bg-gray-800" />
                  </div>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) setAvatarFile(file);
                    e.target.value = "";
                  }}
                />
                {avatarFile ? (
                  <>
                    <button type="button" onClick={() => setAvatarFile(null)} disabled={savingAvatar} className={SECONDARY}>
                      Cancel
                    </button>
                    <button type="button" onClick={saveAvatar} disabled={savingAvatar} className={PRIMARY}>
                      {savingAvatar ? "Uploading…" : "Save photo"}
                    </button>
                  </>
                ) : (
                  <>
                    <button type="button" onClick={() => fileRef.current?.click()} disabled={!loaded} className={SECONDARY}>
                      Change photo
                    </button>
                    {saved.username && (
                      <Link href={`/u/${saved.username}`} className={SECONDARY}>
                        View public profile
                      </Link>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Personal details */}
            <Section title="Personal details" description="Your name and username are shown on your public profile and the leaderboard. Email and birthday stay private.">
              <form onSubmit={saveDetails} className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="profile-name" className={LABEL}>
                    Name
                  </label>
                  <input {...field("name")} autoComplete="name" className={`${INPUT} ${showError("name") ? "ring-2 ring-red-500" : ""}`} />
                  <p id="profile-name-hint" className={showError("name") ? `${HINT} !text-red-600 dark:!text-red-400` : "sr-only"}>
                    {showError("name") || ""}
                  </p>
                </div>
                <div>
                  <label htmlFor="profile-username" className={LABEL}>
                    Username
                  </label>
                  <div className="relative">
                    <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-gray-400">@</span>
                    <input {...field("username")} autoComplete="username" className={`${INPUT} pl-8 ${showError("username") ? "ring-2 ring-red-500" : ""}`} />
                  </div>
                  <p id="profile-username-hint" className={`${HINT} ${showError("username") ? "!text-red-600 dark:!text-red-400" : ""}`}>
                    {showError("username") || "3 to 20 letters, numbers or underscores. Changes your profile link."}
                  </p>
                </div>
                <div>
                  <label htmlFor="profile-email" className={LABEL}>
                    Email
                  </label>
                  <input {...field("email")} type="email" autoComplete="email" className={`${INPUT} ${showError("email") ? "ring-2 ring-red-500" : ""}`} />
                  <p id="profile-email-hint" className={showError("email") ? `${HINT} !text-red-600 dark:!text-red-400` : "sr-only"}>
                    {showError("email") || ""}
                  </p>
                </div>
                <div>
                  <label htmlFor="profile-dob" className={LABEL}>
                    Date of birth <span className="font-normal text-gray-400">(optional)</span>
                  </label>
                  <input {...field("dob")} type="date" className={INPUT} />
                  <p id="profile-dob-hint" className="sr-only">
                    Optional
                  </p>
                </div>
                <div className="flex items-center justify-end gap-2 sm:col-span-2">
                  {changed.length > 0 && (
                    <button type="button" onClick={() => setDetails(saved)} disabled={savingDetails} className={SECONDARY}>
                      Discard
                    </button>
                  )}
                  <button type="submit" disabled={!canSaveDetails} className={PRIMARY}>
                    {savingDetails ? "Saving…" : "Save changes"}
                  </button>
                </div>
              </form>
            </Section>

            {/* Security */}
            <Section title="Sign-in & security" description="Ways you can sign in to Tradexcel. A PIN is a quick 4-digit alternative to your password.">
              <div className="space-y-6">
                <div className="flex items-center justify-between gap-3 rounded-xl bg-gray-50 px-4 py-3 dark:bg-gray-800">
                  <span className="flex items-center gap-2.5 text-sm font-medium">
                    <FcGoogle aria-hidden="true" className="h-5 w-5" /> Google
                  </span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      flags.hasGoogleLogin ? "bg-green-600/10 text-green-700 dark:text-green-300" : "bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-300"
                    }`}
                  >
                    {flags.hasGoogleLogin ? "Connected" : "Not connected"}
                  </span>
                </div>

                <form onSubmit={savePassword} className="space-y-4 border-t border-gray-100 pt-6 dark:border-gray-800">
                  <div>
                    <h3 className="text-sm font-semibold">{flags.hasPassword ? "Change password" : "Set a password"}</h3>
                    {!flags.hasPassword && (
                      <p className={HINT}>You currently sign in with Google only. Add a password to sign in with your email too.</p>
                    )}
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    {flags.hasPassword && (
                      <div className="sm:col-span-2 sm:max-w-[calc(50%-0.5rem)]">
                        <label htmlFor="pw-current" className={LABEL}>
                          Current password
                        </label>
                        <SecretInput id="pw-current" value={pw.current} onChange={(v) => setPw((p) => ({ ...p, current: v }))} autoComplete="current-password" />
                      </div>
                    )}
                    <div>
                      <label htmlFor="pw-next" className={LABEL}>
                        New password
                      </label>
                      <SecretInput
                        id="pw-next"
                        value={pw.next}
                        onChange={(v) => setPw((p) => ({ ...p, next: v }))}
                        autoComplete="new-password"
                        invalid={pwTooShort}
                        describedBy="pw-next-hint"
                      />
                      <p id="pw-next-hint" className={`${HINT} ${pwTooShort ? "!text-red-600 dark:!text-red-400" : ""}`}>
                        At least 8 characters.
                      </p>
                    </div>
                    <div>
                      <label htmlFor="pw-confirm" className={LABEL}>
                        Confirm new password
                      </label>
                      <SecretInput
                        id="pw-confirm"
                        value={pw.confirm}
                        onChange={(v) => setPw((p) => ({ ...p, confirm: v }))}
                        autoComplete="new-password"
                        invalid={pwMismatch}
                        describedBy="pw-confirm-hint"
                      />
                      <p id="pw-confirm-hint" className={pwMismatch ? `${HINT} !text-red-600 dark:!text-red-400` : "sr-only"}>
                        {pwMismatch ? "Passwords don't match." : ""}
                      </p>
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <button type="submit" disabled={!canSavePw} className={PRIMARY}>
                      {savingPw ? "Saving…" : flags.hasPassword ? "Update password" : "Set password"}
                    </button>
                  </div>
                </form>

                <form onSubmit={savePin} className="space-y-4 border-t border-gray-100 pt-6 dark:border-gray-800">
                  <div>
                    <h3 className="text-sm font-semibold">{flags.hasPin ? "Change PIN" : "Set a PIN"}</h3>
                    {!flags.hasPin && <p className={HINT}>Sign in with 4 digits instead of typing your password.</p>}
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    {flags.hasPin && (
                      <div>
                        <label htmlFor="pin-current" className={LABEL}>
                          Current PIN
                        </label>
                        <SecretInput id="pin-current" numeric value={pin.current} onChange={(v) => setPin((p) => ({ ...p, current: v }))} autoComplete="off" />
                      </div>
                    )}
                    <div>
                      <label htmlFor="pin-next" className={LABEL}>
                        New PIN
                      </label>
                      <SecretInput id="pin-next" numeric value={pin.next} onChange={(v) => setPin((p) => ({ ...p, next: v }))} autoComplete="off" describedBy="pin-next-hint" />
                      <p id="pin-next-hint" className={HINT}>
                        Exactly 4 digits.
                      </p>
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <button type="submit" disabled={!canSavePin} className={PRIMARY}>
                      {savingPin ? "Saving…" : flags.hasPin ? "Update PIN" : "Set PIN"}
                    </button>
                  </div>
                </form>
              </div>
            </Section>
          </div>
        </main>
      </div>
    </div>
  );
}

export default YourProfile;
