type SignatureLoaderVariant = "ios";
type SignatureLoaderSize = "sm" | "md" | "lg";

type SignatureLoaderProps = {
  variant?: SignatureLoaderVariant;
  size?: SignatureLoaderSize;
  className?: string;
};

const SIZE_MAP: Record<
  SignatureLoaderSize,
  {
    frame: string;
    barWidth: string;
    barHeight: string;
    radius: number;
  }
> = {
  sm: {
    frame: "h-4 w-4",
    barWidth: "w-[1.5px]",
    barHeight: "h-[4px]",
    radius: 6,
  },
  md: {
    frame: "h-5 w-5",
    barWidth: "w-[2px]",
    barHeight: "h-[5px]",
    radius: 8,
  },
  lg: {
    frame: "h-10 w-10",
    barWidth: "w-[3px]",
    barHeight: "h-[10px]",
    radius: 16,
  },
};

export type { SignatureLoaderVariant, SignatureLoaderSize };

export function SignatureLoader({
  variant = "ios",
  size = "md",
  className = "",
}: SignatureLoaderProps) {
  const config = SIZE_MAP[size];

  return (
    <div
      className={`relative ${config.frame} text-current ${className}`.trim()}
      aria-hidden="true"
      data-variant={variant}
    >
      {Array.from({ length: 12 }).map((_, index) => (
        <span
          key={index}
          className={`wig-loader-ios-bar absolute left-1/2 top-1/2 ${config.barWidth} ${config.barHeight} -translate-x-1/2 -translate-y-1/2 rounded-full bg-current`}
          style={{
            transform: `translate(-50%, -50%) rotate(${index * 30}deg) translateY(-${config.radius}px)`,
            animationDelay: `${index * 0.075}s`,
          }}
        />
      ))}
    </div>
  );
}
