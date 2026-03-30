import mascotImg from "@assets/mascot.jpeg";

export function ZealaPetLogo({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <img
      src={mascotImg}
      alt="ZealaPet mascot"
      className={`${className} rounded-full object-cover object-[center_25%] ring-2 ring-primary/20`}
    />
  );
}

export function ZealaPetLogoFull({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <ZealaPetLogo className="h-9 w-9" />
      <span className="text-lg font-bold tracking-tight">
        Zeala<span className="text-primary">Pet</span>
      </span>
    </div>
  );
}
