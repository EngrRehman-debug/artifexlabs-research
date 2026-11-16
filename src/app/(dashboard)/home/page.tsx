"use client";

import { Database01, Folder, Send03, Signal01 } from "@untitledui/icons";
import {
  Add01Icon,
  ArrowDown01Icon,
  ArrowUpRight01Icon,
  Calendar03Icon,
  Mic01Icon,
  MoonEclipseIcon,
  RepeatIcon,
} from "@hugeicons/core-free-icons";
import TopBar from "@/components/dashboard/TopBar";
import AreaChart from "@/components/dashboard/AreaChart";
import Icon, { huge, untitled, type AnyIcon } from "@/components/dashboard/Icon";

const COLUMNS: { title: string; icon: AnyIcon; items: string[] }[] = [
  {
    title: "Priority Intelligence Briefing",
    icon: untitled(Folder),
    items: [
      "Financial plan — baseline and scenarios",
      "Financial and delivery risk assessment",
      "Commercial Viability",
    ],
  },
  {
    title: "Active Initiatives",
    icon: huge(MoonEclipseIcon),
    items: [
      "Industrial Heat Recovery — Sample Pilot",
      "Hydrogen Energy Feasibility",
      "Industrial Reliability Program",
    ],
  },
  {
    title: "Monitoring Coverage",
    icon: untitled(Signal01),
    items: [
      "Industrial Heat Recovery — Sample Pilot",
      "Hydrogen Energy Feasibility",
      "Industrial Reliability Program",
    ],
  },
];

function SmallButton({ children, label }: { children: React.ReactNode; label: string }) {
  return (
    <button
      type="button"
      aria-label={label}
      className="flex size-[26.78px] items-center justify-center rounded-lg border-[0.84px] border-[#EDEDF0] bg-white text-body"
    >
      {children}
    </button>
  );
}

function ChartCard({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="flex min-w-0 flex-1 flex-col gap-[13.39px] rounded-[20px] border-[0.84px] border-[#EDEDF0] bg-white p-5">
      <div>
        <h3 className="text-base leading-[1.5] font-medium tracking-[-0.02em] text-[#101D37]">
          {title}
        </h3>
        <p className="text-sm leading-[1.5] tracking-[-0.02em] text-body">
          {subtitle}
        </p>
      </div>
      <AreaChart />
    </div>
  );
}

export default function HomePage() {
  return (
    <div className="flex min-w-0 flex-1 flex-col">
      <TopBar current="Home" />

      <main className="px-4 pt-10 pb-16 sm:px-6 lg:px-10">
        {/* Figma: Frame 2147232114 – 964 wide, centered, gap 30 */}
        <div className="mx-auto flex w-full max-w-[964px] flex-col gap-[30px]">
          <h1 className="text-center text-2xl leading-[1.2] font-semibold tracking-[-0.02em] text-[#101D37] sm:text-[30px]">
            What Would You <span className="text-blue">Like To Investigate?</span>
          </h1>

          {/* Prompt card */}
          <form
            onSubmit={(e) => e.preventDefault()}
            className="flex flex-col gap-4 rounded-[20px] border border-[#EDEDF0] bg-white p-5 shadow-[0_14px_30px_0_rgba(40,92,224,0.10)]"
          >
            <label className="flex items-center gap-2 rounded-[14px] border border-[#EDEDF0] bg-[#FAFAFA] p-4">
              <Icon icon={huge(Add01Icon)} size={16} className="shrink-0 text-body" />
              <input
                type="text"
                placeholder="Describe a question, research objective or decision to make.."
                className="w-full min-w-0 bg-transparent text-base leading-[1.5] tracking-[-0.02em] text-[#101D37] outline-none placeholder:text-body"
              />
            </label>
            <div className="flex items-center justify-between gap-2.5">
              <button
                type="button"
                className="flex h-9 items-center gap-1 rounded-[10px] border border-[#EDEDF0] p-2.5 text-sm leading-[1.5] tracking-[-0.02em] text-body"
              >
                <Icon icon={untitled(Database01)} size={16} />
                Evidence Sources
                <Icon icon={huge(ArrowDown01Icon)} size={16} />
              </button>
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  aria-label="Voice input"
                  className="flex size-9 items-center justify-center rounded-[10px] border border-[#EDEDF0] text-body"
                >
                  <Icon icon={huge(Mic01Icon)} size={16} />
                </button>
                <button
                  type="submit"
                  aria-label="Send"
                  className="flex size-9 items-center justify-center rounded-[10px] bg-blue text-white"
                >
                  <Icon icon={untitled(Send03)} size={16} />
                </button>
              </div>
            </div>
          </form>

          {/* Three columns – 301.33 each, gap 30 */}
          <div className="grid grid-cols-1 gap-[30px] md:grid-cols-3">
            {COLUMNS.map(({ title, icon, items }) => (
              <section key={title} className="flex flex-col gap-4">
                <h2 className="text-base leading-[1.5] font-medium tracking-[-0.02em] text-[#101D37]">
                  {title}
                </h2>
                <ul className="flex flex-col gap-3">
                  {items.map((item, i) => (
                    <li key={item} className="flex flex-col gap-3">
                      {i > 0 && <div className="h-px w-full bg-[#EDEDF0]" />}
                      <a
                        href="#"
                        className="group flex items-center gap-1.5 text-sm leading-[1.5] tracking-[-0.02em] text-body hover:text-[#101D37]"
                      >
                        <Icon icon={icon} size={16} className="shrink-0" />
                        <span className="min-w-0 flex-1 truncate">{item}</span>
                        <Icon icon={huge(ArrowUpRight01Icon)} size={16} className="shrink-0" />
                      </a>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>

          <div className="h-px w-full bg-[#EDEDF0]" />

          {/* Analytics */}
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-xl leading-[1.5] font-semibold tracking-[-0.02em] text-[#101D37]">
              Analytics
            </h2>
            <div className="flex items-center gap-2">
              <SmallButton label="Add widget">
                <Icon icon={huge(Add01Icon)} size={13} stroke={1.1} />
              </SmallButton>
              <SmallButton label="Switch view">
                <Icon icon={huge(RepeatIcon)} size={13} stroke={1.1} />
              </SmallButton>
              <button
                type="button"
                className="flex h-[26.78px] items-center gap-[3.35px] rounded-lg border-[0.84px] border-[#EDEDF0] bg-white px-[10.04px] py-[6.69px] text-[11.72px] leading-[1.5] tracking-[-0.02em] text-body"
              >
                <Icon icon={huge(Calendar03Icon)} size={13} stroke={1.1} />
                Last 4 Weeks
                <Icon icon={huge(ArrowDown01Icon)} size={13} stroke={1.1} />
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-4 md:flex-row">
            <ChartCard
              title="Research Activity Overview"
              subtitle="Research items created over time"
            />
            <ChartCard
              title="Research Item Status"
              subtitle="Research items created over time"
            />
          </div>
        </div>
      </main>
    </div>
  );
}
