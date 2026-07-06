"use client";

import { getFadeInTransform } from "@/components/ui/_utils/fadeIn";
import { cn } from "@/lib/utils";
import { ReactNode, useEffect, useRef, useState } from "react";

interface FadeInProps {
  children: ReactNode;
  delay?: number;
  className?: string;
  direction?: "up" | "down" | "left" | "right" | "none";
  distance?: number;
}

export function FadeIn({
  children,
  delay = 0,
  className,
  direction = "up",
  distance = 40,
}: FadeInProps) {
  const [isVisible, setIsVisible] = useState(false);
  const domRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
            observer.unobserve(entry.target);
          }
        });
      },
      { rootMargin: "-100px", threshold: 0.1 },
    );

    const currentRef = domRef.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) observer.unobserve(currentRef);
    };
  }, []);

  return (
    <div
      ref={domRef}
      className={cn(className)}
      style={{
        opacity: isVisible ? 1 : 0,
        transform: getFadeInTransform(isVisible, direction, distance),
        transition: `opacity 0.7s cubic-bezier(0.21, 0.47, 0.32, 0.98), transform 0.7s cubic-bezier(0.21, 0.47, 0.32, 0.98)`,
        transitionDelay: `${delay}s`,
        willChange: "opacity, transform",
      }}
    >
      {children}
    </div>
  );
}
