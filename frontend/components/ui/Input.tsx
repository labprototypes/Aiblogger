import { InputHTMLAttributes, forwardRef } from "react";

type Props = InputHTMLAttributes<HTMLInputElement>;

export const Input = forwardRef<HTMLInputElement, Props>(function Input(
  { className = "", ...rest },
  ref
) {
  return (
    <input
      ref={ref}
      className={`w-full rounded-xl bg-[var(--bg-soft)] px-4 py-2 outline-none border border-white/10 text-gray-200 placeholder:text-gray-500 ${className}`}
      {...rest}
    />
  );
});
