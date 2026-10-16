import { AlertTriangle } from "lucide-react";
import type { ToolProfileWithDetails } from "@paperclipai/shared";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { i18n, useTranslation } from "@/i18n";
import skillsExtraEn from "@/i18n/partials/skills.en.json";
import skillsExtraZhTW from "@/i18n/partials/skills.zh-TW.json";

i18n.addResourceBundle("en", "translation", skillsExtraEn, true, false);
i18n.addResourceBundle("zh-TW", "translation", skillsExtraZhTW, true, false);

export type ProfileActionDialogKind = "archive" | "delete" | "restore";

export function ProfileActionDialog({
  kind,
  profile,
  pending,
  onClose,
  onArchive,
  onRestore,
  onDelete,
}: {
  kind: ProfileActionDialogKind | null;
  profile: ToolProfileWithDetails | null;
  pending: boolean;
  onClose: () => void;
  onArchive: () => void;
  onRestore: () => void;
  onDelete: () => void;
}) {
  const { t } = useTranslation();
  if (!kind || !profile) return null;

  const defaultDeleteBlocked = kind === "delete" && profile.summary.isCompanyDefault;
  const copy = {
    archive: {
      title: t("skillsExtra.tools.archiveTitle"),
      body: t(
        profile.summary.appliesToAgentCount === 1
          ? "skillsExtra.tools.archiveBodyOne"
          : "skillsExtra.tools.archiveBodyOther",
        { count: profile.summary.appliesToAgentCount },
      ),
      confirm: t("skillsExtra.common.archive"),
      action: onArchive,
    },
    restore: {
      title: t("skillsExtra.tools.restoreTitle"),
      body: t("skillsExtra.tools.restoreBody"),
      confirm: t("skillsExtra.common.restore"),
      action: onRestore,
    },
    delete: {
      title: t("skillsExtra.tools.deleteTitle"),
      body: defaultDeleteBlocked
        ? t("skillsExtra.tools.deleteBlockedBody")
        : t(
            profile.summary.assignmentCount === 1
              ? "skillsExtra.tools.deleteBodyOne"
              : "skillsExtra.tools.deleteBodyOther",
            { count: profile.summary.assignmentCount },
          ),
      confirm: t("skillsExtra.common.delete"),
      action: onDelete,
    },
  }[kind];

  return (
    <Dialog open onOpenChange={(next) => !next && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{copy.title}</DialogTitle>
          <DialogDescription>{copy.body}</DialogDescription>
        </DialogHeader>
        {defaultDeleteBlocked ? (
          <div className="flex gap-3 rounded-lg border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm text-destructive">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{t("skillsExtra.tools.deleteBlockedHint")}</span>
          </div>
        ) : null}
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>{t("skillsExtra.common.cancel")}</Button>
          <Button
            variant={kind === "delete" ? "destructive" : "default"}
            disabled={pending || defaultDeleteBlocked}
            onClick={copy.action}
          >
            {copy.confirm}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
