import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getTopicWithSlides } from "@/db/queries/topic";
import { SlideViewer } from "./slide-viewer";

export default async function TopicPage({
  params,
}: {
  params: Promise<{ topicSlug: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { topicSlug } = await params;
  const data = await getTopicWithSlides(topicSlug);

  if (!data) {
    notFound();
  }

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8">
      <SlideViewer topic={data.topic} slides={data.slides} />
    </div>
  );
}
