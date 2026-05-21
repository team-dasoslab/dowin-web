import { cn } from "@/lib/utils";
import {
  Activity,
  AlignLeft,
  Archive,
  ArrowUpRight,
  Bell,
  Calendar,
  ChartBar,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleAlert,
  CircleCheck,
  CircleMinus,
  CirclePlus,
  CircleX,
  Compass,
  Copy,
  CreditCard,
  Download,
  Eye,
  EyeOff,
  House,
  Info,
  Key,
  Languages,
  LayoutGrid,
  LogIn,
  LogOut,
  Medal,
  Megaphone,
  MessageSquare,
  MoreHorizontal,
  Pencil,
  Phone,
  RefreshCw,
  Save,
  Send,
  Settings,
  Share2,
  ShieldCheck,
  Shuffle,
  Sparkles,
  SquarePlus,
  Tag,
  Target,
  Timer,
  Trash2,
  TrendingUp,
  TriangleAlert,
  Undo2,
  User,
  UserMinus,
  UserPlus,
  Users,
  Wallet,
  X,
  Zap,
} from "lucide-react";
import React from "react";

export const ICON_MAP = {
  // Navigation
  "nav-home": House,
  "nav-home-active": House,
  "nav-dashboard": ChartBar,
  "nav-dashboard-active": ChartBar,
  "nav-team": Users,
  "nav-team-active": Users,
  "nav-report": TrendingUp,
  "nav-report-active": TrendingUp,
  "nav-archive": Archive,
  "nav-archive-active": Archive,
  "nav-settings": Settings,
  "nav-settings-active": Settings,
  "nav-profile": User,
  "nav-profile-active": User,
  "nav-back": ChevronLeft,
  "nav-chevron-right": ChevronRight,
  "nav-chevron-left": ChevronLeft,
  "nav-chevron-down": ChevronDown,
  "nav-compass": Compass,
  "domain-language": Languages,

  // Auth
  "auth-key": Key,
  "auth-key-active": Key,
  "auth-key-large": Key,
  "auth-sign-out": LogOut,
  "auth-eye": Eye,
  "auth-eye-off": EyeOff,

  // Status
  "status-alert": TriangleAlert,
  "status-alert-active": TriangleAlert,
  "status-alert-compact": TriangleAlert,
  "status-alert-off-compact": TriangleAlert, // No outline easily available, using solid
  "status-premium": Medal,
  "status-checkmark": CircleCheck,
  "status-checkmark-active": CircleCheck,
  "status-checkmark-large": CircleCheck,
  "status-timer": Timer,
  "status-locked": ShieldCheck,
  "status-warning": CircleAlert,
  "status-info": Info,
  "status-tag": Tag,
  "status-sparkle": Sparkles,
  "status-bell": Bell,
  "status-announcement": Megaphone,

  // Domain Objects
  "domain-flash": Zap,
  "domain-flash-active": Zap,
  "domain-flash-large": Zap,
  "domain-flash-large-active": Zap,
  "domain-people": Users,
  "domain-people-active": Users,
  "domain-people-large": Users,
  "domain-person": User,
  "domain-person-active": User,
  "domain-person-large": User,
  "domain-calendar": Calendar,
  "domain-calendar-active": Calendar,
  "domain-calendar-large": Calendar,
  "domain-payment": CreditCard,
  "domain-payment-active": CreditCard,
  "domain-ticket": Tag, // Using Label as fallback for Ticket
  "domain-ticket-active": Tag,
  "domain-chat": MessageSquare,
  "domain-chat-active": MessageSquare,
  "domain-board": LayoutGrid,
  "domain-trending": TrendingUp,
  "domain-pulse": Activity,
  "domain-pulse-large": Activity,
  "domain-target-arrow": Target,
  "domain-target-arrow-large": Target,
  "domain-phone": Phone,
  "domain-image-off": X, // Fallback for image off
  "domain-wallet": Wallet,
  "domain-ticket-diagonal": Tag,
  "domain-key": Key,

  // Actions
  "action-add": CirclePlus,
  "action-add-active": CirclePlus,
  "action-add-square": SquarePlus,
  "action-edit": Pencil,
  "action-edit-active": Pencil,
  "action-delete": Trash2,
  "action-delete-active": Trash2,
  "action-subtract": CircleMinus,
  "action-copy": Copy,
  "action-share": Share2,
  "action-more": MoreHorizontal,
  "action-more-large": MoreHorizontal,
  "action-dismiss": X,
  "action-dismiss-compact": CircleX,
  "action-refresh": RefreshCw,
  "action-undo": Undo2,
  "action-enter": LogIn,
  "action-join": Shuffle,
  "action-external": ArrowUpRight,
  "action-download": Download,
  "action-member-remove": UserMinus,
  "action-person-add": UserPlus,
  "action-save": Save,
  "action-archive": Archive,
  "action-send": Send,
  "action-checkmark": Check,
  "action-align-left": AlignLeft,
  "action-arrow-right": ChevronRight,
} as const;

export type IconName = keyof typeof ICON_MAP;

interface DowinIconProps extends React.HTMLAttributes<HTMLSpanElement> {
  name: IconName;
  size?: number | string;
}

export function DowinIcon({ name, size, className, ...props }: DowinIconProps) {
  const IconComponent = ICON_MAP[name];

  if (!IconComponent) {
    return null;
  }

  return (
    <span
      className={cn(
        "inline-flex items-center justify-center shrink-0",
        className,
      )}
      style={{
        width: size,
        height: size,
      }}
      {...props}
    >
      <IconComponent className="w-full h-full" />
    </span>
  );
}
