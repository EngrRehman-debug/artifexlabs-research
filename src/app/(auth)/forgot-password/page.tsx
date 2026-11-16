"use client";

import { useRouter } from "next/navigation";
import { MailIcon } from "@/components/icons";
import {
  BackButton,
  Checkbox,
  Field,
  PrimaryButton,
  TermsLabel,
} from "@/components/auth/ui";

export default function ForgotPasswordPage() {
  const router = useRouter();

  return (
    <div className="flex w-full max-w-[412px] flex-col gap-6">
      <BackButton href="/login" />

      <div className="flex flex-col gap-1">
        <h1 className="text-2xl leading-8 font-bold tracking-[-0.04em] text-dark">
          Forgot your password?
        </h1>
        <p className="max-w-[361px] text-base leading-6 tracking-[-0.02em] text-body">
          Type in your email and we will send you a code to reset your
          password!
        </p>
      </div>

      <form
        className="flex flex-col gap-6"
        onSubmit={(e) => {
          e.preventDefault();
          router.push("/forgot-password/verify");
        }}
      >
        <Field
          label="Your email"
          icon={MailIcon}
          type="email"
          placeholder="Enter your email"
          autoComplete="email"
        />
        <Checkbox id="terms">
          <TermsLabel />
        </Checkbox>
        <PrimaryButton type="submit">Verify</PrimaryButton>
      </form>
    </div>
  );
}
