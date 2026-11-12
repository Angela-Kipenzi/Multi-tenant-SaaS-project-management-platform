import { forwardRef } from "react";
import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

type Variant = "primary" | "secondary" | "ghost";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  loading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", loading, children, disabled, ...rest }, ref) => {
    const variantClass =
      variant === "secondary"
        ? "btn-secondary"
        : variant === "ghost"
        ? "btn text-slate-600 hover:bg-slate-100"
        : "btn-primary";

    return (
      <button
        ref={ref}
        className={cn(variantClass, className)}
        disabled={disabled || loading}
        {...rest}
      >
        {loading ? "Loading…" : children}
      </button>
    );
  }
);
Button.displayName = "Button";