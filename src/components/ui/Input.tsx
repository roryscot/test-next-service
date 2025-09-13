import { forwardRef, InputHTMLAttributes } from "react";
import clsx from "clsx";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
  icon?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, error = false, icon, ...rest }, ref) => (
    <div className="relative">
      {icon && (
        <div className="text-muted-foreground absolute top-1/2 left-3 -translate-y-1/2">
          {icon}
        </div>
      )}
      <input
        ref={ref}
        className={clsx(
          "bg-card text-fg placeholder:text-muted-foreground border-border duration-fast w-full rounded-lg border px-3 py-2 text-sm transition-all",
          "focus:border-border-focus focus:ring-border-focus focus:ring-2 focus:outline-none",
          "hover:border-border-hover",
          {
            "border-danger focus:border-danger focus:ring-danger/50": error,
            "pl-10": icon,
          },
          className
        )}
        {...rest}
      />
    </div>
  )
);
Input.displayName = "Input";
