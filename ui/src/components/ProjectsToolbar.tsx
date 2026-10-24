import { ArrowUpDown, Check, Plus } from "lucide-react";
import { useTranslation } from "@/i18n";
import { ToolbarSearch } from "./ToolbarSearch";
import { Button } from "./ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";

export type ProjectSortField = "name" | "updated" | "created" | "targetDate";
export type ProjectSortDir = "asc" | "desc";

const PROJECT_SORT_FIELDS: ProjectSortField[] = ["name", "updated", "created", "targetDate"];

/** Canonical project search, sorting and creation controls. State stays with the page. */
export function ProjectsToolbar({ query, onQueryChange, sortField, sortDir, onSortChange, onNewProject: openNewProject }: {
  query: string;
  onQueryChange: (value: string) => void;
  sortField: ProjectSortField;
  sortDir: ProjectSortDir;
  onSortChange: (field: ProjectSortField, direction: ProjectSortDir) => void;
  onNewProject: () => void;
}) {
  const { t } = useTranslation();
  const sortLabel = t(`work.projects.sort.${sortField}`);
  return <div data-canonical-toolbar="projects" role="toolbar" aria-label={t("work.projects.controls")} className="flex flex-wrap items-center gap-4">
    <ToolbarSearch query={query} onQueryChange={onQueryChange} label={t("work.projects.searchLabel")} placeholder={t("work.projects.searchPlaceholder")} />
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" title={t("work.common.sort")}>
          <ArrowUpDown className="h-3.5 w-3.5 sm:h-3 sm:w-3 sm:mr-1" />
          <span>{t("work.projects.sortBy", { label: sortLabel })}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-44 p-0">
        <div className="p-2 space-y-0.5">
          {PROJECT_SORT_FIELDS.map((field) => (
            <button
              key={field}
              type="button"
              className={`flex w-full items-center justify-between rounded-sm px-2 py-1.5 text-sm ${
                sortField === field
                  ? "bg-accent/50 text-foreground"
                  : "text-muted-foreground hover:bg-accent/50"
              }`}
              onClick={() => {
                onSortChange(field, sortField === field
                  ? (sortDir === "asc" ? "desc" : "asc")
                  : (field === "name" || field === "targetDate" ? "asc" : "desc"));
              }}
            >
              <span>{t(`work.projects.sort.${field}`)}</span>
              {sortField === field ? (
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Check className="h-3 w-3" />
                  {sortDir === "asc" ? t("work.common.asc") : t("work.common.desc")}
                </span>
              ) : null}
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
    <div className="design-toolbar-actions">
      <Button size="sm" variant="outline" data-toolbar-primary onClick={openNewProject}>
          <Plus className="h-4 w-4 mr-1" />
          {t("work.projects.add")}
      </Button>
    </div>
  </div>;
}
