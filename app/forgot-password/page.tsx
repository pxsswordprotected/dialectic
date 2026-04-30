import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import Image from "next/image";
import Link from "next/link";

export default async function ForgotPasswordPage(props: {
  searchParams: Promise<{ error?: string }>;
}) {
  const searchParams = await props.searchParams;

  async function requestReset(formData: FormData) {
    "use server";

    const email = ((formData.get("email") as string) ?? "").trim();
    if (!email) {
      redirect("/forgot-password?error=Please enter your email");
    }

    const h = await headers();
    const proto = h.get("x-forwarded-proto") ?? "http";
    const host = h.get("host");
    const origin = `${proto}://${host}`;

    const supabase = await createClient();
    await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${origin}/auth/callback?next=/reset-password`,
    });

    redirect(
      "/login?message=If that email is registered, a reset link is on its way.",
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <div className="flex w-full max-w-[1256px] h-[min(750px,calc(100dvh-48px))] overflow-hidden rounded-sm border border-neutral-300 bg-white">
        <div className="relative hidden md:block flex-1">
          <Image
            src="/images/The_School_of_Athens__by_Raffaello_Sanzio_da_Urbino-scaled (1).jpg"
            alt=""
            fill
            sizes="50vw"
            priority
            className="object-cover"
          />
        </div>

        <div className="flex flex-1 items-center justify-center bg-white">
          <div className="flex flex-col items-center gap-16 w-[339px]">
            <header className="flex flex-col items-center gap-[18px] text-center">
              <h1 className="font-heading text-primary-400 text-2xl select-none">
                Dialectic
              </h1>
              <p className="text-neutral-800 text-lg">
                Forgot your password? Enter your email and we&apos;ll send you a
                reset link.
              </p>
            </header>

            <form
              action={requestReset}
              className="flex flex-col items-center gap-16 w-[258px]"
            >
              {searchParams.error && (
                <p className="w-full rounded-sm bg-error-200/40 px-3 py-1.5 text-xs text-error-600">
                  {searchParams.error}
                </p>
              )}

              <div className="flex flex-col gap-16 w-full">
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  placeholder="Email"
                  className="w-full rounded-sm border border-neutral-300 bg-neutral-100 px-8 py-1.5 text-base text-neutral-800 placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-primary-300 select-none"
                />

                <button
                  type="submit"
                  className="w-full cursor-pointer rounded-sm bg-primary-400 px-8 py-1.5 select-none font-medium text-neutral-50 shadow-[0px_4px_10.4px_0px_rgba(0,0,0,0.13),inset_0px_1px_2.9px_0px_rgba(255,255,255,0.55)] transition-colors hover:bg-primary-500"
                >
                  Send reset link
                </button>
              </div>

              <p className="text-xs text-neutral-800 text-center">
                <Link href="/login" className="underline">
                  Back to log in
                </Link>
              </p>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
