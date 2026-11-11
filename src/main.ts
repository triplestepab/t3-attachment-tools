import { Plugin } from "obsidian";
import { AttachmentToolsSettingTab } from "./settingsTab";
import { registerImageContextMenu } from "./contextMenu";
import { type AttachmentToolsSettings } from "./settings.types";

export default class AttachmentToolsPlugin extends Plugin {
    declare settings: AttachmentToolsSettings;

    override async onload(): Promise<void> {
        await this.loadSettings();

        this.addSettingTab(new AttachmentToolsSettingTab(this.app, this));
        registerImageContextMenu(this);

        console.log("Loaded T3 Attachment Tools plugin");

    }

    override onunload(): void {
        // no-op
    }

    async loadSettings(): Promise<void> {

        const settingsOnDisk: Partial<AttachmentToolsSettings> = await this.loadData();

        var defaultSettings: AttachmentToolsSettings = {
            renamePattern1: settingsOnDisk?.renamePattern1 ?? settingsOnDisk?.renamePattern1 ?? "{documentpath}/{documentname}-pic-{number}.{extension}",
            renamePattern2: settingsOnDisk?.renamePattern2 ?? settingsOnDisk?.renamePattern2 ?? "{documentpath}/pics/{documentname}-pic-{number}.{extension}",
            renamePattern3: settingsOnDisk?.renamePattern3 ?? settingsOnDisk?.renamePattern3 ?? "{documentpath}/{lastmodified}_{filename}.{extension}",
            renamePattern4: settingsOnDisk?.renamePattern4 ?? settingsOnDisk?.renamePattern4 ?? "{documentpath}/{documentname:[a-zA-Z]}-{number}.{extension}",
            deleteMethod: settingsOnDisk?.deleteMethod ?? "trash",
            menuItems: settingsOnDisk?.menuItems ?? {
                displayDelete: false,
                fileTreeDisplayRenameAll: true,
                objectDisplayRenameSingleFile: true,
                objectDisplayRenameAll: true,
            }
        };
        
        this.settings = defaultSettings;

    }

    async saveSettings(): Promise<void> {
        await this.saveData(this.settings);
    }
}
