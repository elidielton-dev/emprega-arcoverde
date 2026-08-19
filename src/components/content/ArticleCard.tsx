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
      className="group bg-white rounded-2xl border border-[#E6E8EB] overflow-hidden hover:border-[#D1D5DB] hover:shadow-[0_8px_24px_rgba(16,24,40,0.06)] transition block"
    >
      {coverImageUrl ? (
        <img src={`${coverImageUrl}?v=3`} alt="" className="w-full aspect-[16/9] object-cover" />
      ) : (
        <div className="w-full aspect-[16/9] bg-[#F4F5F7]" aria-hidden="true" />
      )}
      <div className="px-5 pt-4 pb-5">
        <p className="text-xs text-[#4B5563]">{readTimeMinutes} min</p>
        <h3 className="text-lg font-bold text-[#1A1A1A] mt-1.5 leading-snug line-clamp-3 group-hover:text-[#E65100]">
          {title}
        </h3>
      </div>
    </Link>
  );
}
