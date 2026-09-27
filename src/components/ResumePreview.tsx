type ResumePreviewProps = {
  content: string;
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
      bullets.push(bullet[1]);
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

export function ResumePreview({ content }: ResumePreviewProps) {
  const blocks = parseResume(content);

  return (
    <article className="print-resume rounded-xl border border-border bg-card p-6 leading-relaxed sm:p-10">
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
