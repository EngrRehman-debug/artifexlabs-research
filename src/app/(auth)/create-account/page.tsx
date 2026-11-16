"use client";

import Link from "next/link";
import { LockIcon, MailIcon, UserIcon } from "@/components/icons";
import {
  DashedLine,
  Field,
  OrDivider,
  PrimaryButton,
  SocialButtons,
} from "@/components/auth/ui";

export default function CreateAccountPage() {
  return (
    <div className="flex w-full max-w-[371px] flex-col gap-6">
      <div className="flex flex-col gap-1 text-center">
        <h1 className="text-xl leading-[1.2] font-bold tracking-[-0.02em] text-dark">
          Create Your Artifex Labs Account
        </h1>
        <p className="text-sm leading-[1.5] tracking-[-0.02em] text-body">
          Please enter your details to create your account
        </p>
      </div>

      <DashedLine />

      <form
        className="flex flex-col gap-6"
        onSubmit={(e) => e.preventDefault()}
      >
        <div className="flex flex-col gap-4">
          <Field
            label="Your Name"
            icon={UserIcon}
            type="text"
            placeholder="Enter your name"
            autoComplete="name"
          />
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
            autoComplete="new-password"
          />
        </div>

        <PrimaryButton type="submit">Create Account</PrimaryButton>
      </form>

      <OrDivider />
      <SocialButtons />

      <p className="text-center text-sm leading-[1.5] font-medium text-dark">
        Do you have an account?{" "}
        <Link href="/login" className="font-semibold">
          Login
        </Link>
      </p>
    </div>
  );
}
