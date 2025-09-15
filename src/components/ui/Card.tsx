import { PropsWithChildren, forwardRef, HTMLAttributes } from "react";
import clsx from "clsx";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  hover?: boolean;
  interactive?: boolean;
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  (
    { className, hover = false, interactive = false, children, ...props },
    ref
  ) => {
    return (
      <div
        ref={ref}
        className={clsx(
          "bg-card border-border duration-normal rounded-lg border shadow-sm transition-all",
          {
            "hover:border-border-hover hover:shadow-md": hover,
            "hover:border-border-hover cursor-pointer hover:-translate-y-1 hover:shadow-lg":
              interactive,
            "hover:bg-card-hover": hover || interactive,
          },
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);
Card.displayName = "Card";

export function CardHeader({
  children,
  className,
  ...props
}: PropsWithChildren<HTMLAttributes<HTMLDivElement>>) {
  return (
    <div
      className={clsx(
        "border-border flex items-center justify-between border-b px-6 py-4",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardContent({
  children,
  className,
  ...props
}: PropsWithChildren<HTMLAttributes<HTMLDivElement>>) {
  return (
    <div className={clsx("p-6", className)} {...props}>
      {children}
    </div>
  );
}

export function CardFooter({
  children,
  className,
  ...props
}: PropsWithChildren<HTMLAttributes<HTMLDivElement>>) {
  return (
    <div
      className={clsx(
        "border-border flex items-center justify-between border-t px-6 py-4",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardTitle({
  children,
  className,
  ...props
}: PropsWithChildren<HTMLAttributes<HTMLHeadingElement>>) {
  return (
    <h3
      className={clsx("text-fg text-lg leading-tight font-semibold", className)}
      {...props}
    >
      {children}
    </h3>
  );
}

export function CardDescription({
  children,
  className,
  ...props
}: PropsWithChildren<HTMLAttributes<HTMLParagraphElement>>) {
  return (
    <p
      className={clsx(
        "text-muted-foreground text-sm leading-relaxed",
        className
      )}
      {...props}
    >
      {children}
    </p>
  );
}
