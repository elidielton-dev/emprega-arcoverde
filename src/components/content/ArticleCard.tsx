import React from "react";
import Link from "next/link";

type ArticleCardProps = {
  href: string;
  title: string;
  readTimeMinutes: number;
  coverImageUrl?: string | null;
};

export function ArticleCard({ href, title, readTimeMinutes, coverImageUrl }: ArticleCardProps) {
  return (
    <Link
      href={href}
      className="group block overflow-hidden rounded-lg border border-[#E6E8EB] bg-white shadow-[0_1px_2px_rgba(28,20,16,0.04)] transition hover:border-[#E65100]/30"
    >
      {coverImageUrl ? (
        <img src={`${coverImageUrl}?v=3`} alt="" className="aspect-[16/9] w-full object-cover" />
      ) : (
        <div className="aspect-[16/9] w-full bg-[#F4F5F7]" aria-hidden="true" />
      )}
      <div className="px-4 pb-4 pt-3.5">
        <p className="text-xs text-[#78716c]">{readTimeMinutes} min</p>
        <h3 className="mt-1.5 line-clamp-3 text-base font-bold leading-snug text-[#1C1410] group-hover:text-[#E65100]">
          {title}
        </h3>
      </div>
    </Link>
  );
}
