import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getDueReviewQuestions } from "@/db/queries/review";
import { ReviewContainer } from "./review-container";

export default async function ReviewPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const reviewData = await getDueReviewQuestions(user.id);

  if (!reviewData) {
    redirect("/dashboard");
  }

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8">
      <ReviewContainer
        questions={reviewData.questions}
        dueTopics={reviewData.dueTopics}
      />
    </div>
  );
}
