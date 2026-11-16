"use client";

import Link from "next/link";
import type {
  ButtonHTMLAttributes,
  ComponentType,
  InputHTMLAttributes,
  ReactNode,
  SVGProps,
} from "react";
import { AppleIcon, ChevronLeftIcon, GoogleIcon } from "@/components/icons";

/* ---------- Text field (Figma: Input form) ---------- */
type FieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
};

export function Field({ label, icon: Icon, id, ...props }: FieldProps) {
  const inputId = id ?? label.toLowerCase().replace(/\s+/g, "-");
  return (
    <div className="flex w-full flex-col gap-1.5">
      <label
        htmlFor={inputId}
        className="text-sm leading-4 font-medium text-dark"
      >
        {label}
      </label>
      <div className="flex h-10 w-full items-center gap-2 rounded-[10px] border border-line bg-white px-3 py-2.5 focus-within:border-blue">
        <Icon className="size-4 shrink-0 text-body" />
        <input
          id={inputId}
          className="w-full min-w-0 bg-transparent text-sm leading-5 font-medium text-dark outline-none placeholder:text-body"
          {...props}
        />
      </div>
    </div>
  );
}

/* ---------- Primary button (Figma: 40px, radius 8, #285CE0) ---------- */
export function PrimaryButton({
  children,
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={`flex h-10 w-full items-center justify-center gap-1.5 rounded-lg bg-blue px-3 py-2.5 text-sm leading-5 font-semibold tracking-[-0.02em] text-white transition-colors hover:bg-[#1f4fcb] ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

/* ---------- Checkbox ---------- */
export function Checkbox({
  id,
  children,
}: {
  id: string;
  children: ReactNode;
}) {
  return (
    <label htmlFor={id} className="flex cursor-pointer items-center gap-2">
      <input
        id={id}
        type="checkbox"
        className="size-4 cursor-pointer appearance-none rounded border border-line bg-white checked:border-blue checked:bg-blue checked:bg-[url('data:image/svg+xml;utf8,<svg%20xmlns=%22http://www.w3.org/2000/svg%22%20viewBox=%220%200%2016%2016%22><path%20d=%22M4%208.5l2.5%202.5L12%205.5%22%20stroke=%22white%22%20stroke-width=%221.6%22%20fill=%22none%22%20stroke-linecap=%22round%22%20stroke-linejoin=%22round%22/></svg>')] checked:bg-center checked:bg-no-repeat"
      />
      <span className="text-sm leading-4 tracking-[-0.02em] text-body">
        {children}
      </span>
    </label>
  );
}

/* ---------- Dashed divider ---------- */
export function DashedLine() {
  return <div className="h-px w-full border-t border-dashed border-line" />;
}

export function OrDivider() {
  return (
    <div className="flex w-full items-center gap-3">
      <DashedLine />
      <span className="font-jakarta text-sm leading-5 tracking-[-0.0024em] text-black-700">
        or
      </span>
      <DashedLine />
    </div>
  );
}

/* ---------- Social buttons ---------- */
export function SocialButtons() {
  return (
    <div className="flex items-center justify-center gap-4">
      <button
        type="button"
        aria-label="Continue with Apple"
        className="flex size-12 items-center justify-center rounded-full bg-black-100 transition-colors hover:bg-black-200"
      >
        <AppleIcon className="size-7" />
      </button>
      <button
        type="button"
        aria-label="Continue with Google"
        className="flex size-12 items-center justify-center rounded-full bg-black-100 transition-colors hover:bg-black-200"
      >
        <GoogleIcon className="size-6" />
      </button>
    </div>
  );
}

/* ---------- Back button (Figma: chevron-left + "Back") ---------- */
export function BackButton({ href }: { href: string }) {
  return (
    <Link
      href={href}
      className="flex h-9 w-fit items-center gap-1.5 py-2 pr-3 text-sm leading-5 font-medium tracking-[-0.02em] text-dark"
    >
      <ChevronLeftIcon className="size-4" />
      Back
    </Link>
  );
}

/* ---------- Terms text ---------- */
export function TermsLabel() {
  return (
    <>
      I accept the{" "}
      <Link
        href="#"
        className="font-semibold text-dark underline underline-offset-2"
      >
        Terms and Conditions
      </Link>
    </>
  );
}
