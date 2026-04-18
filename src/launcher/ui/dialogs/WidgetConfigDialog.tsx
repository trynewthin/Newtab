import { useMemo, useState } from "react";
import { Check } from "lucide-react";
import { AppChromeIconButton, AppDialogV1Closable } from "@/platform/ui";
import { getWidgetManifestItem, normalizeWidgetConfig } from "@/launcher/registry";
import type { LauncherWidgetItem } from "@/launcher/model/itemTypes";
import { useItemStore } from "@/launcher/store/item";
import { WidgetConfigForm } from "@/launcher/ui/widgets";
import type { WidgetConfig, WidgetConfigField } from "@/shared/types";
import { useTranslation } from "react-i18next";

interface WidgetConfigDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    item?: LauncherWidgetItem | null;
}

export function WidgetConfigDialog({
    open,
    onOpenChange,
    item,
}: WidgetConfigDialogProps) {
    const { t } = useTranslation();
    const widget = useMemo(
        () => (item ? getWidgetManifestItem(item.widgetId) : null),
        [item]
    );
    const configFields = widget?.configFields ?? [];

    return (
        <AppDialogV1Closable
            open={open}
            onOpenChange={onOpenChange}
            title={t("edit_widget")}
            closeLabel={t("close")}
            popupClassName="w-[min(92vw,38rem)]"
            bodyClassName="px-6 pb-6 sm:px-8 sm:pb-8"
            headerActions={
                <AppChromeIconButton
                    label={t("save")}
                    icon={Check}
                    type="submit"
                    form="widget-config-form"
                    disabled={!item || configFields.length === 0}
                />
            }
        >
            {item && configFields.length > 0 ? (
                <WidgetConfigDialogForm
                    key={item.id}
                    item={item}
                    fields={configFields}
                    onSubmitComplete={() => onOpenChange(false)}
                />
            ) : null}
        </AppDialogV1Closable>
    );
}

function WidgetConfigDialogForm({
    item,
    fields,
    onSubmitComplete,
}: {
    item: LauncherWidgetItem;
    fields: readonly WidgetConfigField[];
    onSubmitComplete: () => void;
}) {
    const updateItem = useItemStore((state) => state.updateItem);
    const [draftConfig, setDraftConfig] = useState<WidgetConfig>(() =>
        normalizeWidgetConfig(item.widgetId, item.config)
    );

    const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        updateItem(item.id, {
            config: normalizeWidgetConfig(item.widgetId, draftConfig),
        });
        onSubmitComplete();
    };

    return (
        <form id="widget-config-form" onSubmit={handleSubmit}>
            <WidgetConfigForm
                fields={fields}
                value={draftConfig}
                onChange={setDraftConfig}
            />
        </form>
    );
}
