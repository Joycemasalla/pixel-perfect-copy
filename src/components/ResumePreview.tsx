import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

type ResumePreviewProps = {
  content: string;
  /** Renders without card chrome, used for the print-only copy. */
  plain?: boolean;
};

type Block =
  | { kind: "name"; text: string }
  | { kind: "heading"; text: string }
  | { kind: "bullets"; items: string[] }
  | { kind: "text"; text: string };

const HEADING = /^[A-ZÀ-Ü0-9][A-ZÀ-Ü0-9\s/&.\-()]{2,}$/;

function parseResume(content: string): Block[] {
  const lines = content.replace(/\r/g, "").split("\n");
  const blocks: Block[] = [];
  let bullets: string[] = [];
  let namePlaced = false;

  const flush = () => {
    if (bullets.length) {
      blocks.push({ kind: "bullets", items: bullets });
      bullets = [];
    }
  };

  for (const raw of lines) {
    const line = raw.trim();
    if (!line) {
      flush();
      continue;
    }

    const bullet = line.match(/^(?:[-•*–]|\d+\.)\s+(.*)$/);
    if (bullet) {
      bullets.push(bullet[1] ?? "");
      continue;
    }

    flush();

    if (!namePlaced) {
      namePlaced = true;
      blocks.push({ kind: "name", text: line.replace(/^#+\s*/, "") });
      continue;
    }

    const plain = line.replace(/^#+\s*/, "").replace(/\*\*/g, "").replace(/:$/, "");
    if (HEADING.test(plain) && plain.length <= 40) {
      blocks.push({ kind: "heading", text: plain });
      continue;
    }

    blocks.push({ kind: "text", text: plain });
  }

  flush();
  return blocks;
}

export function ResumePreview({ content, plain = false }: ResumePreviewProps) {
  const blocks = parseResume(content);

  return (
    <article
      className={
        plain ? "leading-relaxed" : "rounded-xl border border-border bg-card p-6 leading-relaxed sm:p-10"
      }
    >
      {blocks.map((block, index) => {
        if (block.kind === "name") {
          return (
            <h3 key={index} className="text-2xl font-bold tracking-tight">
              {block.text}
            </h3>
          );
        }
        if (block.kind === "heading") {
          return (
            <h4
              key={index}
              className="mt-6 border-b border-border pb-1 text-sm font-bold tracking-widest uppercase"
            >
              {block.text}
            </h4>
          );
        }
        if (block.kind === "bullets") {
          return (
            <ul key={index} className="mt-2 list-disc space-y-1 pl-5 text-sm">
              {block.items.map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
          );
        }
        return (
          <p key={index} className="mt-2 text-sm">
            {block.text}
          </p>
        );
      })}
    </article>
  );
}

/**
 * Print-only copy of the optimized resume, mounted as a direct child of <body>
 * so the print stylesheet can hide every other top-level element.
 */
export function ResumePrintSheet({ content }: { content: string }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) return null;

  return createPortal(
    <div className="print-sheet" aria-hidden="true">
      <ResumePreview content={content} plain />
    </div>,
    document.body,
  );
}
