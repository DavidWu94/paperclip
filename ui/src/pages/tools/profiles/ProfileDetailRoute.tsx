import { useEffect } from "react";
import { useParams } from "@/lib/router";
import { useBreadcrumbs } from "@/context/BreadcrumbContext";
import { useCompany } from "@/context/CompanyContext";
import { advancedTabHref } from "../tool-tabs";
import { ToolsAdminGate } from "./ToolsAdminGate";
import { ProfileDetail } from "./ProfileDetail";
import { i18n, useTranslation } from "@/i18n";
import skillsExtraEn from "@/i18n/partials/skills.en.json";
import skillsExtraZhTW from "@/i18n/partials/skills.zh-TW.json";

i18n.addResourceBundle("en", "translation", skillsExtraEn, true, false);
i18n.addResourceBundle("zh-TW", "translation", skillsExtraZhTW, true, false);

export function ProfileDetailRoute() {
  const { t } = useTranslation();
  const { selectedCompany, selectedCompanyId } = useCompany();
  const { setBreadcrumbs } = useBreadcrumbs();
  const params = useParams<{ profileId?: string }>();

  useEffect(() => {
    setBreadcrumbs([
      { label: selectedCompany?.name ?? t("skillsExtra.common.company"), href: "/dashboard" },
      { label: t("skillsExtra.common.apps"), href: "/apps" },
      { label: t("skillsExtra.tools.accessProfiles"), href: advancedTabHref("profiles") },
      { label: t("skillsExtra.tools.profileDetail") },
    ]);
    return () => setBreadcrumbs([]);
  }, [setBreadcrumbs, selectedCompany?.name, t]);

  if (!selectedCompanyId || !params.profileId) {
    return <div className="p-6 text-sm text-muted-foreground">{t("skillsExtra.tools.selectOrganizationAndProfile")}</div>;
  }

  return (
    <ToolsAdminGate>
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-5 p-4 sm:p-6">
        <ProfileDetail companyId={selectedCompanyId} profileId={params.profileId} />
      </div>
    </ToolsAdminGate>
  );
}
