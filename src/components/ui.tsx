import type { ButtonHTMLAttributes, ReactNode } from "react";
import type { AgreementStatus, ChangeStatus } from "@/lib/types";

export function cn(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

export const inputClass =
  "w-full rounded-xl border border-line bg-white px-3.5 py-2.5 text-[15px] text-ink outline-none transition placeholder:text-muted/70 focus:border-accent focus:ring-2 focus:ring-accent/15";

export function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-ink">{label}</span>
      {hint ? <span className="mt-0.5 block text-xs leading-5 text-muted">{hint}</span> : null}
      <div className="mt-1.5">{children}</div>
    </label>
  );
}

export function MoneyField({
  value,
  onChange,
  placeholder = "0",
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="relative">
      <span className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-sm text-muted">
        ₹
      </span>
      <input
        className={cn(inputClass, "pl-8")}
        inputMode="numeric"
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
      />
    </div>
  );
}

export function LineEditor({
  items,
  onChange,
  placeholder,
  addLabel,
}: {
  items: string[];
  onChange: (items: string[]) => void;
  placeholder: string;
  addLabel: string;
}) {
  return (
    <div className="space-y-2">
      {items.map((item, index) => (
        <div key={index} className="flex gap-2">
          <input
            className={inputClass}
            value={item}
            placeholder={placeholder}
            onChange={(event) => {
              const next = items.slice();
              next[index] = event.target.value;
              onChange(next);
            }}
          />
          <button
            type="button"
            className="shrink-0 rounded-xl px-2 text-sm text-muted hover:bg-archive hover:text-ink"
            onClick={() => onChange(items.filter((_, itemIndex) => itemIndex !== index))}
          >
            Remove
          </button>
        </div>
      ))}
      <button
        type="button"
        className="text-sm font-medium text-accent hover:text-ink"
        onClick={() => onChange([...items, ""])}
      >
        {addLabel}
      </button>
    </div>
  );
}

const buttonStyles = {
  primary: "bg-accent text-white hover:bg-[#372fb8]",
  secondary: "border border-line bg-white text-ink hover:border-ink/20",
  ghost: "text-ink hover:bg-archive",
  danger: "bg-white text-bad border border-bad/20 hover:bg-bad-soft",
  light: "bg-white text-ink hover:bg-white/90",
};

export function Button({
  variant = "primary",
  className,
  type = "button",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: keyof typeof buttonStyles;
}) {
  return (
    <button
      type={type}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-full px-4 py-2.5 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-50",
        buttonStyles[variant],
        className,
      )}
      {...props}
    />
  );
}

export function ErrorList({ errors }: { errors: string[] }) {
  if (errors.length === 0) return null;
  return (
    <div role="alert" className="rounded-2xl border border-bad/20 bg-bad-soft px-4 py-3 text-sm text-bad">
      <ul className="list-disc space-y-1 pl-4">
        {errors.map((error) => (
          <li key={error}>{error}</li>
        ))}
      </ul>
    </div>
  );
}

const agreementTones: Record<AgreementStatus, string> = {
  draft: "bg-warn-soft text-warn",
  accepted: "bg-good-soft text-good",
};

const changeTones: Record<ChangeStatus, string> = {
  requested: "bg-warn-soft text-warn",
  proposed: "bg-violet-soft text-violet",
  approved: "bg-good-soft text-good",
  rejected: "bg-bad-soft text-bad",
  declined: "bg-archive text-muted",
};

const markerTones = {
  client: "bg-party-client-soft text-party-client",
  freelancer: "bg-party-freelancer-soft text-party-freelancer",
  scope: "bg-kind-scope-soft text-kind-scope",
  timeline: "bg-kind-timeline-soft text-kind-timeline",
};

export function StatusBadge({
  status,
  label,
  tone,
}: {
  status: AgreementStatus | ChangeStatus | "added" | "original";
  label: string;
  tone?: keyof typeof markerTones;
}) {
  const color = tone
    ? markerTones[tone]
    : status === "added"
      ? "bg-violet-soft text-violet"
      : status === "original"
        ? "bg-archive text-ink"
        : status in agreementTones
          ? agreementTones[status as AgreementStatus]
          : changeTones[status as ChangeStatus];

  return (
    <span className={cn("inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium", color)}>
      {label}
    </span>
  );
}

export function Stat({
  label,
  value,
  hint,
  href,
  hrefLabel,
}: {
  label: string;
  value: string;
  hint?: string;
  href?: string;
  hrefLabel?: string;
}) {
  return (
    <div className="rounded-2xl border border-line bg-card px-4 py-4">
      <p className="text-[11px] font-medium tracking-[0.16em] text-muted uppercase">{label}</p>
      <p className="mt-2 font-display text-2xl tracking-tight text-ink">{value}</p>
      {hint ? <p className="mt-1 text-sm text-muted">{hint}</p> : null}
      {href ? (
        <a href={href} className="mt-2 inline-block text-sm font-medium text-accent">
          {hrefLabel ?? "Open"}
        </a>
      ) : null}
    </div>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  text,
}: {
  eyebrow: string;
  title: string;
  text?: string;
}) {
  return (
    <div className="mb-5">
      <p className="text-[11px] font-medium tracking-[0.16em] text-accent uppercase">{eyebrow}</p>
      <h2 className="mt-1 font-display text-3xl tracking-tight text-ink">{title}</h2>
      {text ? <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">{text}</p> : null}
    </div>
  );
}
