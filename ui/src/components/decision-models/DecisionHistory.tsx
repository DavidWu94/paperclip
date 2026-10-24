import { useQuery } from "@tanstack/react-query";
import type { DecisionHistoryEntry } from "@paperclipai/shared";
import { decisionModelsApi } from "@/api/decision-models";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/i18n";
import { Link } from "@/lib/router";
import { formatDateTime, formatTokens, formatDetailedCents } from "@/lib/utils";

type HistoryRow = DecisionHistoryEntry & { publicationStatus?: string; connectionName?: string | null };

const statusKeys: Record<string, string> = {
  succeeded: "waveFix.costsHistory.status.succeeded",
  running: "waveFix.costsHistory.status.running",
  unknown: "waveFix.costsHistory.status.unresolved",
  skipped: "waveFix.costsHistory.status.skipped",
  pending: "waveFix.costsHistory.status.pending",
};

export function DecisionHistoryTable({
  entries,
  fastResponse = false,
  fastResponsesEnabled = true,
}: {
  entries: HistoryRow[];
  fastResponse?: boolean;
  fastResponsesEnabled?: boolean;
}) {
  const { t } = useTranslation();
  if (!entries.length) {
    const action = fastResponse
      ? fastResponsesEnabled
        ? t("waveFix.costsHistory.configureFastResponse")
        : t("waveFix.costsHistory.enableExperimentalFastResponses")
      : t("waveFix.costsHistory.configureDecisionModel");
    return (
      <p className="text-sm text-muted-foreground">
        {fastResponse ? t("waveFix.costsHistory.emptyFastResponses") : t("waveFix.costsHistory.emptyDecisions")}{" "}
        <Link
          to={fastResponse && !fastResponsesEnabled ? "/company/settings/instance/experimental" : "/company/settings/connections"}
          className="underline underline-offset-4"
        >
          {action}
        </Link>{" "}
        {t("waveFix.costsHistory.toRunATest")}
      </p>
    );
  }

  const headers: Array<{ key: string; label: string }> = [
    { key: "whenFeature", label: t("waveFix.costsHistory.headers.whenFeature") },
    { key: "responsible", label: t("waveFix.costsHistory.headers.responsible") },
    { key: "task", label: t("waveFix.costsHistory.headers.task") },
    ...(fastResponse ? [{ key: "connection", label: t("waveFix.costsHistory.headers.connection") }] : []),
    { key: "model", label: t("waveFix.costsHistory.headers.model") },
    { key: "status", label: t("waveFix.costsHistory.headers.status") },
    { key: "duration", label: t("waveFix.costsHistory.headers.duration") },
    { key: "tokens", label: t("waveFix.costsHistory.headers.tokensInOut") },
    { key: "cost", label: t("waveFix.costsHistory.headers.cost") },
  ];

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">{t("waveFix.costsHistory.recentRequests")}</p>
      <div className="overflow-x-auto">
        <table className="w-full text-sm" aria-label={fastResponse ? t("waveFix.costsHistory.ariaFastResponses") : t("waveFix.costsHistory.ariaDecisions")}>
          <thead>
            <tr className="border-b border-border text-muted-foreground">
              {headers.map((header) => (
                <th key={header.key} className="px-3 py-2 text-left font-medium">{header.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {entries.map((row) => (
              <tr key={row.id} className="border-b border-border last:border-0">
                <td className="px-3 py-3">
                  <div className="whitespace-nowrap">{formatDateTime(row.startedAt)}</div>
                  <div className="text-xs text-muted-foreground">{row.feature === "settings.test" ? t("waveFix.costsHistory.setupTest") : row.feature}</div>
                </td>
                <td className="px-3 py-3">
                  {row.actorType === "system"
                    ? t("waveFix.costsHistory.paperclipServices")
                    : row.userName ?? (row.responsibleUserId === "local-board" ? t("waveFix.costsHistory.board") : t("waveFix.costsHistory.formerUser"))}
                </td>
                <td className="px-3 py-3">
                  {row.issueId ? (
                    <Link className="underline underline-offset-4" to={`/issues/${row.issueIdentifier ?? row.issueId}`}>
                      {row.issueIdentifier ?? t("waveFix.costsHistory.viewTask")}
                    </Link>
                  ) : "—"}
                </td>
                {fastResponse && (
                  <td className="px-3 py-3">{row.connectionName ?? (row.connectionId ? t("waveFix.costsHistory.removedConnection") : "—")}</td>
                )}
                <td className="px-3 py-3 font-mono text-xs">{row.model}</td>
                <td className="px-3 py-3">
                  <div>{t(statusKeys[row.status] ?? "waveFix.costsHistory.status.failed")}</div>
                  {row.publicationStatus && <div className="text-xs text-muted-foreground">{row.publicationStatus}</div>}
                  {row.errorCode && <div className="text-xs text-muted-foreground">{row.errorCode.replaceAll("_", " ")}</div>}
                </td>
                <td className="px-3 py-3 font-mono">{row.durationMs === null ? "—" : `${(row.durationMs / 1000).toFixed(1)}s`}</td>
                <td className="whitespace-nowrap px-3 py-3 font-mono">
                  {row.inputTokens === null ? "—" : formatTokens(row.inputTokens)} / {row.outputTokens === null ? "—" : formatTokens(row.outputTokens)}
                </td>
                <td className="px-3 py-3 font-mono">
                  <div>{row.costCents === null ? t("waveFix.costsHistory.unknown") : formatDetailedCents(row.costCents)}</div>
                  {row.costStatus !== "unpriced" && row.costStatus && (
                    <span className="text-xs text-muted-foreground">
                      {row.costStatus === "estimated" ? t("waveFix.costsHistory.estimated") : t("waveFix.costsHistory.reported")}
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function DecisionHistory({
  companyId,
  from,
  to,
}: {
  companyId: string;
  from?: string | null;
  to?: string | null;
}) {
  const { t } = useTranslation();
  const query = useQuery({
    queryKey: ["decision-history", companyId, from, to],
    queryFn: () => decisionModelsApi.history(companyId, from, to),
    refetchInterval: (q) => (q.state.data?.some((row) => row.status === "running") ? 5000 : false),
  });
  if (query.isPending) return <p className="text-sm text-muted-foreground">{t("waveFix.costsHistory.loadingDecisions")}</p>;
  if (query.error) {
    return (
      <div role="alert" className="space-y-2">
        <p className="text-sm text-destructive">{t("waveFix.costsHistory.loadFailedDecisions")}</p>
        <Button variant="outline" onClick={() => void query.refetch()}>{t("waveFix.costsHistory.tryAgain")}</Button>
      </div>
    );
  }
  return <DecisionHistoryTable entries={query.data ?? []} />;
}
