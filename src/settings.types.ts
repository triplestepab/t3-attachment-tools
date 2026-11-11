
export const deleteMethods = ["immediately", "trash"] as const;
export type DeleteMethod = (typeof deleteMethods)[number];

export interface AttachmentToolsSettings {
    renamePattern1: string;
    renamePattern2: string;
    renamePattern3: string;
    renamePattern4: string;
    deleteMethod: DeleteMethod;

    menuItems: {
        displayDelete: boolean;
        fileTreeDisplayRenameAll: boolean;
        objectDisplayRenameSingleFile: boolean;
        objectDisplayRenameAll: boolean;
    }
}
