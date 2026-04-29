import type { Metadata } from "next";
import { eq, asc } from "drizzle-orm";
import { db } from "@/db";
import { topics, courses } from "@/db/schema";
import { DevTools } from "./dev-tools";
import { Agentation } from "agentation";
import "./globals.css";

export const metadata: Metadata = {
  title: "Dialectic",
  description: "Learn philopsophy",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const isDev = process.env.NODE_ENV === "development";

  let topicList: { id: string; title: string }[] = [];
  if (isDev) {
    topicList = await db
      .select({ id: topics.id, title: topics.title })
      .from(topics)
      .innerJoin(courses, eq(topics.courseId, courses.id))
      .where(eq(courses.slug, "intro-logic"))
      .orderBy(asc(topics.sortOrder));
  }

  return (
    <html lang="en" className="h-full antialiased">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          rel="preconnect"
          href="https://api.fontshare.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Libre+Baskerville:ital,wght@0,400;0,700;1,400&display=swap"
          rel="stylesheet"
        />
        <link
          href="https://api.fontshare.com/v2/css?f[]=general-sans@200,300,400,500,600,700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-full flex flex-col">
        {children}
        {isDev && <DevTools topics={topicList} />}
        {isDev && <Agentation />}
      </body>
    </html>
  );
}
