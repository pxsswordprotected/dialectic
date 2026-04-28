import { notFound } from "next/navigation";
import { readdirSync, readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import Link from "next/link";
import { PreviewClient } from "./preview-client";

const NODES_DIR = join(
  process.cwd(),
  "src",
  "db",
  "seed-data",
  "courses",
  "intro-logic",
  "nodes",
);

export const dynamic = "force-dynamic";

export default async function PreviewPage(props: {
  searchParams: Promise<{ node?: string; kind?: string }>;
}) {
  if (process.env.NODE_ENV !== "development") notFound();

  const { node, kind } = await props.searchParams;

  const nodes = readdirSync(NODES_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name)
    .sort();

  let data: unknown[] | null = null;
  let parseError: string | null = null;

  if (node && (kind === "lesson" || kind === "practice")) {
    const file = join(NODES_DIR, node, `${kind}.json`);
    if (existsSync(file)) {
      try {
        data = JSON.parse(readFileSync(file, "utf-8"));
      } catch (e) {
        parseError = e instanceof Error ? e.message : String(e);
      }
    } else {
      parseError = "File does not exist.";
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-neutral-50">
      <header className="flex flex-wrap items-center gap-12 border-b border-neutral-300 bg-white px-24 py-12">
        <span className="text-base font-medium text-neutral-800">
          JSON Preview
        </span>
        <form className="flex flex-wrap items-center gap-8">
          <select
            name="node"
            defaultValue={node ?? ""}
            className="rounded-sm border border-neutral-300 bg-white px-8 py-4 text-xs"
          >
            <option value="">— pick a node —</option>
            {nodes.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
          <select
            name="kind"
            defaultValue={kind ?? "lesson"}
            className="rounded-sm border border-neutral-300 bg-white px-8 py-4 text-xs"
          >
            <option value="lesson">lesson.json</option>
            <option value="practice">practice.json</option>
          </select>
          <button
            type="submit"
            className="rounded-sm bg-primary-400 px-12 py-4 text-xs font-medium text-neutral-50 hover:bg-primary-500"
          >
            Load
          </button>
        </form>
        {node && kind && (
          <Link
            href={`/dev/preview?node=${node}&kind=${kind}&t=${Date.now()}`}
            className="rounded-sm border border-neutral-300 px-12 py-4 text-xs hover:bg-neutral-100"
          >
            Reload file
          </Link>
        )}
        <span className="ml-auto text-xs text-neutral-500">
          {node ? `${node} / ${kind}.json` : "no file loaded"}
        </span>
      </header>

      <main className="flex flex-1 items-start justify-center py-32">
        {parseError && (
          <pre className="max-w-[800px] whitespace-pre-wrap rounded-sm border border-error-200 bg-error-200/40 p-16 text-xs text-error-600">
            {parseError}
          </pre>
        )}
        {!parseError && data && kind && (
          <PreviewClient
            kind={kind as "lesson" | "practice"}
            data={data}
          />
        )}
        {!parseError && !data && (
          <p className="text-base text-neutral-500">
            Pick a node and a file, then click Load.
          </p>
        )}
      </main>
    </div>
  );
}
