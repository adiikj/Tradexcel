import React from "react";

// The assistant replies in a small markdown subset: **bold**, *italic*,
// "- " and "1. " lists, and paragraphs. Rendered as React elements (never
// raw HTML), so a reply can't inject markup.

function inline(text: string, keyPrefix: string): React.ReactNode[] {
  return text.split(/(\*\*[^*]+\*\*|\*[^*\s][^*]*\*)/g).map((part, i) => {
    const key = `${keyPrefix}-${i}`;
    if (/^\*\*[^*]+\*\*$/.test(part)) return <strong key={key} className="font-semibold">{part.slice(2, -2)}</strong>;
    if (/^\*[^*]+\*$/.test(part)) return <em key={key}>{part.slice(1, -1)}</em>;
    return part;
  });
}

type Block = { kind: "p" | "ul" | "ol"; lines: string[] };

function toBlocks(text: string): Block[] {
  const blocks: Block[] = [];
  for (const raw of text.split("\n")) {
    const line = raw.trim();
    const kind = /^- /.test(line) ? "ul" : /^\d+\.\s/.test(line) ? "ol" : "p";
    const content = kind === "ul" ? line.slice(2) : kind === "ol" ? line.replace(/^\d+\.\s/, "") : line;
    const last = blocks[blocks.length - 1];
    if (!line) {
      blocks.push({ kind: "p", lines: [] }); // blank line: paragraph break
    } else if (last && last.kind === kind && (kind !== "p" || last.lines.length > 0)) {
      last.lines.push(content);
    } else {
      blocks.push({ kind, lines: [content] });
    }
  }
  return blocks.filter((b) => b.lines.length > 0);
}

export default function ChatMarkdown({ text }: { text: string }) {
  return (
    <div className="space-y-2">
      {toBlocks(text).map((block, b) => {
        if (block.kind === "ul" || block.kind === "ol") {
          const List = block.kind;
          return (
            <List key={b} className={`space-y-1 pl-5 ${block.kind === "ul" ? "list-disc" : "list-decimal"}`}>
              {block.lines.map((line, i) => (
                <li key={i}>{inline(line, `${b}-${i}`)}</li>
              ))}
            </List>
          );
        }
        return (
          <p key={b}>
            {block.lines.map((line, i) => (
              <React.Fragment key={i}>
                {i > 0 && <br />}
                {inline(line, `${b}-${i}`)}
              </React.Fragment>
            ))}
          </p>
        );
      })}
    </div>
  );
}
