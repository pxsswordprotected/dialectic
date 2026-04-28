"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Check } from "@phosphor-icons/react";

export function MessageToast({ message }: { message: string }) {
  const [visible, setVisible] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const hideAt = setTimeout(() => setVisible(false), 5000);
    const stripAt = setTimeout(() => {
      router.replace(pathname, { scroll: false });
    }, 5300);
    return () => {
      clearTimeout(hideAt);
      clearTimeout(stripAt);
    };
  }, [pathname, router]);

  return (
    <div
      className={`absolute left-1/2 top-full mt-64 -translate-x-1/2 inline-flex items-center justify-center gap-[10px] rounded-sm border border-neutral-300 bg-neutral-50 px-[16px] py-[10px] shadow-[0px_2px_3.5px_0px_rgba(0,0,0,0.1)] whitespace-nowrap select-none transition-opacity duration-300 ${
        visible ? "opacity-100" : "opacity-0"
      }`}
      aria-live="polite"
    >
      <Check size={22} weight="bold" className="text-primary-400" />
      <p className="text-base text-neutral-800">{message}</p>
    </div>
  );
}
