import { HTMLAttributes } from "react";

type Props = HTMLAttributes<HTMLSpanElement> & {
  variant?: "soft" | "accent";
};

export function Badge({ variant = "soft", className = "", ...rest }: Props) {
  const variants = {
    soft: "bg-[var(--bg-soft)] text-gray-300 border border-white/10",
    accent: "bg-[var(--accent)] text-black",
  }[variant];
  return <span className={`inline-flex items-center rounded-full px-3 py-1 text-sm ${variants} ${className}`} {...rest} />;
}
