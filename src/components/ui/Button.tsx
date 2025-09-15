import { forwardRef, ButtonHTMLAttributes } from "react";
import clsx from "clsx";

type Variant = "primary" | "secondary" | "ghost" | "outline" | "danger";
type Size = "sm" | "md" | "lg" | "xl";

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: "left" | "right";
}

export const Button = forwardRef<HTMLButtonElement, Props>(
  (
    {
      className,
      variant = "primary",
      size = "md",
      loading,
      disabled,
      children,
      icon,
      iconPosition = "left",
      ...rest
    },
    ref
  ) => {
    const base = clsx(
      // Base styles
      "inline-flex items-center justify-center gap-2 font-medium transition-all duration-fast focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-bg disabled:opacity-60 disabled:pointer-events-none",
      // Size variants
      {
        "px-3 py-1.5 text-sm rounded-md": size === "sm",
        "px-4 py-2 text-base rounded-lg": size === "md",
        "px-6 py-3 text-lg rounded-xl": size === "lg",
        "px-8 py-4 text-xl rounded-xl": size === "xl",
      }
    );

    const variants: Record<Variant, string> = {
      primary: clsx(
        "bg-primary text-primary-foreground shadow-md",
        "hover:bg-primary-hover hover:shadow-lg hover:-translate-y-0.5",
        "active:bg-primary-active active:translate-y-0 active:shadow-md",
        "focus:ring-primary"
      ),
      secondary: clsx(
        "bg-card text-fg border border-border shadow-sm",
        "hover:bg-card-hover hover:border-border-hover hover:shadow-md hover:-translate-y-0.5",
        "active:bg-card active:translate-y-0 active:shadow-sm",
        "focus:ring-primary"
      ),
      outline: clsx(
        "border border-border text-fg bg-transparent",
        "hover:bg-muted/30 hover:border-border-hover hover:shadow-sm",
        "active:bg-muted/50 active:shadow-none",
        "focus:ring-primary"
      ),
      ghost: clsx(
        "text-fg bg-transparent",
        "hover:bg-muted/30 hover:text-fg",
        "active:bg-muted/50",
        "focus:ring-primary"
      ),
      danger: clsx(
        "bg-danger text-danger-foreground shadow-md",
        "hover:bg-danger/90 hover:shadow-lg hover:-translate-y-0.5",
        "active:bg-danger/80 active:translate-y-0 active:shadow-md",
        "focus:ring-danger"
      ),
    };

    const loadingSpinner = (
      <span
        className={clsx(
          "animate-spin rounded-full border-2 border-current border-t-transparent",
          {
            "h-3 w-3": size === "sm",
            "h-4 w-4": size === "md",
            "h-5 w-5": size === "lg",
            "h-6 w-6": size === "xl",
          }
        )}
        aria-hidden
      />
    );

    const iconElement = icon && (
      <span
        className={clsx({
          "h-3 w-3": size === "sm",
          "h-4 w-4": size === "md",
          "h-5 w-5": size === "lg",
          "h-6 w-6": size === "xl",
        })}
      >
        {icon}
      </span>
    );

    return (
      <button
        ref={ref}
        className={clsx(base, variants[variant], className)}
        disabled={disabled || loading}
        {...rest}
      >
        {loading && loadingSpinner}
        {!loading && iconPosition === "left" && iconElement}
        {children && <span>{children}</span>}
        {!loading && iconPosition === "right" && iconElement}
      </button>
    );
  }
);
Button.displayName = "Button";
