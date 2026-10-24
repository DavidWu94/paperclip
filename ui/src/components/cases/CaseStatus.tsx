import type { CaseStatus as CaseStatusValue } from "@/api/cases";
import { StatusBadge } from "@/components/StatusBadge";
import { useTranslation } from "@/i18n";

export const CASE_STATUS_LABELS: Record<CaseStatusValue, string> = {
  draft: "Draft",
  in_progress: "In progress",
  in_review: "In review",
  approved: "Approved",
  done: "Done",
  cancelled: "Cancelled",
};

export function CaseStatus({ status, className }: { status: CaseStatusValue; className?: string }) {
  const { t } = useTranslation();
  return <StatusBadge status={status} label={t(`work.cases.status.${status}`)} className={className} />;
}
