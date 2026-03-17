"use client";

import { getProfileAvatarSrc, type ProfileAvatarKey } from "@/domain/profile/avatar-options";
import { User as UserIcon } from "lucide-react";
import Image from "next/image";

type UserAvatarProps = {
  avatarKey?: ProfileAvatarKey | string | null;
  alt: string;
  size?: number;
  className?: string;
  fallbackClassName?: string;
  imageClassName?: string;
};

export function UserAvatar({
  avatarKey,
  alt,
  size = 40,
  className,
  fallbackClassName,
  imageClassName,
}: UserAvatarProps) {
  const wrapperClassName = className ?? "";

  if (!avatarKey) {
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
        src={getProfileAvatarSrc(avatarKey)}
        alt={alt}
        width={size}
        height={size}
        className={`h-full w-full object-contain ${imageClassName ?? ""}`}
      />
    </div>
  );
}
