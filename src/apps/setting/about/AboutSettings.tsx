import { useTranslation } from "react-i18next";
import { SidebarHeader } from "@/components/shared";
import { SettingsSection, SettingsItem } from "@/apps/setting/base/SettingComponents";
import { Info, Github, RotateCcw, User, Heart } from "lucide-react";
import { APP_METADATA } from "@/lib/constants";

interface AboutSettingsProps {
    onOpenMobileMenu?: () => void;
    onClose?: () => void;
}

export function AboutSettings({ onOpenMobileMenu, onClose }: AboutSettingsProps) {
    const { t } = useTranslation();

    return (
        <div className="h-full flex flex-col">
            <SidebarHeader
                title={t('about')}
                description={t('about_desc')}
                onMenuClick={onOpenMobileMenu}
                onClose={onClose}
            />

            <div className="flex-1 overflow-y-auto custom-scrollbar">
                <div className="max-w-3xl mx-auto p-6 space-y-8 pb-10">
                    {/* Version Info Section */}
                    <SettingsSection
                        icon={Info}
                        iconColor="text-blue-500"
                        title={t('version_info')}
                    >
                        <SettingsItem label={t('current_version')}>
                            <span className="text-sm font-mono bg-primary/10 text-primary px-2 py-0.5 rounded-full font-bold">
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
                                            className="w-5 h-5 rounded-full ring-1 ring-primary/20"
                                        />
                                    )}
                                    <span className="text-sm font-bold">{APP_METADATA.author.name}</span>
                                    <div className="p-1 bg-red-500/10 rounded-full">
                                        <Heart size={12} className="text-red-500 fill-red-500" />
                                    </div>
                                </div>
                            </SettingsItem>
                            <SettingsItem label="GitHub">
                                <a
                                    href={APP_METADATA.author.github}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-1.5 text-sm font-bold text-primary hover:underline"
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
                                <div key={index} className="relative pl-4 border-l-2 border-primary/20 space-y-1">
                                    <div className="absolute -left-[5px] top-1.5 w-2 h-2 rounded-full bg-primary shadow-sm shadow-primary/30" />
                                    <span className="text-[10px] font-black opacity-30 tracking-widest">{log.date}</span>
                                    <p className="text-sm font-medium leading-relaxed">{log.content}</p>
                                </div>
                            ))}
                        </div>
                    </SettingsSection>
                </div>
            </div>
        </div>
    );
}
