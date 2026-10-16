import { Copy } from "lucide-react";
import { useToast } from "@/context/ToastContext";
import { useTranslation } from "@/i18n";
import { copyTextToClipboard } from "@/lib/clipboard";
import { cn } from "@/lib/utils";
import { ensureAppsMessages } from "../connection-owner";

export function gatewayEndpointUrl(endpointPath: string): string {
  if (typeof window === "undefined") return endpointPath;
  try {
    return new URL(endpointPath, window.location.origin).toString();
  } catch {
    return endpointPath;
  }
}

export function CopyableGatewayUrl({
  endpointPath,
  className,
}: {
  endpointPath: string;
  className?: string;
}) {
  ensureAppsMessages();
  const { t } = useTranslation();
  const { pushToast } = useToast();
  const url = gatewayEndpointUrl(endpointPath);

  async function copy() {
    try {
      await copyTextToClipboard(url);
      pushToast({ title: t("apps.gateways.urlCopied"), tone: "success" });
    } catch {
      pushToast({
        title: t("apps.common.copyFailed"),
        body: t("apps.common.clipboardUnavailable"),
        tone: "error",
      });
    }
  }

  return (
    <button
      type="button"
      onClick={(event) => {
        event.stopPropagation();
        void copy();
      }}
      className={cn(
        "flex min-w-0 max-w-full items-center gap-1 text-left font-mono text-xs text-muted-foreground hover:text-foreground",
        className,
      )}
      title={t("apps.gateways.clickToCopy", { url })}
      aria-label={t("apps.gateways.copyUrl")}
    >
      <span className="min-w-0 truncate">{url}</span>
      <Copy className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
    </button>
  );
}
