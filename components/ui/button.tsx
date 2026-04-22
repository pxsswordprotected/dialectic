import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";

type ButtonVariant = "primary" | "secondary";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  iconLeft?: ReactNode;
  iconRight?: ReactNode;
};

const base =
  "inline-flex items-center justify-center gap-8 px-16 py-8 rounded-sm border border-solid border-black/10 font-sans font-medium text-sm leading-[1.3] whitespace-nowrap transition-[background-color,transform] duration-150 ease-out active:scale-[0.97] disabled:opacity-50 disabled:pointer-events-none disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-50 cursor-pointer";

const variants: Record<ButtonVariant, string> = {
  primary: "bg-primary-400 text-neutral-50 hover:bg-primary-500",
  secondary: "bg-neutral-100 text-neutral-800 hover:bg-neutral-200",
};

export function buttonClasses(variant: ButtonVariant = "primary", className?: string) {
  return `${base} ${variants[variant]}${className ? ` ${className}` : ""}`;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "primary",
      iconLeft,
      iconRight,
      children,
      className,
      type = "button",
      ...props
    },
    ref,
  ) => {
    return (
      <button
        ref={ref}
        type={type}
        className={`${base} ${variants[variant]}${className ? ` ${className}` : ""}`}
        {...props}
      >
        {iconLeft}
        {children}
        {iconRight}
      </button>
    );
  },
);

Button.displayName = "Button";
