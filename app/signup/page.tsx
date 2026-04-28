import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Image from "next/image";
import Link from "next/link";
import { PasswordInput } from "../(auth)/_components/password-input";

export default async function SignupPage(props: {
  searchParams: Promise<{ error?: string; message?: string }>;
}) {
  const searchParams = await props.searchParams;

  async function signup(formData: FormData) {
    "use server";

    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    const supabase = await createClient();
    const { data, error } = await supabase.auth.signUp({ email, password });

    if (error) {
      redirect(`/signup?error=${encodeURIComponent(error.message)}`);
    }

    if (data.user && data.user.identities?.length === 0) {
      redirect(
        `/signup?error=${encodeURIComponent(
          "An account with that email already exists. Try logging in.",
        )}`,
      );
    }

    redirect("/login?message=Check your email to confirm your account");
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
              <h1 className="font-heading text-primary-400 select-none text-2xl">
                Dialectic
              </h1>
              <p className="text-neutral-800 text-lg">
                Ready to start learning? Create an account below!
              </p>
            </header>

            <form
              action={signup}
              className="flex flex-col items-center gap-16 w-[258px]"
            >
              {searchParams.error && (
                <p className="w-fit rounded-sm bg-error-200/40 px-3 py-1.5 text-xs text-error-600 whitespace-nowrap">
                  {searchParams.error}
                </p>
              )}
              {searchParams.message && (
                <p className="w-full rounded-sm bg-success-200/40 px-3 py-1.5 text-xs text-success-500">
                  {searchParams.message}
                </p>
              )}

              <div className="flex flex-col gap-16 w-full">
                <div className="flex flex-col gap-16 w-full">
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    placeholder="Email"
                    className="w-full rounded-sm select-none border border-neutral-300 bg-neutral-100 px-8 py-1.5 text-base text-neutral-800 placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-primary-300"
                  />

                  <div className="flex flex-col items-end gap-1.5 w-full">
                    <PasswordInput name="password" required minLength={6} />
                    <span className="text-xs text-neutral-500">
                      Must be at least 6 characters
                    </span>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full rounded-sm bg-primary-400 px-4 py-1.5 font-medium text-neutral-50 select-none shadow-[0px_4px_10.4px_0px_rgba(0,0,0,0.13),inset_0px_1px_2.9px_0px_rgba(255,255,255,0.55)] transition-colors hover:bg-primary-500"
                >
                  Create Account
                </button>
              </div>

              <p className="text-xs text-neutral-800 text-center">
                Already have an account?{" "}
                <Link href="/login" className="underline">
                  Log in
                </Link>
              </p>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
