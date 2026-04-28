"use client";

import { useState } from "react";
import { Eye, EyeSlash } from "@phosphor-icons/react";

type Props = {
  name: string;
  placeholder?: string;
  required?: boolean;
  minLength?: number;
};

export function PasswordInput({
  name,
  placeholder = "Password",
  required,
  minLength,
}: Props) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative w-full">
      <input
        id={name}
        name={name}
        type={visible ? "text" : "password"}
        placeholder={placeholder}
        required={required}
        minLength={minLength}
        className="w-full rounded-sm select-none border border-neutral-300 bg-neutral-100 px-8 py-1.5 pr-10 text-base text-neutral-800 placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-primary-300"
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? "Hide password" : "Show password"}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-800"
      >
        {visible ? <Eye size={20} /> : <EyeSlash size={20} />}
      </button>
    </div>
  );
}
