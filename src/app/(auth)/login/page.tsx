"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { LockIcon, MailIcon } from "@/components/icons";
import {
  Checkbox,
  DashedLine,
  Field,
  OrDivider,
  PrimaryButton,
  SocialButtons,
} from "@/components/auth/ui";

export default function LoginPage() {
  const router = useRouter();

  return (
    <div className="flex w-full max-w-[371px] flex-col gap-6">
      <div className="flex flex-col gap-1 text-center">
        <h1 className="text-xl leading-[1.2] font-bold tracking-[-0.02em] text-dark">
          Welcome Back to Artifex Labs
        </h1>
        <p className="text-sm leading-[1.5] tracking-[-0.02em] text-body">
          Enter your username and password to continue.
        </p>
      </div>

      <DashedLine />

      <form
        className="flex flex-col gap-6"
        onSubmit={(e) => {
          e.preventDefault();
          router.push("/home");
        }}
      >
        <div className="flex flex-col gap-4">
          <Field
            label="Your Email"
            icon={MailIcon}
            type="email"
            placeholder="Enter your email"
            autoComplete="email"
          />
          <Field
            label="Password"
            icon={LockIcon}
            type="password"
            placeholder="••••••••••"
            autoComplete="current-password"
          />
        </div>

        <div className="flex items-center justify-between">
          <Checkbox id="remember">Remember me</Checkbox>
          <Link
            href="/forgot-password"
            className="text-right text-sm leading-4 font-medium tracking-[-0.02em] text-dark hover:text-blue"
          >
            Forgot password?
          </Link>
        </div>

        <PrimaryButton type="submit">Log In</PrimaryButton>
      </form>

      <OrDivider />
      <SocialButtons />

      <p className="text-center text-sm leading-[1.5] font-medium text-dark">
        Don’t have an account?{" "}
        <Link
          href="/create-account"
          className="font-semibold underline underline-offset-2 hover:text-blue"
        >
          Create Account
        </Link>
      </p>
    </div>
  );
}
