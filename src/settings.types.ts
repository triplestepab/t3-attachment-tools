import type { Template } from "./fsHelper.ts";

export const deleteMethods = ["immediately", "trash"] as const;
export type DeleteMethod = (typeof deleteMethods)[number];

export interface AttachmentToolsSettings {
    renamePattern1: Template;
    renamePattern2: Template;
    renamePattern3: Template;
    renamePattern4: Template;
    deleteMethod: DeleteMethod;

    menuItems: {
        displayDelete: boolean;
        fileTreeDisplayRenameAll: boolean;
        objectDisplayRenameSingleFile: boolean;
        objectDisplayRenameAll: boolean;
    };
}
