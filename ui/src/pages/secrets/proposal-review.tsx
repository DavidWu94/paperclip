import { useCallback, useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Copy, Fingerprint, KeyRound, Link2, ShieldAlert, Variable, ServerCog } from "lucide-react";
import type {
  CompanySecretProviderConfig,
  SecretProposalAgentRef,
  SecretProposalView,
} from "@paperclipai/shared";
import { AgentIcon } from "@/components/AgentIconPicker";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useToastActions } from "../../context/ToastContext";
import { secretsApi } from "../../api/secrets";
import { ApiError } from "../../api/client";
import { queryKeys } from "../../lib/queryKeys";
import {
  aliasFromConfigPath,
  deliveryModeForConfigPath,
} from "../../lib/secret-delivery";
import { cn } from "../../lib/utils";
import { copyTextToClipboard } from "../../lib/clipboard";
import { SecretPathName } from "./SecretPathName";
import { i18n, useTranslation } from "@/i18n";
import skillsExtraEn from "@/i18n/partials/skills.en.json";
import skillsExtraZhTW from "@/i18n/partials/skills.zh-TW.json";

i18n.addResourceBundle("en", "translation", skillsExtraEn, true, false);
i18n.addResourceBundle("zh-TW", "translation", skillsExtraZhTW, true, false);

/* -------------------------------------------------------------------------- */
/* Presentation helpers (shared by the tab + agent-settings surfaces)         */
/* -------------------------------------------------------------------------- */

/** Short, non-reversible fingerprint label. Never renders the value. */
export function fingerprintLabel(fingerprint: string | null, length: number | null): string {
  const digest = fingerprint ? `sha256:${fingerprint.slice(0, 10)}…` : "no fingerprint";
  const size = typeof length === "number" ? `${length} ${length === 1 ? "byte" : "bytes"}` : null;
  return size ? `${digest} · ${size}` : digest;
}

/**
 * Fingerprint + length label. When a full digest is present the truncated form
 * is click-to-copy so an approver can verify a rotation against a known SHA-256
 * (10 hex chars isn't enough entropy to compare on sight). Never the value.
 */
export function FingerprintChip({
  fingerprint,
  length,
  className,
}: {
  fingerprint: string | null;
  length: number | null;
  className?: string;
}) {
  const { t } = useTranslation();
  const { pushToast } = useToastActions();
  const digest = fingerprint ? `sha256:${fingerprint.slice(0, 10)}…` : t("skillsExtra.proposals.noFingerprint");
  const size =
    typeof length === "number"
      ? t(length === 1 ? "skillsExtra.proposals.byteOne" : "skillsExtra.proposals.byteOther", { count: length })
      : null;
  const label = size ? `${digest} · ${size}` : digest;
  if (!fingerprint) {
    return (
      <span className={cn("inline-flex items-center gap-1 font-mono", className)}>
        <Fingerprint className="size-3 shrink-0" />
        {label}
      </span>
    );
  }
  const full = `sha256:${fingerprint}`;
  return (
    <button
      type="button"
      onClick={() => {
        copyTextToClipboard(full)
          .then(() => pushToast({ title: t("skillsExtra.proposals.fingerprintCopied"), tone: "success" }))
          .catch(() => pushToast({ title: t("skillsExtra.proposals.fingerprintCopyFailed"), tone: "error" }));
      }}
      title={t("skillsExtra.proposals.copyDigest", { digest: full })}
      className={cn(
        "inline-flex items-center gap-1 font-mono hover:text-foreground",
        className,
      )}
    >
      <Fingerprint className="size-3 shrink-0" />
      {label}
      <Copy className="size-3 shrink-0 opacity-60" />
    </button>
  );
}

/**
 * An agent-authored justification, framed as an *untrusted claim* rather than
 * trusted UI copy. The muted "Reason given by the agent" caption primes the
 * approver to read it skeptically — the Q0 social-engineering concern: an agent
 * can write "Pre-approved by the CEO" and otherwise inherit the interface's
 * credibility.
 */
export function ProposalJustification({
  justification,
  className,
}: {
  justification: string;
  className?: string;
}) {
  const { t } = useTranslation();
  return (
    <div className={cn("space-y-0.5", className)}>
      <p className="text-(length:--text-micro) text-muted-foreground">{t("skillsExtra.proposals.reasonCaption")}</p>
      <p className="whitespace-pre-wrap break-words text-xs text-foreground/80">
        “{justification}”
      </p>
    </div>
  );
}

/** Compact agent chip: icon + name. */
export function AgentRefChip({
  agent,
  className,
}: {
  agent: SecretProposalAgentRef;
  className?: string;
}) {
  return (
    <span className={cn("inline-flex min-w-0 items-center gap-1", className)}>
      <AgentIcon icon={agent.icon ?? null} className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
      <span className="min-w-0 truncate">{agent.name}</span>
    </span>
  );
}

/** Env-var vs API-access delivery badge for a binding `configPath`. */
export function DeliveryBadge({ configPath }: { configPath: string | null }) {
  const { t } = useTranslation();
  const mode = deliveryModeForConfigPath(configPath);
  const isEnv = mode === "env";
  const isApi = mode === "api";
  return (
    <Badge
      variant="outline"
      className={cn(
        "h-5 gap-1 px-1.5 text-(length:--text-nano) font-normal",
        isEnv && "border-sky-500/30 bg-sky-500/10 text-sky-700 dark:text-sky-300",
        isApi && "border-violet-500/30 bg-violet-500/10 text-violet-700 dark:text-violet-300",
        !isEnv && !isApi && "border-border bg-muted/40 text-muted-foreground",
      )}
    >
      {isEnv ? <Variable className="size-3" /> : isApi ? <ServerCog className="size-3" /> : null}
      {mode === "env"
        ? t("skillsExtra.proposals.deliveryEnv")
        : mode === "api"
          ? t("skillsExtra.proposals.deliveryApi")
          : t("skillsExtra.proposals.deliveryConfig")}
    </Badge>
  );
}

/** Distinct "Proposed" pill used wherever a proposal is inlined among live rows. */
export function ProposedBadge({ className }: { className?: string }) {
  const { t } = useTranslation();
  return (
    <Badge
      variant="outline"
      className={cn(
        "h-5 gap-1 px-1.5 text-(length:--text-nano) font-medium",
        "border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300",
        className,
      )}
    >
      <ShieldAlert className="size-3" /> {t("skillsExtra.proposals.proposed")}
    </Badge>
  );
}

/** The env KEY / access ALIAS a binding proposal delivers under, e.g. `GITHUB_TOKEN`. */
export function bindingEnvKey(proposal: SecretProposalView): string {
  return aliasFromConfigPath(proposal.configPath);
}

/** Human label for the secret a binding proposal references (live or cascade). */
export function bindingSecretLabel(proposal: SecretProposalView): {
  name: string;
  pending: boolean;
} {
  if (proposal.secretProposalId) {
    return { name: proposal.secretProposalName ?? "proposed secret", pending: true };
  }
  return { name: proposal.secretName ?? "secret", pending: false };
}

function readableError(error: unknown, requestFailed: string, fallback: string): string {
  if (error instanceof ApiError) return error.message || requestFailed;
  if (error instanceof Error) return error.message;
  return fallback;
}

/* -------------------------------------------------------------------------- */
/* Review hook: approve/reject dialogs + mutations, shared across surfaces    */
/* -------------------------------------------------------------------------- */

interface ApproveDraft {
  proposal: SecretProposalView;
  // secret-kind editable fields (re-folder / rename before landing)
  folder: string;
  leaf: string;
  description: string;
  providerConfigId: string;
  // binding-kind: approve the pending dependency secret in the same transaction
  cascade: boolean;
}

export interface UseProposalReview {
  /** Open the approve confirm dialog for a proposal. */
  requestApprove: (proposal: SecretProposalView) => void;
  /** Open the reject (reason required) dialog for a proposal. */
  requestReject: (proposal: SecretProposalView) => void;
  /** True while an approve/reject request is in flight. */
  isBusy: boolean;
  /** Render once inside the surface — hosts both dialogs. */
  dialogs: React.ReactNode;
}

/**
 * Shared approve/reject workflow for secret & binding proposals. Both the
 * board Proposals tab and the agent-settings "Proposed" rows use this so the
 * confirm/reject affordances behave identically everywhere.
 */
export function useProposalReview(
  companyId: string | null,
  providerConfigs: CompanySecretProviderConfig[] = [],
): UseProposalReview {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { pushToast } = useToastActions();

  const [approveDraft, setApproveDraft] = useState<ApproveDraft | null>(null);
  const [rejectTarget, setRejectTarget] = useState<SecretProposalView | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [error, setError] = useState<string | null>(null);

  const invalidate = useCallback(() => {
    if (!companyId) return;
    queryClient.invalidateQueries({ queryKey: ["secret-proposals", companyId] });
    queryClient.invalidateQueries({ queryKey: queryKeys.secrets.list(companyId) });
  }, [companyId, queryClient]);

  const approveMutation = useMutation({
    mutationFn: (draft: ApproveDraft) => {
      const { proposal } = draft;
      if (proposal.kind === "secret") {
        const name = draft.folder.trim()
          ? `${draft.folder.trim().replace(/\/+$/, "")}/${draft.leaf.trim()}`
          : draft.leaf.trim();
        return secretsApi.approveProposal(companyId!, proposal.id, {
          overrides: {
            name,
            description: draft.description.trim() || null,
            providerConfigId: draft.providerConfigId || null,
          },
        });
      }
      return secretsApi.approveProposal(companyId!, proposal.id, {
        cascade: draft.cascade || undefined,
      });
    },
    onSuccess: (result) => {
      pushToast({
        title: result.kind === "secret" ? t("skillsExtra.proposals.secretApproved") : t("skillsExtra.proposals.bindingApproved"),
        body:
          result.kind === "secret"
            ? (result.proposedName ?? t("skillsExtra.proposals.secretCreated"))
            : `${result.target?.name ?? t("skillsExtra.proposals.agent")} · ${bindingEnvKey(result) || t("skillsExtra.proposals.binding")}`,
        tone: "success",
      });
      setApproveDraft(null);
      setError(null);
      invalidate();
    },
    onError: (err) =>
      setError(
        readableError(
          err,
          t("skillsExtra.common.requestFailed", { status: err instanceof ApiError ? err.status : "" }),
          t("skillsExtra.common.somethingWrongRetry"),
        ),
      ),
  });

  const rejectMutation = useMutation({
    mutationFn: ({ proposal, reason }: { proposal: SecretProposalView; reason: string }) =>
      secretsApi.rejectProposal(companyId!, proposal.id, { reason: reason.trim() }),
    onSuccess: (result) => {
      pushToast({
        title: t("skillsExtra.proposals.proposalRejected"),
        body: result.kind === "secret" ? (result.proposedName ?? undefined) : undefined,
        tone: "info",
      });
      setRejectTarget(null);
      setRejectReason("");
      setError(null);
      invalidate();
    },
    onError: (err) =>
      setError(
        readableError(
          err,
          t("skillsExtra.common.requestFailed", { status: err instanceof ApiError ? err.status : "" }),
          t("skillsExtra.common.somethingWrongRetry"),
        ),
      ),
  });

  const requestApprove = useCallback(
    (proposal: SecretProposalView) => {
      setError(null);
      const segments = (proposal.proposedName ?? "").split("/");
      const leaf = segments.pop() ?? "";
      setApproveDraft({
        proposal,
        folder: segments.join("/"),
        leaf,
        description: proposal.proposedDescription ?? "",
        // "" = deployment default vault; the dialog dropdown lets the approver pick one.
        providerConfigId:
          providerConfigs.find(
            (config) => config.provider === "local_encrypted" && config.isDefault,
          )?.id ?? "",
        // A binding on a still-pending secret proposal REQUIRES cascade to land.
        cascade: Boolean(proposal.secretProposalId),
      });
    },
    [providerConfigs],
  );

  const requestReject = useCallback((proposal: SecretProposalView) => {
    setError(null);
    setRejectReason("");
    setRejectTarget(proposal);
  }, []);

  const dialogs = (
    <>
      <ApproveDialog
        draft={approveDraft}
        error={error}
        pending={approveMutation.isPending}
        providerConfigs={providerConfigs}
        onChange={setApproveDraft}
        onCancel={() => {
          setApproveDraft(null);
          setError(null);
        }}
        onConfirm={() => approveDraft && approveMutation.mutate(approveDraft)}
      />
      <RejectDialog
        proposal={rejectTarget}
        reason={rejectReason}
        error={error}
        pending={rejectMutation.isPending}
        onReasonChange={setRejectReason}
        onCancel={() => {
          setRejectTarget(null);
          setRejectReason("");
          setError(null);
        }}
        onConfirm={() =>
          rejectTarget && rejectMutation.mutate({ proposal: rejectTarget, reason: rejectReason })
        }
      />
    </>
  );

  return {
    requestApprove,
    requestReject,
    isBusy: approveMutation.isPending || rejectMutation.isPending,
    dialogs,
  };
}

/* -------------------------------------------------------------------------- */
/* Approve dialog                                                             */
/* -------------------------------------------------------------------------- */

function ApproveDialog({
  draft,
  error,
  pending,
  providerConfigs,
  onChange,
  onCancel,
  onConfirm,
}: {
  draft: ApproveDraft | null;
  error: string | null;
  pending: boolean;
  providerConfigs: CompanySecretProviderConfig[];
  onChange: (next: ApproveDraft) => void;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const { t } = useTranslation();
  const isSecret = draft?.proposal.kind === "secret";
  const previewName = draft
    ? draft.folder.trim()
      ? `${draft.folder.trim().replace(/\/+$/, "")}/${draft.leaf.trim()}`
      : draft.leaf.trim()
    : "";
  const localConfigs = providerConfigs.filter((config) => config.provider === "local_encrypted");
  const canConfirm = isSecret ? Boolean(draft && draft.leaf.trim()) : true;

  return (
    <Dialog open={Boolean(draft)} onOpenChange={(open) => !open && onCancel()}>
      <DialogContent className="sm:max-w-lg">
        {draft ? (
          <>
            <DialogHeader>
              <DialogTitle>
                {isSecret ? t("skillsExtra.proposals.approveCreateTitle") : t("skillsExtra.proposals.approveBindingTitle")}
              </DialogTitle>
              <DialogDescription>
                {isSecret
                  ? t("skillsExtra.proposals.approveCreateBody")
                  : t("skillsExtra.proposals.approveBindingBody")}
              </DialogDescription>
            </DialogHeader>

            {/* Provenance recap — keeps the social-engineering surface visible. */}
            <div className="space-y-1.5 rounded-md border border-border bg-muted/30 p-2.5 text-xs">
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <span>{t("skillsExtra.proposals.proposedBy")}</span>
                <AgentRefChip agent={draft.proposal.proposedBy} className="font-medium text-foreground" />
              </div>
              <ProposalJustification justification={draft.proposal.justification} />
            </div>

            {isSecret ? (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label htmlFor="approve-folder">{t("skillsExtra.proposals.folder")}</Label>
                    <Input
                      id="approve-folder"
                      value={draft.folder}
                      onChange={(event) => onChange({ ...draft, folder: event.target.value })}
                      placeholder={t("skillsExtra.proposals.folderPlaceholder")}
                      className="font-mono text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="approve-name">{t("skillsExtra.common.name")}</Label>
                    <Input
                      id="approve-name"
                      value={draft.leaf}
                      onChange={(event) => onChange({ ...draft, leaf: event.target.value })}
                      placeholder={t("skillsExtra.proposals.namePlaceholder")}
                      autoFocus
                      aria-invalid={!draft.leaf.trim()}
                      className="font-mono text-xs"
                    />
                  </div>
                </div>
                <p className="text-(length:--text-micro) text-muted-foreground">
                  {t("skillsExtra.proposals.landsAs")}{" "}
                  {previewName ? (
                    <SecretPathName name={previewName} className="font-mono" />
                  ) : (
                    <span className="italic">{t("skillsExtra.proposals.enterName")}</span>
                  )}
                </p>

                <div className="space-y-1">
                  <Label htmlFor="approve-description">{t("skillsExtra.common.description")}</Label>
                  <Input
                    id="approve-description"
                    value={draft.description}
                    onChange={(event) => onChange({ ...draft, description: event.target.value })}
                    placeholder={t("skillsExtra.proposals.optionalPlaceholder")}
                  />
                </div>

                {localConfigs.length > 0 ? (
                  <div className="space-y-1">
                    <Label htmlFor="approve-provider-config">{t("skillsExtra.proposals.providerVault")}</Label>
                    <select
                      id="approve-provider-config"
                      value={draft.providerConfigId}
                      onChange={(event) =>
                        onChange({ ...draft, providerConfigId: event.target.value })
                      }
                      className="h-9 w-full rounded-md border border-input bg-transparent px-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                    >
                      <option value="">{t("skillsExtra.proposals.deploymentDefault")}</option>
                      {localConfigs.map((config) => (
                        <option key={config.id} value={config.id}>
                          {config.displayName}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : null}

                <div className="rounded-md border border-border bg-background px-2.5 py-1.5 text-xs text-muted-foreground">
                  <FingerprintChip
                    fingerprint={draft.proposal.valueFingerprintSha256}
                    length={draft.proposal.valueLength}
                  />
                </div>
              </div>
            ) : (
              <BindingApproveBody draft={draft} onChange={onChange} />
            )}

            {error ? (
              <p className="text-xs text-destructive" role="alert">
                {error}
              </p>
            ) : null}

            <DialogFooter>
              <Button variant="ghost" onClick={onCancel} disabled={pending}>
                {t("skillsExtra.common.cancel")}
              </Button>
              <Button onClick={onConfirm} disabled={pending || !canConfirm}>
                {pending
                  ? t("skillsExtra.proposals.approving")
                  : isSecret
                    ? t("skillsExtra.proposals.approveAndCreate")
                    : draft.cascade
                      ? t("skillsExtra.proposals.approveSecretAndBind")
                      : t("skillsExtra.proposals.approveBinding")}
              </Button>
            </DialogFooter>
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

function BindingApproveBody({
  draft,
  onChange,
}: {
  draft: ApproveDraft;
  onChange: (next: ApproveDraft) => void;
}) {
  const { t } = useTranslation();
  const { proposal } = draft;
  const secret = bindingSecretLabel(proposal);
  const envKey = bindingEnvKey(proposal);
  return (
    <div className="space-y-3 text-sm">
      <div className="space-y-2 rounded-md border border-border p-3">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs text-muted-foreground">{t("skillsExtra.proposals.targetAgent")}</span>
          {proposal.target ? (
            <AgentRefChip agent={proposal.target} className="text-sm font-medium" />
          ) : (
            <span className="text-muted-foreground">—</span>
          )}
        </div>
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs text-muted-foreground">{t("skillsExtra.proposals.deliveredAs")}</span>
          <span className="flex items-center gap-1.5">
            <DeliveryBadge configPath={proposal.configPath} />
            <code className="font-mono text-xs">{envKey || proposal.configPath}</code>
          </span>
        </div>
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs text-muted-foreground">{t("skillsExtra.proposals.secret")}</span>
          <span className="flex items-center gap-1.5">
            <KeyRound className="size-3.5 text-muted-foreground" />
            <span className="font-medium">{secret.name}</span>
            {secret.pending ? <ProposedBadge /> : null}
          </span>
        </div>
      </div>

      {/* Cascade pairing: the secret is itself still a pending proposal. */}
      {proposal.secretProposalId ? (
        <label className="flex items-start gap-2 rounded-md border border-amber-500/30 bg-amber-500/5 p-2.5 text-xs">
          <Checkbox
            checked={draft.cascade}
            onCheckedChange={(checked) => onChange({ ...draft, cascade: checked === true })}
            className="mt-0.5"
            aria-label={t("skillsExtra.proposals.alsoApprove")}
          />
          <span className="text-foreground/90">
            {t("skillsExtra.proposals.cascadeBody", { name: secret.name })}
          </span>
        </label>
      ) : null}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Reject dialog                                                              */
/* -------------------------------------------------------------------------- */

function RejectDialog({
  proposal,
  reason,
  error,
  pending,
  onReasonChange,
  onCancel,
  onConfirm,
}: {
  proposal: SecretProposalView | null;
  reason: string;
  error: string | null;
  pending: boolean;
  onReasonChange: (value: string) => void;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const { t } = useTranslation();
  const canConfirm = reason.trim().length > 0;
  return (
    <Dialog open={Boolean(proposal)} onOpenChange={(open) => !open && onCancel()}>
      <DialogContent className="sm:max-w-md">
        {proposal ? (
          <>
            <DialogHeader>
              <DialogTitle>{t("skillsExtra.proposals.rejectTitle")}</DialogTitle>
              <DialogDescription>
                {t("skillsExtra.proposals.rejectBody")}{" "}
                <AgentRefChip agent={proposal.proposedBy} className="text-foreground" />
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-1">
              <Label htmlFor="reject-reason">{t("skillsExtra.proposals.reason")}</Label>
              <Textarea
                id="reject-reason"
                value={reason}
                onChange={(event) => onReasonChange(event.target.value)}
                rows={3}
                autoFocus
                placeholder={t("skillsExtra.proposals.reasonPlaceholder")}
              />
            </div>
            {error ? (
              <p className="text-xs text-destructive" role="alert">
                {error}
              </p>
            ) : null}
            <DialogFooter>
              <Button variant="ghost" onClick={onCancel} disabled={pending}>
                {t("skillsExtra.common.cancel")}
              </Button>
              <Button variant="destructive" onClick={onConfirm} disabled={pending || !canConfirm}>
                {pending ? t("skillsExtra.proposals.rejecting") : t("skillsExtra.proposals.reject")}
              </Button>
            </DialogFooter>
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

/* -------------------------------------------------------------------------- */
/* Shared approve/reject action buttons (with permission preflight)           */
/* -------------------------------------------------------------------------- */

export function ProposalActions({
  proposal,
  onApprove,
  onReject,
  disabled,
  size = "sm",
}: {
  proposal: SecretProposalView;
  onApprove: (proposal: SecretProposalView) => void;
  onReject: (proposal: SecretProposalView) => void;
  disabled?: boolean;
  size?: "sm" | "xs";
}) {
  const { t } = useTranslation();
  const blocked = !proposal.viewerCanApprove;
  const heightClass = size === "xs" ? "h-7 px-2 text-xs" : "";
  const approveButton = (
    <Button
      size="sm"
      className={heightClass}
      disabled={disabled || blocked}
      onClick={() => onApprove(proposal)}
    >
      {t("skillsExtra.proposals.approve")}
    </Button>
  );
  return (
    <div className="flex items-center gap-1.5">
      {blocked ? (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <span tabIndex={0}>{approveButton}</span>
            </TooltipTrigger>
            <TooltipContent className="max-w-72">
              {proposal.approveBlockReason ?? t("skillsExtra.proposals.approveBlocked")}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      ) : (
        approveButton
      )}
      <Button
        size="sm"
        variant="outline"
        className={heightClass}
        disabled={disabled}
        onClick={() => onReject(proposal)}
      >
        {t("skillsExtra.proposals.reject")}
      </Button>
    </div>
  );
}
