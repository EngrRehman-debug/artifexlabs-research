import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

export function MailIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 16 16" fill="none" aria-hidden {...props}>
      <path
        d="m1.333 4 4.61 2.612c1.698.962 2.416.962 4.114 0L14.667 4"
        stroke="currentColor"
        strokeWidth="1.1"
        strokeLinejoin="round"
      />
      <path
        d="M1.344 8.984c.044 2.044.065 3.066.82 3.823.753.757 1.803.784 3.904.837 1.295.033 2.577.033 3.872 0 2.1-.053 3.15-.08 3.905-.837.754-.757.776-1.779.819-3.823.014-.657.014-1.311 0-1.968-.043-2.044-.065-3.066-.82-3.823-.753-.757-1.803-.784-3.904-.837a76.4 76.4 0 0 0-3.872 0c-2.1.053-3.15.08-3.904.837-.755.757-.776 1.779-.82 3.823a46.6 46.6 0 0 0 0 1.968Z"
        stroke="currentColor"
        strokeWidth="1.1"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function LockIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 16 16" fill="none" aria-hidden {...props}>
      <path
        d="M3.333 10.333a4.667 4.667 0 1 0 9.334 0 4.667 4.667 0 0 0-9.334 0Z"
        stroke="currentColor"
        strokeWidth="1.1"
      />
      <path
        d="M10.667 6.667V4.333a2.667 2.667 0 1 0-5.334 0v2.334M8 9.667v1.333"
        stroke="currentColor"
        strokeWidth="1.1"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function UserIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 16 16" fill="none" aria-hidden {...props}>
      <path
        d="M4.153 10.32c-.943.561-3.415 1.708-1.909 3.14.735.7 1.554 1.2 2.584 1.2h5.877c1.03 0 1.849-.5 2.584-1.2 1.506-1.432-.966-2.579-1.909-3.14a7.105 7.105 0 0 0-7.227 0Z"
        stroke="currentColor"
        strokeWidth="1.1"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M10.667 4.333a2.667 2.667 0 1 1-5.334 0 2.667 2.667 0 0 1 5.334 0Z"
        stroke="currentColor"
        strokeWidth="1.1"
      />
    </svg>
  );
}

export function ChevronLeftIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 16 16" fill="none" aria-hidden {...props}>
      <path
        d="M10 4S6 6.946 6 8s4 4 4 4"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function AppleIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden {...props}>
      <path
        fill="#042053"
        d="M16.37 12.73c-.02-2.3 1.88-3.4 1.96-3.46-1.07-1.56-2.73-1.77-3.32-1.8-1.41-.14-2.76.83-3.47.83-.72 0-1.82-.81-2.99-.79-1.54.02-2.96.9-3.75 2.27-1.6 2.78-.41 6.89 1.15 9.14.76 1.1 1.67 2.34 2.86 2.3 1.15-.05 1.58-.74 2.97-.74 1.38 0 1.77.74 2.98.72 1.24-.02 2.02-1.12 2.77-2.23.87-1.28 1.23-2.52 1.25-2.58-.03-.01-2.39-.92-2.41-3.66ZM14.1 5.98c.63-.77 1.06-1.83.94-2.89-.91.04-2.02.61-2.67 1.37-.58.67-1.09 1.76-.96 2.8 1.02.08 2.06-.52 2.69-1.28Z"
      />
    </svg>
  );
}

export function GoogleIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden {...props}>
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1Z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23Z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.1A6.6 6.6 0 0 1 5.5 12c0-.73.13-1.44.34-2.1V7.06H2.18A11 11 0 0 0 1 12c0 1.77.43 3.45 1.18 4.94l3.66-2.84Z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1A11 11 0 0 0 2.18 7.06l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38Z"
      />
    </svg>
  );
}
