import React from "react";

function renderInline(text: string): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  const re = /\*\*(.+?)\*\*/g;
  let last = 0;
  let match: RegExpExecArray | null;
  let key = 0;

  while ((match = re.exec(text)) !== null) {
    if (match.index > last) {
      parts.push(text.slice(last, match.index));
    }
    parts.push(
      <strong key={`b-${key++}`} className="font-semibold text-[#1A1A1A]">
        {match[1]}
      </strong>
    );
    last = match.index + match[0].length;
  }

  if (last < text.length) {
    parts.push(text.slice(last));
  }

  return parts;
}

function isSafeImageSrc(src: string) {
  return src.startsWith("/articles/") && !src.includes("..");
}

export function ArticleBody({ content }: { content: string }) {
  const lines = content.replace(/\r\n/g, "\n").split("\n");
  const blocks: React.ReactNode[] = [];
  let i = 0;
  let key = 0;

  while (i < lines.length) {
    const line = lines[i].trimEnd();
    const trimmed = line.trim();

    if (!trimmed) {
      i += 1;
      continue;
    }

    const imageMatch = trimmed.match(/^!\[([^\]]*)\]\(([^)]+)\)$/);
    if (imageMatch && isSafeImageSrc(imageMatch[2])) {
      blocks.push(
        <figure key={`fig-${key++}`} className="my-8 -mx-1 sm:mx-0">
          <img
            src={imageMatch[2]}
            alt={imageMatch[1] || ""}
            className="w-full aspect-[16/9] object-cover rounded-2xl"
          />
          {imageMatch[1] ? (
            <figcaption className="mt-2 text-[13px] text-[#4B5563] leading-snug">{imageMatch[1]}</figcaption>
          ) : null}
        </figure>
      );
      i += 1;
      continue;
    }

    if (trimmed.startsWith("### ")) {
      blocks.push(
        <h2 key={`h-${key++}`} className="text-xl font-extrabold text-[#1A1A1A] tracking-tight mt-10 mb-3">
          {trimmed.slice(4)}
        </h2>
      );
      i += 1;
      continue;
    }

    if (trimmed.startsWith("## ")) {
      blocks.push(
        <h2 key={`h-${key++}`} className="text-xl font-extrabold text-[#1A1A1A] tracking-tight mt-10 mb-3">
          {trimmed.slice(3)}
        </h2>
      );
      i += 1;
      continue;
    }

    if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
      const items: string[] = [];
      while (i < lines.length && /^\s*[-*]\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^\s*[-*]\s+/, "").trim());
        i += 1;
      }
      blocks.push(
        <ul key={`ul-${key++}`} className="my-4 space-y-2 pl-5 list-disc marker:text-[#E65100]">
          {items.map((item, idx) => (
            <li key={idx} className="text-[17px] leading-[1.7] text-[#1A1A1A] pl-1">
              {renderInline(item)}
            </li>
          ))}
        </ul>
      );
      continue;
    }

    const para: string[] = [trimmed];
    i += 1;
    while (
      i < lines.length &&
      lines[i].trim() &&
      !lines[i].trim().startsWith("### ") &&
      !lines[i].trim().startsWith("## ") &&
      !lines[i].trim().startsWith("- ") &&
      !lines[i].trim().startsWith("* ") &&
      !lines[i].trim().startsWith("![")
    ) {
      para.push(lines[i].trim());
      i += 1;
    }

    blocks.push(
      <p key={`p-${key++}`} className="text-[17px] leading-[1.75] text-[#1A1A1A] mt-4 first:mt-0">
        {renderInline(para.join(" "))}
      </p>
    );
  }

  return <div className="article-body max-w-[65ch]">{blocks}</div>;
}
