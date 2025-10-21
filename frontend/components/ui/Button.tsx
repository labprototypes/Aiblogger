import { ButtonHTMLAttributes } from "react";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "accent" | "ghost";
  size?: "sm" | "md";
};

export function Button({ variant = "accent", size = "md", className = "", ...rest }: Props) {
  const base = "inline-flex items-center justify-center font-semibold rounded-full transition-colors";
  const sizes = {
    sm: "h-8 px-3 text-sm",
    md: "h-10 px-4",
  }[size];
  const variants = {
    accent: "bg-[var(--accent)] text-black hover:bg-[var(--accent-dark)]",
    ghost: "bg-[var(--bg-soft)] text-gray-300 hover:bg-white/10 border border-white/10",
  }[variant];
  return <button className={`${base} ${sizes} ${variants} ${className}`} {...rest} />;
}
