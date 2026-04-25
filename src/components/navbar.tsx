"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  Lightning,
  Star,
  CaretDown,
  Eye,
} from "@phosphor-icons/react/dist/ssr";

type NavbarProps =
  | {
      mode?: "default";
      activeTab?: "learn" | "courses" | "account";
      currentStreak: number;
      dailyXpEarned: number;
      dailyXpGoal: number;
      accountName: string;
    }
  | {
      mode: "lesson";
      currentStreak: number;
      dailyXpEarned: number;
      dailyXpGoal: number;
      lessonTitle: string;
      backHref?: string;
      viewMode?: boolean;
    };

export function Navbar(props: NavbarProps) {
  const { mode = "default", currentStreak, dailyXpEarned, dailyXpGoal } = props;

  const activeTab: "learn" | "courses" | "account" =
    props.mode !== "lesson" ? (props.activeTab ?? "learn") : "learn";

  const [menuOpen, setMenuOpen] = useState(false);
  const menuWrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const onMouseDown = (e: MouseEvent) => {
      if (
        menuWrapperRef.current &&
        !menuWrapperRef.current.contains(e.target as Node)
      ) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", onMouseDown);
    return () => document.removeEventListener("mousedown", onMouseDown);
  }, [menuOpen]);

  useEffect(() => {
    if (!menuOpen) return;
    const onScroll = () => setMenuOpen(false);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [menuOpen]);

  return (
    <nav className="relative mx-auto h-48 w-full max-w-[1050px]">
      <div
        aria-hidden
        className="absolute inset-0 bg-black/10"
        style={{
          clipPath: "polygon(0 0, 100% 0, calc(100% - 36px) 100%, 36px 100%)",
        }}
      />
      <div
        aria-hidden
        className="absolute inset-px bg-white"
        style={{
          clipPath: "polygon(0 0, 100% 0, calc(100% - 36px) 100%, 36px 100%)",
        }}
      />
      <div className="relative flex h-full items-center text-neutral-800 select-none">
        {mode === "default" ? (
          <div className="flex items-center gap-32 pl-[100px]">
            <Link
              href="/dashboard"
              className="group relative text-base text-neutral-800"
            >
              Learn
              {activeTab === "learn" ? (
                <span
                  aria-hidden
                  className="absolute -bottom-[11px] inset-x-0 h-[2px] bg-primary-400"
                />
              ) : (
                <span
                  aria-hidden
                  className="absolute -bottom-[11px] inset-x-0 h-[2px] bg-primary-200 opacity-0 group-hover:opacity-100"
                />
              )}
            </Link>
            <Link
              href="/courses"
              className="group relative text-base text-neutral-800"
            >
              All Courses
              {activeTab === "courses" ? (
                <span
                  aria-hidden
                  className="absolute -bottom-[11px] inset-x-0 h-[2px] bg-primary-400"
                />
              ) : (
                <span
                  aria-hidden
                  className="absolute -bottom-[11px] inset-x-0 h-[2px] bg-primary-200 opacity-0 group-hover:opacity-100"
                />
              )}
            </Link>
          </div>
        ) : (
          <>
            <Link
              href={
                props.mode === "lesson"
                  ? (props.backHref ?? "/learn")
                  : "/learn"
              }
              className="pl-[100px] text-base text-neutral-400 hover:text-neutral-800"
            >
              Back to course
            </Link>
            {props.mode === "lesson" && props.viewMode ? (
              <div className="absolute left-1/2 flex -translate-x-1/2 items-center gap-[6px]">
                <Eye size={18} className="text-neutral-600" />
                {/*<span className="text-base text-neutral-500">Viewing:</span>*/}
                <span className="text-base text-neutral-800">
                  {props.lessonTitle}
                </span>
              </div>
            ) : (
              <p className="absolute left-1/2 -translate-x-1/2 text-base text-neutral-800">
                {props.mode === "lesson" ? props.lessonTitle : ""}
              </p>
            )}
          </>
        )}

        <div className="ml-auto flex items-center gap-32 pr-[100px]">
          <div className="flex items-center gap-16">
            <div className="flex items-center gap-[6px]">
              <Lightning size={22} weight="fill" className="text-primary-400" />
              <span className="text-base text-neutral-800">
                {currentStreak}
              </span>
            </div>
            <span className="h-[18px] w-px bg-neutral-200" />
            <div className="flex items-center gap-[6px]">
              <Star size={22} weight="fill" className="text-primary-400" />
              <span className="text-base text-neutral-800">
                {dailyXpEarned}/{dailyXpGoal}
              </span>
            </div>
          </div>

          {mode === "default" && (
            <div ref={menuWrapperRef} className="relative">
              <button
                type="button"
                onClick={() => setMenuOpen((o) => !o)}
                className="group relative flex cursor-pointer items-center gap-3"
                aria-label="Open account menu"
                aria-expanded={menuOpen}
              >
                <span
                  className="size-6 rounded-full"
                  style={{
                    background:
                      "linear-gradient(135deg, #f87c00 0%, #a855f7 100%)",
                  }}
                />
                <CaretDown
                  size={14}
                  weight="bold"
                  className={`text-neutral-800 ${menuOpen ? "rotate-180" : ""}`}
                />
                {activeTab === "account" && (
                  <span
                    aria-hidden
                    className="absolute -bottom-[11px] left-0 h-[2px] w-6 bg-primary-400"
                  />
                )}
              </button>
              {menuOpen && (
                <div className="absolute right-0 top-full mt-8 flex w-[180px] flex-col gap-12 rounded-sm border border-black/10 bg-white p-16 shadow-[0_2px_8.5px_rgba(0,0,0,0.05)]">
                  <div className="flex h-[40px] items-center gap-[6px] rounded-sm bg-neutral-50 px-12 py-8">
                    <span
                      className="size-6 shrink-0 rounded-full"
                      style={{
                        background:
                          "linear-gradient(135deg, #f87c00 0%, #a855f7 100%)",
                      }}
                    />
                    <span
                      title={props.mode !== "lesson" ? props.accountName : ""}
                      className="min-w-0 flex-1 truncate text-base text-neutral-800"
                    >
                      {props.mode !== "lesson" ? props.accountName : ""}
                    </span>
                  </div>
                  <Link
                    href="/settings"
                    className="-mx-4 flex h-[36px] items-center rounded-sm px-12 text-base text-neutral-800 hover:bg-neutral-50"
                  >
                    Settings
                  </Link>
                  <Link
                    href="/about"
                    className="-mx-4 flex h-[36px] items-center rounded-sm px-12 text-base text-neutral-800 hover:bg-neutral-50"
                  >
                    About
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
