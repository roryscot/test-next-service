import { forwardRef, TextareaHTMLAttributes } from "react";
import clsx from "clsx";

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, error = false, ...rest }, ref) => (
    <textarea
      ref={ref}
      className={clsx(
        "bg-card text-fg placeholder:text-muted-foreground border-border duration-fast w-full resize-none rounded-lg border p-3 text-sm transition-all",
        "focus:border-border-focus focus:ring-border-focus focus:ring-2 focus:outline-none",
        "hover:border-border-hover",
        {
          "border-danger focus:border-danger focus:ring-danger/50": error,
        },
        className
      )}
      {...rest}
    />
  )
);
Textarea.displayName = "Textarea";
