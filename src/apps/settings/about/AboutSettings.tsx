import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
    SettingsButtonGroup,
    SettingsItem,
    SettingsSection,
} from "@/apps/settings/components/SettingComponents";
import { Github, Heart } from "lucide-react";
import { APP_METADATA } from "@/shared/constants";

type ChangelogCard = {
    tag: string;
    latestDate: string;
    entries: Array<{
        date: string;
        content: string;
    }>;
};

function buildChangelogCards(): ChangelogCard[] {
    const grouped = new Map<string, ChangelogCard>();

    for (const entry of APP_METADATA.changelog) {
        const existing = grouped.get(entry.tag);
        if (existing) {
            existing.entries.push({
                date: entry.date,
                content: entry.content,
            });
            continue;
        }

        grouped.set(entry.tag, {
            tag: entry.tag,
            latestDate: entry.date,
            entries: [
                {
                    date: entry.date,
                    content: entry.content,
                },
            ],
        });
    }

    return Array.from(grouped.values());
}

export function AboutSettings() {
    const { t } = useTranslation();
    const changelogCards = useMemo(() => buildChangelogCards(), []);
    const [activeTag, setActiveTag] = useState<string>(
        changelogCards[0]?.tag ?? `v${APP_METADATA.version}`
    );

    const activeCard =
        changelogCards.find((card) => card.tag === activeTag) ??
        changelogCards[0] ??
        null;

    return (
        <div className="mx-auto max-w-3xl space-y-6">
            <SettingsSection title={t("version_info")}>
                <SettingsItem label={t("current_version")}>
                    <span className="rounded-full border border-foreground/10 bg-foreground/4 px-2 py-0.5 font-mono text-sm font-semibold text-foreground">
                        v{APP_METADATA.version}
                    </span>
                </SettingsItem>
            </SettingsSection>

            <SettingsSection title={t("author_info")}>
                <div className="space-y-4">
                    <SettingsItem label={t("author")}>
                        <div className="flex items-center gap-2">
                            {APP_METADATA.author.avatar ? (
                                <img
                                    src={APP_METADATA.author.avatar}
                                    alt=""
                                    className="h-5 w-5 rounded-full ring-1 ring-border/60"
                                />
                            ) : null}
                            <span className="text-sm font-semibold">{APP_METADATA.author.name}</span>
                            <div className="rounded-full border border-foreground/10 bg-foreground/4 p-1">
                                <Heart size={12} className="fill-foreground/70 text-foreground/70" />
                            </div>
                        </div>
                    </SettingsItem>
                    <SettingsItem label="GitHub">
                        <a
                            href={APP_METADATA.author.github}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1.5 text-sm font-semibold text-foreground hover:underline"
                        >
                            <Github size={14} />
                            {APP_METADATA.author.github.split("/").pop()}
                        </a>
                    </SettingsItem>
                </div>
            </SettingsSection>

            <SettingsSection title={t("update_log")}>
                <div className="space-y-4">
                    <SettingsButtonGroup
                        options={changelogCards.map((card) => ({
                            id: card.tag,
                            label: card.tag,
                        }))}
                        value={activeTag}
                        onChange={setActiveTag}
                        className="flex-wrap"
                    />

                    {activeCard ? (
                        <div className="rounded-[1.75rem] border border-foreground/10 bg-foreground/[0.03] p-5 shadow-[0_14px_40px_rgba(0,0,0,0.08)] dark:shadow-[0_14px_40px_rgba(0,0,0,0.2)]">
                            <div className="flex items-center gap-2">
                                <span className="rounded-full border border-foreground/10 bg-foreground/6 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-foreground/80">
                                    {activeCard.tag}
                                </span>
                                <span className="text-[11px] font-medium text-muted-foreground">
                                    {activeCard.latestDate}
                                </span>
                            </div>

                            <div className="mt-4 space-y-3.5">
                                {activeCard.entries.map((entry, index) => (
                                    <div
                                        key={`${entry.date}-${index}`}
                                        className="relative space-y-1.5 border-l-2 border-foreground/12 pl-4"
                                    >
                                        <div className="absolute -left-[5px] top-1.5 h-2 w-2 rounded-full bg-foreground/50" />
                                        <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground/70">
                                            {entry.date}
                                        </span>
                                        <p className="text-sm leading-relaxed text-foreground/90">
                                            {entry.content}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : null}
                </div>
            </SettingsSection>
        </div>
    );
}
