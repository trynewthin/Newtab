import { useTranslation } from "react-i18next";
import { SettingsSection, SettingsItem } from "@/apps/settings/components/SettingComponents";
import { Info, Github, RotateCcw, User, Heart } from "lucide-react";
import { APP_METADATA } from "@/core/constants";

export function AboutSettings() {
    const { t } = useTranslation();

    return (
                <div className="mx-auto max-w-3xl space-y-6">
                    {/* Version Info Section */}
                    <SettingsSection
                        icon={Info}
                        iconColor="text-blue-500"
                        title={t('version_info')}
                    >
                        <SettingsItem label={t('current_version')}>
                            <span className="rounded-full border border-foreground/10 bg-foreground/4 px-2 py-0.5 font-mono text-sm font-semibold text-foreground">
                                v{APP_METADATA.version}
                            </span>
                        </SettingsItem>
                    </SettingsSection>

                    {/* Author Info Section */}
                    <SettingsSection
                        icon={User}
                        iconColor="text-pink-500"
                        title={t('author_info')}
                    >
                        <div className="space-y-4">
                            <SettingsItem label={t('author')}>
                                <div className="flex items-center gap-2">
                                    {APP_METADATA.author.avatar && (
                                        <img
                                            src={APP_METADATA.author.avatar}
                                            alt=""
                                            className="w-5 h-5 rounded-full ring-1 ring-border/60"
                                        />
                                    )}
                                    <span className="text-sm font-semibold">{APP_METADATA.author.name}</span>
                                    <div className="rounded-full border border-foreground/10 bg-foreground/4 p-1">
                                        <Heart size={12} className="text-foreground/70 fill-foreground/70" />
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
                                    {APP_METADATA.author.github.split('/').pop()}
                                </a>
                            </SettingsItem>
                        </div>
                    </SettingsSection>

                    {/* Change Log Section */}
                    <SettingsSection
                        icon={RotateCcw}
                        iconColor="text-orange-500"
                        title={t('update_log')}
                    >
                        <div className="space-y-4">
                            {APP_METADATA.changelog.map((log, index) => (
                                <div key={index} className="relative space-y-1.5 border-l-2 border-foreground/15 pl-4">
                                    <div className="absolute -left-[5px] top-1.5 h-2 w-2 rounded-full bg-foreground/55" />
                                    <div className="flex items-center gap-2">
                                        <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground/70">{log.date}</span>
                                        <span className="rounded-full border border-foreground/10 bg-foreground/4 px-2 py-0.5 text-[10px] font-semibold leading-none text-foreground/80">
                                            {log.tag}
                                        </span>
                                    </div>
                                    <p className="text-sm leading-relaxed text-foreground/90">{log.content}</p>
                                </div>
                            ))}
                        </div>
                    </SettingsSection>
                </div>
    );
}

