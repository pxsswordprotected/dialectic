import Link from "next/link";
import { ArrowRight } from "@phosphor-icons/react/dist/ssr";
import { CARD_INNER_STROKE } from "./card-styles";

type Props = {
  mode: "continue" | "start";
  title: string;
  progressPercent: number;
  href: string;
  bgImage?: string;
};

export function ContinueLearningCard({
  mode,
  title,
  progressPercent,
  href,
  bgImage,
}: Props) {
  return (
    <div className="flex select-none flex-col gap-16 active:scale-98">
      <span className="font-sans text-base text-neutral-400">
        {mode === "continue" ? "Continue learning" : "Start learning"}
      </span>
      <Link
        href={href}
        className={`${CARD_INNER_STROKE} group relative h-[164px] w-[517px] overflow-hidden bg-white`}
      >
        {bgImage && (
          <>
            <img
              src={bgImage}
              alt=""
              aria-hidden
              className="absolute inset-0 size-full object-cover opacity-50"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-white from-50% to-transparent transition-opacity duration-300 group-hover:opacity-0" />
          </>
        )}
        {!bgImage && (
          <div className="absolute inset-0 transition-colors group-hover:bg-neutral-100" />
        )}
        <div className="relative flex h-full flex-col justify-center p-16">
          <span className="self-start font-heading text-xl text-neutral-800 [box-decoration-break:clone] [-webkit-box-decoration-break:clone] -mx-[4px] rounded-sm px-[4px] transition-all duration-150 backdrop-blur-none group-hover:bg-neutral-50/90 group-hover:backdrop-blur-sm">
            {title}
            <ArrowRight
              size={20}
              weight="bold"
              className="ml-[6px] inline-block align-[-2px] text-neutral-800 opacity-0 transition-opacity duration-150 group-hover:opacity-100"
            />
          </span>
          <span className="mt-12 self-start font-sans text-base text-neutral-800 [box-decoration-break:clone] [-webkit-box-decoration-break:clone] -mx-[4px] rounded-sm px-[4px] transition-all duration-150 backdrop-blur-none group-hover:bg-neutral-50/90 group-hover:backdrop-blur-sm">
            {progressPercent}% Complete
          </span>
        </div>
      </Link>
    </div>
  );
}
