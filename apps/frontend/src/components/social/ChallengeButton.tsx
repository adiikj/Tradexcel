"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { PiSword } from "react-icons/pi";
import { createDuel } from "../../api/api";
import Modal from "../ui/Modal";

const LENGTHS = [1, 3, 5];

// Challenge this player to a 1v1 duel: a two-player private contest on 50
// large caps at live prices. They get a notification with a link to accept.
function ChallengeButton({ username }: { username: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [days, setDays] = useState(3);
  const [sending, setSending] = useState(false);

  const send = async () => {
    try {
      setSending(true);
      const res = await createDuel(username, days);
      toast.success(res.message || `Challenge sent to @${username}`);
      router.push("/contest");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "We couldn't send that challenge.");
      setSending(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-medium ring-1 ring-gray-200 hover:bg-gray-50 dark:ring-gray-700 dark:hover:bg-gray-800"
      >
        <PiSword aria-hidden="true" className="h-4 w-4" /> Challenge
      </button>
      {open && (
        <Modal onClose={() => setOpen(false)} label={`Challenge @${username}`} className="rounded-2xl bg-white p-6 text-gray-900 dark:bg-gray-900 dark:text-white">
          <h2 className="text-lg font-semibold">Challenge @{username}</h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            You both get ₹1,00,000 and the same 50 large-cap stocks at live prices. Best net worth at the end wins. Your weekly wallet isn&apos;t touched.
          </p>
          <p className="mb-2 mt-5 text-xs font-medium text-gray-600 dark:text-gray-300" id="duel-length">
            How long?
          </p>
          <div role="group" aria-labelledby="duel-length" className="grid grid-cols-3 gap-2">
            {LENGTHS.map((d) => (
              <button
                key={d}
                type="button"
                aria-pressed={days === d}
                onClick={() => setDays(d)}
                className={`rounded-xl py-2 text-sm font-medium ring-1 transition-colors ${
                  days === d ? "bg-blue-600 text-white ring-blue-600" : "ring-gray-200 hover:bg-gray-50 dark:ring-gray-700 dark:hover:bg-gray-800"
                }`}
              >
                {d} day{d === 1 ? "" : "s"}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={send}
            disabled={sending}
            className="mt-6 w-full rounded-xl bg-blue-600 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {sending ? "Sending…" : "Send challenge"}
          </button>
        </Modal>
      )}
    </>
  );
}

export default ChallengeButton;
