import { ChangeEvent, useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  type InteractionResolverGovernance,
  type IssueThreadInteractionKind,
} from "@paperclipai/shared";
import { useCompany } from "../context/CompanyContext";
import { useBreadcrumbs } from "../context/BreadcrumbContext";
import { useCloudInstance } from "../hooks/useCloudInstance";
import { companiesApi } from "../api/companies";
import { assetsApi } from "../api/assets";
import { queryKeys } from "../lib/queryKeys";
import { Button } from "@/components/ui/button";
import { SlidersHorizontal } from "lucide-react";
import {
  InteractionGovernancePanel,
  applyGovernanceChange,
  type GovernanceField,
  type GovernanceSelectValue,
} from "../components/InteractionGovernancePanel";
import { CompanyPatternIcon } from "../components/CompanyPatternIcon";
import {
  Field,
  ToggleField,
} from "../components/agent-config-primitives";
import { InstanceGeneralSettings } from "./InstanceGeneralSettings";
import { setLanguage, useTranslation } from "@/i18n";
import { supportedLocales } from "@/i18n/locales";
import { localeEndonym } from "@/i18n/locale-labels";

export function CompanySettings() {
  const { t, i18n } = useTranslation();
  const {
    companies,
    selectedCompany,
    selectedCompanyId,
    setSelectedCompanyId
  } = useCompany();
  const { setBreadcrumbs } = useBreadcrumbs();
  const queryClient = useQueryClient();
  // Managed instances derive the task ID prefix from the company name, so a
  // rename here also renumbers the existing task IDs.
  const isCloudManaged = Boolean(useCloudInstance());
  // General settings local state
  const [companyName, setCompanyName] = useState("");
  const [description, setDescription] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [logoUploadError, setLogoUploadError] = useState<string | null>(null);
  const [governance, setGovernance] = useState<InteractionResolverGovernance>({});

  // Sync local state from selected company
  useEffect(() => {
    if (!selectedCompany) return;
    setCompanyName(selectedCompany.name);
    setDescription(selectedCompany.description ?? "");
    setLogoUrl(selectedCompany.logoUrl ?? "");
    setGovernance(selectedCompany.interactionResolverGovernance ?? {});
  }, [selectedCompany]);

  const generalDirty =
    !!selectedCompany &&
    (companyName !== selectedCompany.name ||
      description !== (selectedCompany.description ?? ""));

  const generalMutation = useMutation({
    mutationFn: (data: {
      name: string;
      description: string | null;
    }) => companiesApi.update(selectedCompanyId!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.companies.all });
    }
  });

  const settingsMutation = useMutation({
    mutationFn: (requireApproval: boolean) =>
      companiesApi.update(selectedCompanyId!, {
        requireBoardApprovalForNewAgents: requireApproval
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.companies.all });
    }
  });

  const governanceMutation = useMutation({
    mutationFn: (next: InteractionResolverGovernance) =>
      companiesApi.update(selectedCompanyId!, { interactionResolverGovernance: next }),
    onSuccess: (company) => {
      setGovernance(company.interactionResolverGovernance ?? {});
      queryClient.invalidateQueries({ queryKey: queryKeys.companies.all });
    }
  });

  function handleGovernanceChange(
    kind: IssueThreadInteractionKind,
    field: GovernanceField,
    value: GovernanceSelectValue,
  ) {
    const next = applyGovernanceChange(governance, kind, field, value);
    setGovernance(next);
    governanceMutation.mutate(next);
  }

  const syncLogoState = (nextLogoUrl: string | null) => {
    setLogoUrl(nextLogoUrl ?? "");
    void queryClient.invalidateQueries({ queryKey: queryKeys.companies.all });
  };

  const logoUploadMutation = useMutation({
    mutationFn: (file: File) =>
      assetsApi
        .uploadCompanyLogo(selectedCompanyId!, file)
        .then((asset) => companiesApi.update(selectedCompanyId!, { logoAssetId: asset.assetId })),
    onSuccess: (company) => {
      syncLogoState(company.logoUrl);
      setLogoUploadError(null);
    }
  });

  const clearLogoMutation = useMutation({
    mutationFn: () => companiesApi.update(selectedCompanyId!, { logoAssetId: null }),
    onSuccess: (company) => {
      setLogoUploadError(null);
      syncLogoState(company.logoUrl);
    }
  });

  function handleLogoFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;
    event.currentTarget.value = "";
    if (!file) return;
    setLogoUploadError(null);
    logoUploadMutation.mutate(file);
  }

  function handleClearLogo() {
    clearLogoMutation.mutate();
  }

  const archiveMutation = useMutation({
    mutationFn: ({
      companyId,
      nextCompanyId
    }: {
      companyId: string;
      nextCompanyId: string | null;
    }) => companiesApi.archive(companyId).then(() => ({ nextCompanyId })),
    onSuccess: async ({ nextCompanyId }) => {
      if (nextCompanyId) {
        setSelectedCompanyId(nextCompanyId);
      }
      await queryClient.invalidateQueries({
        queryKey: queryKeys.companies.all
      });
      await queryClient.invalidateQueries({
        queryKey: queryKeys.companies.stats
      });
    }
  });

  useEffect(() => {
    setBreadcrumbs([
      { label: selectedCompany?.name ?? t("settings.breadcrumb.company"), href: "/dashboard" },
      { label: t("settings.breadcrumb.settings") }
    ]);
  }, [setBreadcrumbs, selectedCompany?.name, t]);

  if (!selectedCompany) {
    return (
      <div className="text-sm text-muted-foreground">
        {t("settings.empty.noOrganization")}
      </div>
    );
  }

  function handleSaveGeneral() {
    generalMutation.mutate({
      name: companyName.trim(),
      description: description.trim() || null
    });
  }

  return (
    <div className="max-w-6xl space-y-8">
      <div className="flex items-center gap-2">
        <SlidersHorizontal className="h-5 w-5 text-muted-foreground" />
        <h1 className="text-lg font-semibold">{t("settings.general.title")}</h1>
      </div>

      {/* General */}
      <div className="max-w-2xl space-y-4">
        <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          {t("settings.general.title")}
        </div>
        <div className="space-y-3">
          <Field label={t("settings.language.label")} hint={t("settings.language.hint")}>
            <select
              className="w-full rounded-md border border-border bg-transparent px-2.5 py-1.5 text-sm outline-none"
              value={supportedLocales.includes(i18n.resolvedLanguage ?? "") ? i18n.resolvedLanguage : "en"}
              onChange={(event) => setLanguage(event.target.value)}
            >
              {[...supportedLocales]
                .sort((left, right) => {
                  if (left === "zh-TW") return -1;
                  if (right === "zh-TW") return 1;
                  return localeEndonym(left).localeCompare(localeEndonym(right));
                })
                .map((code) => (
                  <option key={code} value={code}>
                    {localeEndonym(code)}
                  </option>
                ))}
            </select>
          </Field>
          <Field label={t("settings.general.organizationName")} hint={t("settings.general.organizationNameHint")}>
            <input
              className="w-full rounded-md border border-border bg-transparent px-2.5 py-1.5 text-sm outline-none"
              type="text"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
            />
            {isCloudManaged && (
              <p className="mt-1 text-xs text-muted-foreground">
                {t("settings.general.renameWarning")}
              </p>
            )}
          </Field>
          <Field
            label={t("settings.general.description")}
            hint={t("settings.general.descriptionHint")}
          >
            <input
              className="w-full rounded-md border border-border bg-transparent px-2.5 py-1.5 text-sm outline-none"
              type="text"
              value={description}
              placeholder={t("settings.general.descriptionPlaceholder")}
              onChange={(e) => setDescription(e.target.value)}
            />
          </Field>
        </div>
      </div>

      {/* Appearance */}
      <div className="max-w-2xl space-y-4">
        <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          {t("settings.appearance.title")}
        </div>
        <div className="space-y-3">
          <div className="flex items-start gap-4">
            <div className="shrink-0">
              <CompanyPatternIcon
                companyName={companyName || selectedCompany.name}
                logoUrl={logoUrl || null}
                className="rounded-(--rad-14)"
              />
            </div>
            <div className="flex-1 space-y-3">
              <Field
                label={t("settings.appearance.logo")}
                hint={t("settings.appearance.logoHint")}
              >
                <div className="space-y-2">
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml"
                    onChange={handleLogoFileChange}
                    className="w-full rounded-md border border-border bg-transparent px-2.5 py-1.5 text-sm outline-none file:mr-4 file:rounded-md file:border-0 file:bg-muted file:px-2.5 file:py-1 file:text-xs"
                  />
                  {logoUrl && (
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleClearLogo}
                        disabled={clearLogoMutation.isPending}
                      >
                        {clearLogoMutation.isPending ? t("settings.appearance.removing") : t("settings.appearance.removeLogo")}
                      </Button>
                    </div>
                  )}
                  {(logoUploadMutation.isError || logoUploadError) && (
                    <span className="text-xs text-destructive">
                      {logoUploadError ??
                        (logoUploadMutation.error instanceof Error
                          ? logoUploadMutation.error.message
                          : t("settings.appearance.uploadFailed"))}
                    </span>
                  )}
                  {clearLogoMutation.isError && (
                    <span className="text-xs text-destructive">
                      {clearLogoMutation.error.message}
                    </span>
                  )}
                  {logoUploadMutation.isPending && (
                    <span className="text-xs text-muted-foreground">{t("settings.appearance.uploading")}</span>
                  )}
                </div>
              </Field>
            </div>
          </div>
        </div>
      </div>

      {/* Save button for General + Appearance */}
      {generalDirty && (
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={handleSaveGeneral}
            disabled={generalMutation.isPending || !companyName.trim()}
          >
            {generalMutation.isPending ? t("settings.appearance.saving") : t("settings.appearance.save")}
          </Button>
          {generalMutation.isSuccess && (
            <span className="text-xs text-muted-foreground">{t("settings.appearance.saved")}</span>
          )}
          {generalMutation.isError && (
            <span className="text-xs text-destructive">
              {generalMutation.error instanceof Error
                  ? generalMutation.error.message
                  : t("settings.appearance.saveFailed")}
            </span>
          )}
        </div>
      )}

      {/* Hiring */}
      <div className="max-w-2xl space-y-4" data-testid="company-settings-team-section">
        <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          {t("settings.hiring.title")}
        </div>
        <div>
          <ToggleField
            label={t("settings.hiring.requireApproval")}
            hint={t("settings.hiring.requireApprovalHint")}
            checked={!!selectedCompany.requireBoardApprovalForNewAgents}
            onChange={(v) => settingsMutation.mutate(v)}
            toggleTestId="company-settings-team-approval-toggle"
          />
        </div>
      </div>

      {/* Interaction governance */}
      <InteractionGovernancePanel
        governance={governance}
        onChange={handleGovernanceChange}
        isPending={governanceMutation.isPending}
        errorMessage={
          governanceMutation.isError
            ? governanceMutation.error instanceof Error
              ? governanceMutation.error.message
              : t("settings.governance.saveFailed")
            : null
        }
      />

      <InstanceGeneralSettings embedded />

      {/* Danger Zone */}
      <div className="space-y-4">
        <div className="text-xs font-medium text-destructive uppercase tracking-wide">
          {t("settings.danger.title")}
        </div>
        <div className="space-y-3 bg-destructive/5 px-4 py-4">
          <p className="text-sm text-muted-foreground">
            {t("settings.danger.archiveBody")}
          </p>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="destructive"
              disabled={
                archiveMutation.isPending ||
                selectedCompany.status === "archived"
              }
              onClick={() => {
                if (!selectedCompanyId) return;
                const confirmed = window.confirm(
                  t("settings.danger.archiveConfirm", { name: selectedCompany.name })
                );
                if (!confirmed) return;
                const nextCompanyId =
                  companies.find(
                    (company) =>
                      company.id !== selectedCompanyId &&
                      company.status !== "archived"
                  )?.id ?? null;
                archiveMutation.mutate({
                  companyId: selectedCompanyId,
                  nextCompanyId
                });
              }}
            >
              {archiveMutation.isPending
                ? t("settings.danger.archiving")
                : selectedCompany.status === "archived"
                ? t("settings.danger.alreadyArchived")
                : t("settings.danger.archive")}
            </Button>
            {archiveMutation.isError && (
              <span className="text-xs text-destructive">
                {archiveMutation.error instanceof Error
                  ? archiveMutation.error.message
                  : t("settings.danger.archiveFailed")}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
