import { Badge } from "@/components/ui/badge";
import { useTranslation } from "@/i18n";
import { cn } from "@/lib/utils";
import { brandChipBadge } from "@/lib/status-colors";
import type { BuiltInAgentStatus } from "@/api/builtInAgents";

/**
 * Derived lifecycle chip. Rendered for the amber attention states
 * (`needs_setup`, `pending_approval`). Kept separate from the real agent status
 * (`idle/active/…`) per ux-spec D1.
 */
export function BuiltInLifecycleChip({
  status,
  compact = false,
  className,
}: {
  status: BuiltInAgentStatus;
  compact?: boolean;
  className?: string;
}) {
  const { t } = useTranslation();
  if (status !== "needs_setup" && status !== "pending_approval") return null;
  const isPendingApproval = status === "pending_approval";
  return (
    <Badge
      variant="outline"
      className={cn(
        brandChipBadge.amber,
        compact && "px-1.5 py-0 text-(length:--text-nano)",
        className,
      )}
      title={
        isPendingApproval
          ? t("waveFix.agents.builtIn.pendingApprovalTitle")
          : t("waveFix.agents.builtIn.needsSetupTitle")
      }
    >
      {isPendingApproval
        ? (compact ? t("work.approvals.fallback") : t("core.joinRequests.pendingApproval"))
        : compact
          ? t("waveFix.agents.builtIn.setup")
          : t("waveFix.agents.builtIn.needsSetup")}
    </Badge>
  );
}
