import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Image from "next/image";
import { PasswordInput } from "../(auth)/_components/password-input";

export default async function ResetPasswordPage(props: {
  searchParams: Promise<{ error?: string }>;
}) {
  const searchParams = await props.searchParams;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?error=Reset link expired or invalid");
  }

  async function updatePassword(formData: FormData) {
    "use server";

    const password = formData.get("password") as string;
    const confirm = formData.get("confirmPassword") as string;

    if (!password || password.length < 6) {
      redirect("/reset-password?error=Password must be at least 6 characters");
    }
    if (password !== confirm) {
      redirect("/reset-password?error=Passwords do not match");
    }

    const supabase = await createClient();
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      redirect(`/reset-password?error=${encodeURIComponent(error.message)}`);
    }

    await supabase.auth.signOut();
    redirect("/login?message=Password updated. Please log in.");
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
              <p className="text-neutral-800 text-lg">Set a new password</p>
            </header>

            <form
              action={updatePassword}
              className="flex flex-col items-center gap-16 w-[258px]"
            >
              {searchParams.error && (
                <p className="w-full rounded-sm bg-error-200/40 px-3 py-1.5 text-xs text-error-600">
                  {searchParams.error}
                </p>
              )}

              <div className="flex flex-col gap-16 w-full">
                <div className="flex flex-col gap-16 w-full">
                  <PasswordInput
                    name="password"
                    placeholder="New password"
                    required
                    minLength={6}
                  />
                  <PasswordInput
                    name="confirmPassword"
                    placeholder="Confirm new password"
                    required
                    minLength={6}
                  />
                  <span className="text-xs text-neutral-500">
                    Must be at least 6 characters
                  </span>
                </div>

                <button
                  type="submit"
                  className="w-full cursor-pointer rounded-sm bg-primary-400 px-8 py-1.5 select-none font-medium text-neutral-50 shadow-[0px_4px_10.4px_0px_rgba(0,0,0,0.13),inset_0px_1px_2.9px_0px_rgba(255,255,255,0.55)] transition-colors hover:bg-primary-500"
                >
                  Update password
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
