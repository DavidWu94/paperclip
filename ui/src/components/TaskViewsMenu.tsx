import { Check, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTranslation } from "@/i18n";
import { TASK_VIEW_GROUPS, type TaskViewKey } from "@/lib/task-views";
import { cn } from "@/lib/utils";

function viewLabelKey(key: TaskViewKey): string {
  switch (key) {
    case "mine":
      return "waveFix.tasks.views.mine";
    case "unread":
      return "waveFix.tasks.views.unread";
    case "blocked":
      return "waveFix.tasks.views.blocked";
    case "recent":
      return "shell.sort.recent";
    case "everything":
      return "waveFix.tasks.views.everything";
    case "all":
      return "waveFix.tasks.views.allTasks";
    case "active":
      return "waveFix.tasks.views.active";
    case "backlog":
      return "waveFix.tasks.backlog";
    case "done":
      return "work.common.done";
  }
}

function viewHintKey(key: TaskViewKey): string {
  switch (key) {
    case "mine":
      return "waveFix.tasks.views.hints.mine";
    case "unread":
      return "waveFix.tasks.views.hints.unread";
    case "blocked":
      return "waveFix.tasks.views.hints.blocked";
    case "recent":
      return "waveFix.tasks.views.hints.recent";
    case "everything":
      return "waveFix.tasks.views.hints.everything";
    case "all":
      return "waveFix.tasks.views.hints.all";
    case "active":
      return "waveFix.tasks.views.hints.active";
    case "backlog":
      return "waveFix.tasks.views.hints.backlog";
    case "done":
      return "waveFix.tasks.views.hints.done";
  }
}

/**
 * The single control that replaced both the Inbox tab bar and the implicit
 * "all tasks" default on Tasks (PAP-670). One menu, grouped by scope, so the
 * nav does not have to grow a row every time a view is added.
 */
export function TaskViewsMenu({
  value,
  onChange,
  badgeCount,
}: {
  value: TaskViewKey;
  onChange: (next: TaskViewKey) => void;
  /** Unread count surfaced next to the My-work group, mirroring the nav badge. */
  badgeCount?: number;
}) {
  const { t } = useTranslation();
  const activeLabel = t(viewLabelKey(value));
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          size="sm"
          variant="outline"
          className="h-8 gap-1.5"
          aria-label={t("waveFix.tasks.views.changeView", { view: activeLabel })}
        >
          <span className="max-w-(--sz-160px) truncate font-medium">{activeLabel}</span>
          <ChevronDown aria-hidden="true" className="h-3.5 w-3.5 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-(--sz-260px)">
        {TASK_VIEW_GROUPS.map((group, groupIndex) => (
          <div key={group.label}>
            {groupIndex > 0 ? <DropdownMenuSeparator /> : null}
            <DropdownMenuLabel className="flex items-center justify-between gap-2">
              <span>
                {group.label === "My work"
                  ? t("shell.sidebar.myWork")
                  : group.label === "Organization"
                    ? t("shell.sidebar.organization")
                    : group.label}
              </span>
              {groupIndex === 0 && badgeCount != null && badgeCount > 0 ? (
                <span className="rounded-full bg-primary px-1.5 text-(length:--text-nano) leading-tight text-primary-foreground">
                  {badgeCount > 99 ? "99+" : badgeCount}
                </span>
              ) : null}
            </DropdownMenuLabel>
            {group.views.map((view) => {
              const selected = view.key === value;
              const label = t(viewLabelKey(view.key));
              return (
                <DropdownMenuItem
                  key={view.key}
                  onSelect={() => onChange(view.key)}
                  className="items-start gap-2"
                  aria-current={selected ? "true" : undefined}
                >
                  <Check
                    aria-hidden="true"
                    className={cn("mt-0.5 size-3.5 shrink-0", selected ? "opacity-100" : "opacity-0")}
                  />
                  <span className="min-w-0">
                    <span className={cn("block truncate", selected && "font-medium")}>{label}</span>
                    <span className="block text-(length:--text-nano) text-muted-foreground">{t(viewHintKey(view.key))}</span>
                  </span>
                </DropdownMenuItem>
              );
            })}
          </div>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
