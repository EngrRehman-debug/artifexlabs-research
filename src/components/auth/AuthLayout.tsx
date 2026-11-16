import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";

/**
 * Shared shell for every auth screen (Figma frame "Login": 1440 x 900).
 *
 * Figma structure:
 *  Login (bg #F5F9FF, padding 24)
 *   └ Main Content (horizontal, 1392 x 852)
 *      ├ Main Section   668 x 852  (image fill, border-right 1px #EBE7E5)
 *      └ Right panel    724 x 852  (white)
 *         ├ Header      96px  (logo "Group 2" 173.79 x 40.71, centered)
 *         ├ Container   fill  (form centered)
 *         └ Footer      96px  (padding 32, space-between)
 *
 * The 668 / 724 split is kept as a ratio (47.99% / 52.01%) so the image and
 * the form stay half / half on every laptop and desktop width.
 * Below 1024px (tablet / mobile – not designed in Figma) the image is hidden
 * and the form panel takes the full width.
 */
export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-dvh bg-bg-light-blue p-0 sm:p-4 lg:p-6">
      <main className="flex min-h-[calc(100dvh)] w-full sm:min-h-[calc(100dvh-32px)] lg:min-h-[calc(100dvh-48px)]">
        {/* Main Section – hero image */}
        <section className="relative hidden w-[47.99%] shrink-0 overflow-hidden border-r border-black-200 bg-white lg:block">
          <Image
            src="/images/auth-hero.jpg"
            alt="Political Reputation Management presentation on a MacBook"
            fill
            priority
            quality={95}
            sizes="48vw"
            className="object-cover object-center"
          />
        </section>

        {/* Right panel */}
        <section className="flex min-w-0 flex-1 flex-col bg-white">
          <header className="flex h-24 shrink-0 items-center justify-center px-6">
            <Link
              href="/login"
              aria-label="Artifex Labs"
              className="relative block h-[40.71px] w-[173.79px]"
            >
              <Image
                src="/images/logo-artifex-labs.png"
                alt="Artifex Labs"
                width={1254}
                height={229}
                priority
                className="absolute top-[5.23px] left-[6.32px] h-auto w-[167.47px] max-w-none"
              />
            </Link>
          </header>

          <div className="flex flex-1 flex-col items-center justify-center px-4 py-8 sm:px-10">
            {children}
          </div>

          <footer className="flex shrink-0 flex-col items-center justify-between gap-3 px-6 py-6 text-sm leading-[1.5] font-medium text-dark sm:h-24 sm:flex-row sm:gap-0 sm:p-8">
            <span>© Artifex 2026</span>
            <nav className="flex items-center gap-4">
              <Link href="#" className="hover:underline">
                Privacy Policy
              </Link>
              <Link href="#" className="hover:underline">
                Support
              </Link>
            </nav>
          </footer>
        </section>
      </main>
    </div>
  );
}
