import { useQuery } from "@tanstack/react-query";
import {
  Activity,
  BadgeDollarSign,
  BookOpenText,
  History,
  KeyRound,
  Library,
  MessageSquare,
  PlayCircle,
  ReceiptText,
  Settings2,
  ShieldCheck,
  Sparkles,
  Wrench,
} from "lucide-react";
import { agentsApi } from "@/api/agents";
import { useCompany } from "@/context/CompanyContext";
import { useChatConnectorsEnabled } from "@/hooks/useChatConnectorsEnabled";
import { queryKeys } from "@/lib/queryKeys";
import { ContextualSidebarFrame } from "./ContextualSidebarFrame";
import { SidebarNavItem } from "./SidebarNavItem";
import { contextualSidebarStyles } from "./contextual-sidebar-styles";
import {
  AGENT_DETAIL_NAVIGATION,
  agentDetailHref,
  agentScopedAuditHref,
  type AgentLocalDetailView,
} from "@/pages/agent-detail-navigation";
import { useTranslation } from "@/i18n";

const localIcons = {
  overview: Sparkles,
  instructions: BookOpenText,
  skills: Library,
  runtime: Settings2,
  secrets: ShieldCheck,
  tools: Wrench,
  channels: MessageSquare,
  permissions: ShieldCheck,
  "api-keys": KeyRound,
  revisions: History,
} satisfies Record<AgentLocalDetailView, typeof Sparkles>;

const auditItems = [
  { section: "activity", icon: Activity },
  { section: "runs", icon: PlayCircle },
  { section: "costs", icon: ReceiptText },
  { section: "budgets", icon: BadgeDollarSign },
] as const;

export function AgentContextualSidebar({
  agentRef,
  agentId,
  agentName,
  labels,
}: {
  agentRef: string;
  agentId?: string;
  agentName?: string;
  labels?: Partial<Record<AgentLocalDetailView, string>>;
}) {
  const { t } = useTranslation();
  const { selectedCompanyId } = useCompany();
  const { enabled: chatConnectorsEnabled } = useChatConnectorsEnabled();
  const shouldResolveAgent = !agentId || !agentName;
  const { data: resolvedAgent } = useQuery({
    queryKey: [...queryKeys.agents.detail(agentRef), selectedCompanyId ?? null, "contextual-sidebar"],
    queryFn: () => agentsApi.get(agentRef, selectedCompanyId ?? undefined),
    enabled: shouldResolveAgent && Boolean(agentRef && selectedCompanyId),
  });
  const resolvedId = agentId ?? resolvedAgent?.id;
  const resolvedName = agentName ?? resolvedAgent?.name ?? t("shell.agent.fallbackName");
  const resolvedLabels = labels ?? { secrets: t("shell.agent.items.secretsAndVariables") };
  const sectionLabels: Record<string, string> = {
    Agent: t("shell.agent.sections.agent"),
    Runtime: t("shell.agent.sections.runtime"),
    Governance: t("shell.agent.sections.governance"),
  };
  const itemLabels: Record<AgentLocalDetailView, string> = {
    overview: t("shell.agent.items.overview"),
    instructions: t("shell.agent.items.instructions"),
    skills: t("shell.agent.items.skills"),
    runtime: t("shell.agent.items.runtime"),
    secrets: t("shell.agent.items.secrets"),
    tools: t("shell.agent.items.tools"),
    channels: t("shell.agent.items.channels"),
    permissions: t("shell.agent.items.permissions"),
    "api-keys": t("shell.agent.items.apiKeys"),
    revisions: t("shell.agent.items.revisions"),
  };
  const auditLabels = {
    activity: t("shell.agent.audit.activity"),
    runs: t("shell.agent.audit.runs"),
    costs: t("shell.agent.audit.costs"),
    budgets: t("shell.agent.audit.budgets"),
  };

  return (
    <ContextualSidebarFrame
      surface="agent"
      title={resolvedName}
      fallbackTo="/agents/all"
      showHeader={false}
      className="border-r border-border bg-background"
    >
      <nav
        aria-label={t("shell.agent.navigation", { name: resolvedName })}
        data-slot="contextual-sidebar-nav"
        className={contextualSidebarStyles.nav}
      >
        {AGENT_DETAIL_NAVIGATION.map((section) => (
          <div
            key={section.label}
            data-slot="contextual-sidebar-section"
            className={contextualSidebarStyles.section}
          >
            <p
              data-slot="contextual-sidebar-section-label"
              className={contextualSidebarStyles.sectionLabel}
            >
              {sectionLabels[section.label] ?? section.label}
            </p>
            <div data-slot="contextual-sidebar-group" className={contextualSidebarStyles.group}>
              {section.items
                .filter((item) => item.value !== "channels" || chatConnectorsEnabled)
                .map((item) => {
                  const href = agentDetailHref(agentRef, item.value);
                  return (
                    <SidebarNavItem
                      key={item.value}
                      to={href}
                      label={resolvedLabels[item.value] ?? itemLabels[item.value]}
                      icon={localIcons[item.value]}
                    />
                  );
                })}
            </div>
          </div>
        ))}

        <div data-slot="contextual-sidebar-section" className={contextualSidebarStyles.section}>
          <p
            data-slot="contextual-sidebar-section-label"
            className={contextualSidebarStyles.sectionLabel}
          >
            {t("shell.common.audit")}
          </p>
          <div data-slot="contextual-sidebar-group" className={contextualSidebarStyles.group}>
            {resolvedId ? auditItems.map((item) => (
              <SidebarNavItem
                key={item.section}
                to={agentScopedAuditHref(resolvedId, item.section)}
                label={auditLabels[item.section]}
                icon={item.icon}
              />
            )) : (
              <p className="px-2 py-1.5 text-xs text-muted-foreground">{t("shell.agent.loadingAudit")}</p>
            )}
          </div>
        </div>
      </nav>
    </ContextualSidebarFrame>
  );
}
