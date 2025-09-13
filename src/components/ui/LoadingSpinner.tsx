// src/components/ui/LoadingSpinner.tsx
import React from "react";
import { cn } from "@/lib/utils";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeClasses = {
  sm: "h-4 w-4",
  md: "h-6 w-6",
  lg: "h-8 w-8",
};

export function LoadingSpinner({
  size = "md",
  className,
}: LoadingSpinnerProps) {
  return (
    <div
      className={cn(
        "border-t-primary-500 animate-spin rounded-full border-2 border-neutral-300",
        sizeClasses[size],
        className
      )}
    />
  );
}

export function LoadingButton({
  children,
  loading,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  loading?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      {...props}
      disabled={loading || props.disabled}
      className={cn(
        "inline-flex items-center justify-center gap-2",
        props.className
      )}
    >
      {loading && <LoadingSpinner size="sm" />}
      {children}
    </button>
  );
}
