import { Plugin } from "obsidian";

import type { Template } from "./fsHelper.ts";

import { registerImageContextMenu } from "./contextMenu.ts";
import { type AttachmentToolsSettings } from "./settings.types.ts";
import { AttachmentToolsSettingTab } from "./settingsTab.ts";

export default class AttachmentToolsPlugin extends Plugin {
    declare settings: AttachmentToolsSettings;

    override async onload(): Promise<void> {
        await this.loadSettings();

        this.addSettingTab(new AttachmentToolsSettingTab(this.app, this));
        registerImageContextMenu(this);

        console.debug("Loaded T3 Attachment Tools plugin");
    }

    override onunload(): void {
        // no-op
    }

    async loadSettings(): Promise<void> {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment -- This is ok
        const settingsOnDisk: Partial<AttachmentToolsSettings> = await this.loadData();

        const defaultSettings: AttachmentToolsSettings = {
            renamePattern1:
                settingsOnDisk?.renamePattern1 ??
                settingsOnDisk?.renamePattern1 ??
                ("{documentpath}/{documentname}-pic-{number}.{extension}" as Template),
            renamePattern2:
                settingsOnDisk?.renamePattern2 ??
                settingsOnDisk?.renamePattern2 ??
                ("{documentpath}/pics/{documentname}-pic-{number}.{extension}" as Template),
            renamePattern3:
                settingsOnDisk?.renamePattern3 ??
                settingsOnDisk?.renamePattern3 ??
                ("{documentpath}/{lastmodified}_{documentname}.{extension}" as Template),
            renamePattern4:
                settingsOnDisk?.renamePattern4 ??
                settingsOnDisk?.renamePattern4 ??
                ("{documentpath}/{documentname:[a-zA-Z]}-{number}.{extension}" as Template),
            deleteMethod: settingsOnDisk?.deleteMethod ?? "trash",
            menuItems: settingsOnDisk?.menuItems ?? {
                displayDelete: false,
                fileTreeDisplayRenameAll: true,
                objectDisplayRenameSingleFile: true,
                objectDisplayRenameAll: true,
            },
        };

        this.settings = defaultSettings;
    }

    async saveSettings(): Promise<void> {
        await this.saveData(this.settings);
    }
}
