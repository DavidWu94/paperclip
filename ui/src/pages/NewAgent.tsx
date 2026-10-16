import { useEffect } from "react";
import { useTranslation } from "@/i18n";
import { useBreadcrumbs } from "../context/BreadcrumbContext";
import { NewAgentSetup } from "../components/new-agent/NewAgentSetup";

export function NewAgent() {
  const { t } = useTranslation();
  const { setBreadcrumbs } = useBreadcrumbs();
  useEffect(() => {
    setBreadcrumbs([
      { label: t("core.agents.title"), href: "/agents" },
      { label: t("core.agents.newAgent") },
    ]);
  }, [setBreadcrumbs, t]);
  return <NewAgentSetup />;
}
