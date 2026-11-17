"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LockIcon } from "@/components/icons";
import {
  BackButton,
  Checkbox,
  Field,
  PrimaryButton,
  TermsLabel,
} from "@/components/auth/ui";

export default function ChangePasswordPage() {
  const router = useRouter();
  const [mismatch, setMismatch] = useState(false);

  return (
    <div className="flex w-full max-w-[412px] flex-col gap-6">
      <BackButton href="/forgot-password/verify" />

      <div className="flex flex-col gap-1">
        <h1 className="text-2xl leading-8 font-bold tracking-[-0.04em] text-dark">
          Change password
        </h1>
        <p className="max-w-[361px] text-base leading-6 tracking-[-0.02em] text-body">
          Your new password must be different from previous passwords.
        </p>
      </div>

      <form
        className="flex flex-col gap-6"
        onSubmit={(e) => {
          e.preventDefault();
          const f = new FormData(e.currentTarget);
          if (f.get("new-password") !== f.get("repeat-password")) {
            setMismatch(true);
            return;
          }
          router.push("/login");
        }}
      >
        <div className="flex flex-col gap-6">
          <Field
            label="New password"
            icon={LockIcon}
            type="password"
            placeholder="••••••••••"
            autoComplete="new-password"
            name="new-password"
            minLength={8}
            onChange={() => setMismatch(false)}
          />
          <Field
            label="Repeat password"
            icon={LockIcon}
            type="password"
            placeholder="••••••••••"
            autoComplete="new-password"
            name="repeat-password"
            onChange={() => setMismatch(false)}
          />
          {mismatch && (
            <p role="alert" className="-mt-3 text-xs text-[#FF2020]">
              Passwords do not match.
            </p>
          )}
        </div>
        <Checkbox id="terms">
          <TermsLabel />
        </Checkbox>
        <PrimaryButton type="submit">Verify</PrimaryButton>
      </form>
    </div>
  );
}
