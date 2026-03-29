export function ZealaPetLogo({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 40 40"
      fill="none"
      className={className}
      aria-label="ZealaPet logo"
    >
      {/* Geometric heart shape with paw accent */}
      <path
        d="M20 35L5 20C2 16.5 2 11 5.5 7.5C9 4 14 4 17 7L20 10.5L23 7C26 4 31 4 34.5 7.5C38 11 38 16.5 35 20L20 35Z"
        fill="currentColor"
        opacity="0.9"
      />
      {/* Inner geometric accent */}
      <circle cx="13" cy="14" r="2.5" fill="white" opacity="0.4" />
      <circle cx="27" cy="14" r="2.5" fill="white" opacity="0.4" />
      <circle cx="20" cy="18" r="2" fill="white" opacity="0.3" />
      <ellipse cx="20" cy="23" rx="3.5" ry="2.5" fill="white" opacity="0.25" />
    </svg>
  );
}

export function ZealaPetLogoFull({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <ZealaPetLogo className="h-8 w-8 text-primary" />
      <span className="text-lg font-bold tracking-tight">
        Zeala<span className="text-primary">Pet</span>
      </span>
    </div>
  );
}
