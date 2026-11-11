import { type App, TFile, MarkdownView, Notice, normalizePath } from "obsidian";
import { deleteFile, renameFile } from "./fsHelper";
import type { DeleteMethod } from "./settings.types";
import { generateFormattedPath } from "./templateHelper";


/**
 * Moves the file to a new location and refreshes the current document to update the links.
 */
export async function moveFileToNewLocation(app: App, currentDocument: TFile, attachment: TFile, newLocation: string): Promise<boolean> {

    if (!newLocation) {
        new Notice("Name cannot be empty");
        return false;
    }

    try {
        await renameFile(app, currentDocument, attachment, newLocation);
        return true;

    } catch (err: unknown) {
        if (err instanceof Error) {
            console.error("Rename failed", err);
            new Notice(err.message);
        } else {
            console.error("Rename failed", err);
            new Notice(String(err));
        }
        return false;
    }
}


/**
 * Deletes the file and refreshes the current document to update the links.
 */
export async function moveFileToTrash(app: App, currentDocument: TFile, deleteMethod: DeleteMethod, target: TFile): Promise<boolean> {
    try {
        console.log(`moveFileToTrash(): Deleting ${target.path} with method ${deleteMethod}`);
        removeLinkFromActiveEditor(app, currentDocument, target);
        await deleteFile(app, deleteMethod, target);

        return true;
    } catch (err: unknown) {
        if (err instanceof Error) {
            console.error("Delete failed", err);
            new Notice(err.message);
        } else {
            console.error("Delete failed", err);
            new Notice(String(err));
        }
        return false;
    }
}


async function removeLinkFromActiveEditor(app: App, currentDocument: TFile, target: TFile): Promise<void> {

    // Loop all attachments of the current document
    const cache = app.metadataCache.getFileCache(currentDocument);

    if (cache && cache.embeds) {
        for (let i = cache.embeds.length - 1; i >= 0; i--) {
            const embed = cache.embeds[i];
            const attachedFile = app.metadataCache.getFirstLinkpathDest(embed.link, currentDocument.path);
            if (attachedFile?.path === target.path) {

                // Found the file we're trying to delete
                var linkInDocument = embed.original;  // For exaple "![](Test/Foo/Bar/pic1.png)"

                // Update the document
                let content = await app.vault.read(currentDocument);
                content = content.replaceAll(linkInDocument, "");
                await app.vault.modify(currentDocument, content);
            }
        }
    }
}



export async function moveAllFilesToNewLocation(app: App, currentDocument: TFile, formatTo: string): Promise<boolean> {

    const cache = app.metadataCache.getFileCache(currentDocument);
    for (const embed of cache?.embeds ?? []) {
        const attachment = app.metadataCache.getFirstLinkpathDest(embed.link, currentDocument.path);

        if (attachment instanceof TFile) {
            var newName = generateFormattedPath(currentDocument, attachment, formatTo);
            await moveFileToNewLocation(app, currentDocument, attachment, newName);
        }
    }

    return true;
}
