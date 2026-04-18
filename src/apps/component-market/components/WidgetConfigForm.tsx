import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import type {
    WidgetConfig,
    WidgetConfigField,
    WidgetRangeConfigField,
} from "@/shared/types";
import { useTranslation } from "react-i18next";

interface WidgetConfigFormProps {
    fields: readonly WidgetConfigField[];
    value: WidgetConfig;
    onChange: (next: WidgetConfig) => void;
}

export function WidgetConfigForm({
    fields,
    value,
    onChange,
}: WidgetConfigFormProps) {
    const { t } = useTranslation();

    if (fields.length === 0) {
        return null;
    }

    return (
        <div className="space-y-3 rounded-[1.5rem] border border-border/70 bg-background/74 p-4">
            <div className="text-xs font-semibold uppercase tracking-[0.22em] text-foreground/42">
                {t("component_market_customize")}
            </div>

            <div className="grid gap-3 md:grid-cols-2">
                {fields.map((field) => {
                    if (field.type === "select") {
                        const currentValue = typeof value[field.key] === "string"
                            ? value[field.key] as string
                            : field.defaultValue;

                        return (
                            <div key={field.key} className="space-y-2">
                                <Label>{t(field.label)}</Label>
                                <Select
                                    value={currentValue}
                                    onValueChange={(nextValue) => {
                                        if (!nextValue) {
                                            return;
                                        }
                                        onChange({
                                            ...value,
                                            [field.key]: nextValue,
                                        });
                                    }}
                                >
                                    <SelectTrigger className="h-10 w-full rounded-xl border-border/70 bg-background/82 px-3 text-sm">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {field.options.map((option) => (
                                            <SelectItem key={option.value} value={option.value}>
                                                {t(option.label)}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        );
                    }

                    if (field.type === "switch") {
                        const checked = value[field.key] === true;

                        return (
                            <div key={field.key} className="flex items-center justify-between rounded-xl border border-border/70 bg-background/82 px-3 py-2.5">
                                <div className="space-y-1">
                                    <Label>{t(field.label)}</Label>
                                    {field.description ? (
                                        <div className="text-xs text-muted-foreground">
                                            {t(field.description)}
                                        </div>
                                    ) : null}
                                </div>
                                <Switch
                                    checked={checked}
                                    onCheckedChange={(nextChecked) => {
                                        onChange({
                                            ...value,
                                            [field.key]: nextChecked,
                                        });
                                    }}
                                />
                            </div>
                        );
                    }

                    if (field.type === "range") {
                        return (
                            <RangeField
                                key={field.key}
                                field={field}
                                value={value}
                                onChange={onChange}
                            />
                        );
                    }

                    const textValue = typeof value[field.key] === "string"
                        ? value[field.key] as string
                        : field.defaultValue;

                    return (
                        <div key={field.key} className="space-y-2">
                            <Label>{t(field.label)}</Label>
                            <Input
                                value={textValue}
                                placeholder={field.placeholder ? t(field.placeholder) : undefined}
                                onChange={(event) => {
                                    onChange({
                                        ...value,
                                        [field.key]: event.target.value,
                                    });
                                }}
                                className="h-10 rounded-xl border-border/70 bg-background/82 px-3 shadow-none"
                            />
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

function RangeField({
    field,
    value,
    onChange,
}: {
    field: WidgetRangeConfigField;
    value: WidgetConfig;
    onChange: (next: WidgetConfig) => void;
}) {
    const { t } = useTranslation();
    const currentValue = typeof value[field.key] === "number"
        ? value[field.key] as number
        : field.defaultValue;

    return (
        <div className="space-y-2 rounded-xl border border-border/70 bg-background/82 px-3 py-3">
            <div className="flex items-center justify-between gap-3">
                <Label>{t(field.label)}</Label>
                <span className="text-xs font-medium text-muted-foreground">
                    {currentValue}
                </span>
            </div>
            <Slider
                value={[currentValue]}
                min={field.min}
                max={field.max}
                step={field.step ?? 1}
                onValueChange={(values) => {
                    const nextValue = values[0];
                    if (typeof nextValue !== "number") {
                        return;
                    }

                    onChange({
                        ...value,
                        [field.key]: nextValue,
                    });
                }}
            />
        </div>
    );
}
