"use client";

import {
  getDiceBearGlassAvatarSrc,
  getProfileAvatarSrc,
  type ProfileAvatarKey,
} from "@/domain/profile/avatar-options";
import { User as UserIcon } from "lucide-react";
import Image from "next/image";
import { useRef } from "react";

type UserAvatarProps = {
  avatarKey?: ProfileAvatarKey | string | null;
  avatarSeed?: string | null;
  alt: string;
  size?: number;
  className?: string;
  fallbackClassName?: string;
  imageClassName?: string;
};

export function UserAvatar({
  avatarKey,
  avatarSeed,
  alt,
  size = 40,
  className,
  fallbackClassName,
  imageClassName,
}: UserAvatarProps) {
  const wrapperClassName = className
    ? `rounded-full ${className}`
    : "rounded-full";
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
          className={`flex h-full w-full items-center justify-center rounded-full bg-primary/10 text-primary ${fallbackClassName ?? ""}`}
        >
          <UserIcon
            className="h-1/2 w-1/2"
            strokeWidth={2}
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
        className={`h-full w-full rounded-full object-contain ${imageClassName ?? ""}`}
        unoptimized
        loader={({ src }) => src}
        loading="lazy"
      />
    </div>
  );
}
