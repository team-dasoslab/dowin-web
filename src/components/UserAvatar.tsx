"use client";

import {
  getDiceBearGlassAvatarSrc,
  getProfileAvatarSrc,
  type ProfileAvatarKey,
} from "@/domain/profile/avatar-options";
import { WigIcon } from "@/components/ui/WigIcon";
import Image from "next/image";
import { useRef } from "react";

type UserAvatarShape = "circle" | "rounded";

type UserAvatarProps = {
  avatarKey?: ProfileAvatarKey | string | null;
  avatarSeed?: string | null;
  alt: string;
  size?: number;
  className?: string;
  shape?: UserAvatarShape;
};

export function UserAvatar({
  avatarKey,
  avatarSeed,
  alt,
  size = 40,
  className,
  shape = "circle",
}: UserAvatarProps) {
  const radiusClassName = shape === "circle" ? "rounded-full" : "rounded-lg";
  const wrapperClassName = className
    ? `${className} ${radiusClassName}`
    : radiusClassName;
  const randomSeedRef = useRef(`wig-avatar-${Math.random().toString(36).slice(2, 10)}`);
  const resolvedSeed = avatarSeed?.trim() || randomSeedRef.current;
  const resolvedSrc = resolvedSeed
    ? getDiceBearGlassAvatarSrc(resolvedSeed)
    : avatarKey
      ? getProfileAvatarSrc(avatarKey)
      : null;

  if (!resolvedSrc) {
    return (
      <div
        className={wrapperClassName}
        style={{ width: size, height: size }}
        aria-hidden="true"
      >
        <div
          className={`flex h-full w-full items-center justify-center bg-primary/10 text-primary ${radiusClassName}`}
        >
          <WigIcon
            name="domain-person"
            className="h-1/2 w-1/2"
            aria-hidden="true"
          />
        </div>
      </div>
    );
  }

  return (
    <div
      className={`overflow-hidden ${wrapperClassName}`}
      style={{ width: size, height: size }}
    >
      <Image
        src={resolvedSrc}
        alt={alt}
        width={size}
        height={size}
        className={`h-full w-full object-contain ${radiusClassName}`}
        unoptimized
        loader={({ src }) => src}
        loading="lazy"
      />
    </div>
  );
}
