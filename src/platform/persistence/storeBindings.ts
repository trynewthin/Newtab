import { useSettingsStore } from "@/apps/settings/store";
import { useItemStore } from "@/launcher/store/item";
import { storageRegistry } from "./registry";

storageRegistry.registerRehydrator("app-settings", () => useSettingsStore.persist.rehydrate());
storageRegistry.registerRehydrator("app-items", () => useItemStore.persist.rehydrate());
