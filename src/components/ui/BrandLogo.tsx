import React from "react";
import Link from "next/link";

interface BrandLogoProps {
  variant?: "horizontal" | "badge" | "compact";
  className?: string;
  isLink?: boolean;
}

export function BrandLogo({ variant = "horizontal", className = "", isLink = true }: BrandLogoProps) {
  const heights = {
    compact: "h-9",
    badge: "h-11",
    horizontal: "h-11 sm:h-12",
  } as const;

  const content = (
    <span className={`inline-flex items-center ${className}`}>
      <img
        src="/brand/logo-emprega.png"
        alt="Emprega Arcoverde"
        className={`${heights[variant]} w-auto max-w-[200px] object-contain object-left`}
      />
    </span>
  );

  if (isLink) {
    return (
      <Link href="/" className="inline-flex items-center">
        {content}
      </Link>
    );
  }

  return content;
}

export function FeiraLogo({ className = "" }: { className?: string }) {
  return (
    <img
      src="/brand/logo-feira.png"
      alt="Feira de Empregabilidade — Arcoverde, oportunidades que transformam"
      className={`h-10 sm:h-11 w-auto max-w-[260px] object-contain object-left ${className}`}
    />
  );
}

export function FeiraLogoBadge({ className = "" }: { className?: string }) {
  return <FeiraLogo className={className} />;
}
