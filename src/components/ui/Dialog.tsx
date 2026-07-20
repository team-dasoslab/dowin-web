"use client";

import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";
import { useDialogActions } from "@/components/ui/_hooks/useDialogActions";

export interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
}

const DialogContext = React.createContext<{
  open: boolean;
  onOpenChange: (open: boolean) => void;
}>({
  open: false,
  onOpenChange: () => {},
});

export const Dialog = ({ open, onOpenChange, children }: DialogProps) => {
  return (
    <DialogContext.Provider value={{ open, onOpenChange }}>
      {children}
    </DialogContext.Provider>
  );
};

export const DialogTrigger = ({ children, asChild }: { children: React.ReactNode; asChild?: boolean }) => {
  const { onOpenChange } = React.useContext(DialogContext);
  
  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children as React.ReactElement<React.HTMLAttributes<HTMLElement>>, {
      onClick: (e: React.MouseEvent<HTMLElement>) => {
        (children as React.ReactElement<React.HTMLAttributes<HTMLElement>>).props.onClick?.(e);
        onOpenChange(true);
      },
    });
  }

  return (
    <div onClick={() => onOpenChange(true)} className="inline-block">
      {children}
    </div>
  );
};

export interface DialogContentProps extends React.HTMLAttributes<HTMLDivElement> {
  overlayClassName?: string;
}

export const DialogContent = React.forwardRef<HTMLDivElement, DialogContentProps>(
  ({ className, overlayClassName, children, ...props }, ref) => {
    const { open, onOpenChange } = React.useContext(DialogContext);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
      setMounted(true);
    }, []);

    useDialogActions(open, onOpenChange);

    if (!mounted || !open) return null;

    return createPortal(
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <div 
          className={cn(
            "fixed inset-0 bg-black/55 backdrop-blur-[1px] animate-in fade-in duration-200",
            overlayClassName
          )} 
          onClick={() => onOpenChange(false)}
        />
        <div
          ref={ref}
          className={cn(
            "relative z-50 flex flex-col w-full max-w-lg bg-surface rounded-[24px] shadow-[0_8px_32px_rgba(0,0,0,0.08)] animate-in zoom-in-95 fade-in duration-200",
            className
          )}
          {...props}
        >
          {children}
        </div>
      </div>,
      document.body
    );
  }
);
DialogContent.displayName = "DialogContent";

export const DialogHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn("flex flex-col space-y-1.5 p-6", className)}
    {...props}
  />
);
DialogHeader.displayName = "DialogHeader";

export const DialogFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 p-6 pt-0",
      className
    )}
    {...props}
  />
);
DialogFooter.displayName = "DialogFooter";

export const DialogTitle = React.forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h2
    ref={ref}
    className={cn("text-lg font-bold leading-none tracking-tight text-text-primary", className)}
    {...props}
  />
));
DialogTitle.displayName = "DialogTitle";

export const DialogDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm text-text-muted", className)}
    {...props}
  />
));
DialogDescription.displayName = "DialogDescription";
