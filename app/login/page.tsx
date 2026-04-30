import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Image from "next/image";
import Link from "next/link";
import { PasswordInput } from "../(auth)/_components/password-input";
import { MessageToast } from "./_components/message-toast";

export default async function LoginPage(props: {
  searchParams: Promise<{ error?: string; message?: string }>;
}) {
  const searchParams = await props.searchParams;

  async function login(formData: FormData) {
    "use server";

    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    const supabase = await createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      redirect(`/login?error=${encodeURIComponent(error.message)}`);
    }

    redirect("/dashboard");
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
                Back for more learning? Log in below!
              </p>
            </header>

            <form
              action={login}
              className="relative flex flex-col items-center gap-16 w-[258px]"
            >
              {searchParams.error && (
                <p className="w-full rounded-sm bg-error-200/40 px-3 py-1.5 text-xs text-error-600">
                  {searchParams.error}
                </p>
              )}
              <div className="flex flex-col gap-16 w-full">
                <div className="flex flex-col gap-16 w-full">
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    placeholder="Username or email"
                    className="w-full rounded-sm border border-neutral-300 bg-neutral-100 px-8 py-1.5 text-base text-neutral-800 placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-primary-300 select-none"
                  />

                  <div className="flex flex-col items-end gap-1.5 w-full">
                    <span className="text-xs text-neutral-500 underline">
                      Forgot password?
                    </span>
                    <PasswordInput name="password" required />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full cursor-pointer rounded-sm bg-primary-400 px-8 py-1.5 select-none font-medium text-neutral-50 shadow-[0px_4px_10.4px_0px_rgba(0,0,0,0.13),inset_0px_1px_2.9px_0px_rgba(255,255,255,0.55)] transition-colors hover:bg-primary-500"
                >
                  Log In
                </button>
              </div>

              <p className="text-xs text-neutral-800 text-center ">
                Don&apos;t have an account?{" "}
                <Link href="/signup" className="underline">
                  Sign up
                </Link>
              </p>

              {searchParams.message && (
                <MessageToast message={searchParams.message} />
              )}
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
