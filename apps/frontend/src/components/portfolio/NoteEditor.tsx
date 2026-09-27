"use client";
import { useState } from "react";
import toast from "react-hot-toast";
import { PiNotePencil } from "react-icons/pi";
import { updateTransactionNote } from "../../api/api";

const MAX = 500;

// A trade-journal note: shows the note (or an "Add note" link) and edits it in place.
function NoteEditor({ transactionId, note, onSaved }: { transactionId: string; note: string | null; onSaved?: (note: string | null) => void }) {
  const [saved, setSaved] = useState(note);
  const [draft, setDraft] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (draft == null) return;
    try {
      setSaving(true);
      const next = await updateTransactionNote(transactionId, draft);
      setSaved(next);
      setDraft(null);
      onSaved?.(next);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "We couldn't save that note.");
    } finally {
      setSaving(false);
    }
  };

  if (draft != null) {
    return (
      <div className="mt-1.5 space-y-1.5">
        <textarea
          aria-label="Trade note"
          autoFocus
          rows={2}
          maxLength={MAX}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Escape") setDraft(null);
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) save();
          }}
          placeholder="Why did you make this trade? What would you do differently?"
          className="w-full resize-y rounded-lg bg-gray-100 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800"
        />
        <div className="flex items-center gap-2 text-xs">
          <button type="button" onClick={save} disabled={saving} className="rounded-lg bg-blue-600 px-3 py-1 font-medium text-white hover:bg-blue-700 disabled:opacity-50">
            {saving ? "Saving..." : "Save"}
          </button>
          <button type="button" onClick={() => setDraft(null)} className="px-2 py-1 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">
            Cancel
          </button>
          <span className="ml-auto tabular-nums text-gray-400">
            {draft.length}/{MAX}
          </span>
        </div>
      </div>
    );
  }

  return saved ? (
    <button type="button" onClick={() => setDraft(saved)} className="mt-1 block w-full text-left text-xs italic text-gray-600 hover:underline dark:text-gray-300">
      “{saved}”
    </button>
  ) : (
    <button type="button" onClick={() => setDraft("")} className="mt-1 inline-flex items-center gap-1 text-xs text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400">
      <PiNotePencil aria-hidden="true" className="h-3.5 w-3.5" /> Add note
    </button>
  );
}

export default NoteEditor;
