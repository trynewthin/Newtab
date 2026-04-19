import { useTranslation } from "react-i18next";
import { Switch } from "@/components/ui/switch";
import { useSearchPreferenceStore } from "@/config";
import { SettingsItem, SettingsSection } from "../components/SettingComponents";

export function ExperienceSettings() {
    const { t } = useTranslation();
    const showLocalBookmarkSuggestions = useSearchPreferenceStore((state) => state.showLocalBookmarkSuggestions);
    const setShowLocalBookmarkSuggestions = useSearchPreferenceStore((state) => state.setShowLocalBookmarkSuggestions);

    return (
        <div className="mx-auto max-w-3xl space-y-6">
            <SettingsSection title={t("search_experience")}>
                <SettingsItem
                    label={t("show_local_bookmark_suggestions")}
                >
                    <Switch
                        checked={showLocalBookmarkSuggestions}
                        onCheckedChange={setShowLocalBookmarkSuggestions}
                    />
                </SettingsItem>
            </SettingsSection>
        </div>
    );
}
