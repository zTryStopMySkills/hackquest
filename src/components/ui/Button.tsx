import { ButtonHTMLAttributes, forwardRef } from "react";

type Variant = "primary" | "danger" | "ghost" | "amber";
type Size = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
}

const variantClasses: Record<Variant, string> = {
  primary: [
    "border border-matrix-green text-matrix-green",
    "hover:bg-matrix-green hover:text-military-dark",
    "disabled:border-military-border disabled:text-military-border disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-military-border",
    "hover:shadow-[0_0_15px_rgba(0,255,65,0.4)]",
  ].join(" "),

  danger: [
    "border border-neon-red text-neon-red",
    "hover:bg-neon-red hover:text-white",
    "disabled:border-military-border disabled:text-military-border disabled:cursor-not-allowed",
    "hover:shadow-[0_0_15px_rgba(255,0,64,0.4)]",
  ].join(" "),

  ghost: [
    "border border-military-border text-matrix-green/70",
    "hover:border-matrix-green hover:text-matrix-green",
    "disabled:opacity-40 disabled:cursor-not-allowed",
    "hover:shadow-[0_0_8px_rgba(0,255,65,0.2)]",
  ].join(" "),

  amber: [
    "border border-neon-amber text-neon-amber",
    "hover:bg-neon-amber hover:text-military-dark",
    "disabled:border-military-border disabled:text-military-border disabled:cursor-not-allowed",
    "hover:shadow-[0_0_15px_rgba(255,184,0,0.4)]",
  ].join(" "),
};

const sizeClasses: Record<Size, string> = {
  sm: "px-3 py-1.5 text-xs tracking-wider",
  md: "px-6 py-2.5 text-sm tracking-widest",
  lg: "px-8 py-3.5 text-base tracking-widest",
};

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "primary",
      size = "md",
      loading = false,
      children,
      className = "",
      disabled,
      ...props
    },
    ref
  ) => {
    const isDisabled = disabled || loading;

    return (
      <button
        ref={ref}
        disabled={isDisabled}
        className={[
          "inline-flex items-center justify-center gap-2",
          "font-mono uppercase font-medium",
          "transition-all duration-200",
          "active:scale-95",
          "focus:outline-none focus-visible:ring-2 focus-visible:ring-matrix-green/50",
          variantClasses[variant],
          sizeClasses[size],
          isDisabled ? "pointer-events-none opacity-50" : "",
          className,
        ]
          .filter(Boolean)
          .join(" ")}
        {...props}
      >
        {loading && (
          <span className="inline-block w-3 h-3 border border-current border-t-transparent rounded-full animate-spin shrink-0" />
        )}
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
export default Button;
