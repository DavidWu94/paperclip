import { Clock3 } from "lucide-react";
import type { CaseDetail, CaseHandoffView } from "@/api/cases";
import { AgentIdentity } from "@/components/AgentIdentity";
import type { AvatarAgent } from "@/components/AgentAvatar";
import { IssueReferencePill } from "@/components/IssueReferencePill";
import { IssueStatusBadge } from "@/components/StatusBadge";
import { PropertyRow } from "@/components/issue-properties/primitives";
import { useTranslation } from "@/i18n";

export type CaseAgentMap = ReadonlyMap<string, AvatarAgent & { status?: string }>;

export function CaseWorkSummary({ caseData, pendingHandoff, agents }: {
  caseData: CaseDetail;
  pendingHandoff?: CaseHandoffView | null;
  agents?: CaseAgentMap;
}) {
  const { t } = useTranslation();
  const task = caseData.workIssue;
  const pending = pendingHandoff === undefined ? caseData.pendingHandoff : pendingHandoff;
  const previousAgent = t("waveFix.cases.previousAgent");
  const receivingAgent = t("waveFix.cases.receivingAgent");
  const assignee = task?.assigneeAgentId ? agents?.get(task.assigneeAgentId) ?? {
    id: task.assigneeAgentId,
    name: task.assigneeAgentName ?? t("shell.agent.fallbackName"),
  } : null;
  const from = pending?.fromAgentId ? agents?.get(pending.fromAgentId)?.name ?? pending.fromAgentName ?? previousAgent : previousAgent;
  const to = pending ? (pending.toAgentId ? agents?.get(pending.toAgentId)?.name : null) ?? pending.toAgentName ?? receivingAgent : null;
  const destination = pending?.toAgentId ? agents?.get(pending.toAgentId) : null;
  const waiting = pending?.destinationKind === "done" ? t("waveFix.cases.closeWhenComplete") : pending?.lastError
    ?? (pending?.state === "awaiting_release" ? t("waveFix.cases.waitingForFinish", { name: from })
      : destination?.status === "paused" ? t("waveFix.cases.namePaused", { name: to ?? receivingAgent }) : t("waveFix.cases.waitingForStart", { name: to ?? receivingAgent }));

  return <section className="space-y-3" aria-label={t("waveFix.cases.caseWork")}>
    <h2 className="text-sm font-semibold">{t("shell.sidebar.work")}</h2>
    {caseData.workIssueId ? <div className="space-y-3">
      {task ? <div>
        <PropertyRow label={t("work.audit.entities.task")}><IssueReferencePill issue={task} className="min-h-11 md:min-h-0" /></PropertyRow>
        <PropertyRow label={t("waveFix.cases.workflow")}><span className="text-sm">{caseData.workflow?.name ?? t("waveFix.cases.caseInstructions")}</span></PropertyRow>
        {caseData.phase && <PropertyRow label={t("waveFix.cases.phase")}><span className="text-sm">{caseData.phase}</span></PropertyRow>}
        <PropertyRow label={t("work.common.agent")}>{assignee ? <AgentIdentity agent={assignee} size="xs" /> : <span className="text-sm text-muted-foreground">{t("waveFix.cases.unassigned")}</span>}</PropertyRow>
        <PropertyRow label={t("waveFix.cases.taskStatus")}><IssueStatusBadge status={task.status} /></PropertyRow>
      </div> : <p className="text-sm text-muted-foreground">{t("waveFix.cases.primaryTaskUnavailable")}</p>}
      {pending && pending.state !== "delivered" && pending.state !== "completed" && pending.state !== "cancelled" && <div className="flex items-start gap-2 text-sm">
        <Clock3 aria-hidden className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
        <div className="min-w-0 space-y-1">
          {pending.state === "awaiting_release" && <p>{t("waveFix.cases.nextStep", { name: pending.workflowTransition?.to.name ?? t("waveFix.cases.caseInstructions"), phase: pending.phase })}</p>}
          <p className="text-xs leading-relaxed text-muted-foreground">{waiting}</p>
        </div>
      </div>}
    </div> : <p className="text-sm text-muted-foreground">{t("waveFix.cases.noTaskLinked")}</p>}
  </section>;
}
