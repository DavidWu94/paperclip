import type { ReactNode } from "react";
import type {
  ToolRiskLevel,
  ToolConnectionHealthStatus,
  ToolPolicyDecision,
} from "@paperclipai/shared";
import { AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/StatusBadge";
import { ApiError } from "@/api/client";
import { i18n, useTranslation } from "@/i18n";
import skillsExtraEn from "@/i18n/partials/skills.en.json";
import skillsExtraZhTW from "@/i18n/partials/skills.zh-TW.json";

i18n.addResourceBundle("en", "translation", skillsExtraEn, true, false);
i18n.addResourceBundle("zh-TW", "translation", skillsExtraZhTW, true, false);

/** Risk classification badge for a catalog tool. */
export function RiskBadge({ risk }: { risk: ToolRiskLevel | null | undefined }) {
  const { t } = useTranslation();
  if (!risk) return <Badge variant="outline">{t("skillsExtra.tools.unknownRisk")}</Badge>;
  const variant =
    risk === "high" || risk === "critical"
      ? "destructive"
      : risk === "medium"
        ? "secondary"
        : "outline";
  return <Badge variant={variant}>{risk}</Badge>;
}

/** Read/Write/Destructive capability chips. */
export function CapabilityBadges({
  isReadOnly,
  isWrite,
  isDestructive,
}: {
  isReadOnly?: boolean;
  isWrite?: boolean;
  isDestructive?: boolean;
}) {
  const { t } = useTranslation();
  return (
    <span className="inline-flex flex-wrap gap-1">
      {isReadOnly ? <Badge variant="outline">{t("skillsExtra.tools.readOnly")}</Badge> : null}
      {isWrite ? <Badge variant="secondary">{t("skillsExtra.tools.write")}</Badge> : null}
      {isDestructive ? <Badge variant="destructive">{t("skillsExtra.tools.destructive")}</Badge> : null}
    </span>
  );
}

/** Catalog quarantine marker — canonical status key. */
export function QuarantineBadge() {
  return <StatusBadge status="quarantined" />;
}

function healthToStatusKey(status: string): string {
  switch (status) {
    case "healthy":
    case "ok":
    case "":
      return "healthy";
    case "degraded":
    case "warning":
      return "degraded";
    case "error":
    case "unhealthy":
    case "critical":
      return "runtime-error";
    case "unchecked":
    case "unknown":
      return "unchecked";
    default:
      return status;
  }
}

/** Connection / runtime health badge, mapped onto canonical status colors. */
export function HealthBadge({
  status,
  label,
}: {
  status: ToolConnectionHealthStatus | string | null | undefined;
  label?: string;
}) {
  const raw = (status ?? "unknown").toString();
  return <StatusBadge status={healthToStatusKey(raw)} label={label ?? raw} />;
}

function decisionLabelKey(decision: string): string | null {
  switch (decision) {
    case "allow":
    case "allowed":
      return "skillsExtra.tools.allowed";
    case "deny":
    case "denied":
      return "skillsExtra.tools.denied";
    case "block":
      return "skillsExtra.tools.block";
    case "require_approval":
    case "requires_approval":
      return "skillsExtra.tools.requireApproval";
    case "redact":
    case "redacted":
      return "skillsExtra.tools.redacted";
    case "rate_limited":
      return "skillsExtra.tools.rateLimited";
    case "defer":
    case "deferred":
      return "skillsExtra.tools.deferred";
    case "hidden":
      return "skillsExtra.tools.hidden";
    default:
      return null;
  }
}

function decisionStatusKey(decision: string): string {
  switch (decision) {
    case "allow":
    case "allowed":
      return "allowed";
    case "deny":
    case "denied":
      return "denied";
    case "block":
      return "block";
    case "require_approval":
    case "requires_approval":
      return "require-approval";
    case "redact":
    case "redacted":
      return "redacted";
    case "rate_limited":
      return "rate-limit";
    case "defer":
    case "deferred":
      return "deferred";
    case "hidden":
      return "hidden";
    default:
      return decision;
  }
}

/** Policy/gateway decision badge — canonical status colors. */
export function DecisionBadge({ decision }: { decision: ToolPolicyDecision | string | null | undefined }) {
  const { t } = useTranslation();
  if (!decision) return <Badge variant="outline">—</Badge>;
  const raw = decision.toString();
  const labelKey = decisionLabelKey(raw);
  return <StatusBadge status={decisionStatusKey(raw)} label={labelKey ? t(labelKey) : raw} />;
}

/** Compact relative time, falling back to absolute. */
export function RelativeTime({ value }: { value: Date | string | null | undefined }) {
  const { t } = useTranslation();
  if (!value) return <span className="text-muted-foreground">{t("skillsExtra.tools.never")}</span>;
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return <span className="text-muted-foreground">—</span>;
  const diffMs = Date.now() - date.getTime();
  const abs = Math.abs(diffMs);
  const mins = Math.round(abs / 60000);
  const isFuture = diffMs < 0;
  let text: string;
  if (mins < 1) text = t("skillsExtra.tools.justNow");
  else {
    const amount =
      mins < 60 ? `${mins}m` : mins < 1440 ? `${Math.round(mins / 60)}h` : `${Math.round(mins / 1440)}d`;
    text = isFuture
      ? t("skillsExtra.tools.inFuture", { value: amount })
      : t("skillsExtra.tools.ago", { value: amount });
  }
  return (
    <span title={date.toLocaleString()} className="text-muted-foreground">
      {text}
    </span>
  );
}

export function ToolsPageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div className="space-y-1">
        <h2 className="text-lg font-semibold text-foreground">{title}</h2>
        {description ? <p className="max-w-2xl text-sm text-muted-foreground">{description}</p> : null}
      </div>
      {actions ? <div className="flex shrink-0 gap-2">{actions}</div> : null}
    </div>
  );
}

export function LoadingState({ label }: { label?: string }) {
  const { t } = useTranslation();
  const text = label ?? t("skillsExtra.common.loading");
  return (
    <div className="flex items-center gap-2 py-10 text-sm text-muted-foreground">
      <span className="h-4 w-4 animate-spin rounded-full border-2 border-muted-foreground/30 border-t-muted-foreground" />
      {text}
    </div>
  );
}

/** Actionable error surface — surfaces the server message and HTTP status. */
export function ErrorState({ error, onRetry }: { error: unknown; onRetry?: () => void }) {
  const { t } = useTranslation();
  let message: string;
  if (error instanceof ApiError) {
    if (error.status === 403) {
      message = t("skillsExtra.tools.forbidden");
    } else if (error.status === 404 || /route not found/i.test(error.message)) {
      // Snapshot-skew window: the route exists in this build but not on the live server snapshot yet.
      message = t("skillsExtra.tools.notDeployed");
    } else {
      message = error.message;
    }
  } else if (error instanceof Error) {
    message = error.message;
  } else {
    message = t("skillsExtra.common.somethingWrong");
  }
  return (
    <Card className="border-destructive/40">
      <CardContent className="flex flex-col gap-3 py-6">
        <div className="flex items-start gap-2 text-sm text-destructive">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <div>
            <p className="font-medium">{t("skillsExtra.tools.couldNotLoad")}</p>
            <p className="text-destructive/80">{message}</p>
          </div>
        </div>
        {onRetry ? (
          <button
            type="button"
            onClick={onRetry}
            className="self-start rounded-md border border-border px-3 py-1.5 text-xs font-medium hover:bg-accent"
          >
            {t("skillsExtra.common.retry")}
          </button>
        ) : null}
      </CardContent>
    </Card>
  );
}

/**
 * Honest notice for surfaces whose backend contract has not shipped yet.
 * This must NOT pretend to enforce anything client-side — it links the
 * follow-up issue that owns the missing contract.
 */
export function PendingBackendNotice({
  title,
  body,
  issue,
}: {
  title: string;
  body: ReactNode;
  issue?: { identifier: string; href: string };
}) {
  const { t } = useTranslation();
  return (
    <Card className="border-dashed">
      <CardContent className="flex flex-col gap-2 py-8">
        <div className="flex items-center gap-2 text-sm font-medium text-foreground">
          <AlertTriangle className="h-4 w-4 text-amber-500" />
          {title}
        </div>
        <p className="max-w-2xl text-sm text-muted-foreground">{body}</p>
        {issue ? (
          <a href={issue.href} className="text-sm font-medium text-primary hover:underline">
            {t("skillsExtra.tools.trackedIn", { identifier: issue.identifier })}
          </a>
        ) : null}
      </CardContent>
    </Card>
  );
}
