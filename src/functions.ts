import { type App, TFile, Notice } from "obsidian";

import type { DeleteMethod } from "./settings.types.ts";

import { deleteFile, renameFile } from "./fsHelper.ts";
import { generateFormattedPath } from "./templateHelper.ts";

/**
 * Moves the file to a new location and refreshes the current document to update the links.
 */
export async function moveFileToNewLocation(
    app: App,
    attachment: TFile,
    newLocation: string,
): Promise<boolean> {
    if (!newLocation) {
        new Notice("Name cannot be empty");
        return false;
    }

    try {
        await renameFile(app, attachment, newLocation);
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
export async function moveFileToTrash(
    app: App,
    currentDocument: TFile,
    deleteMethod: DeleteMethod,
    target: TFile,
): Promise<boolean> {
    try {
        console.debug(`moveFileToTrash(): Deleting ${target.path} with method ${deleteMethod}`);
        await removeLinkFromActiveEditor(app, currentDocument, target);
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

async function removeLinkFromActiveEditor(
    app: App,
    currentDocument: TFile,
    target: TFile,
): Promise<void> {
    // Loop all attachments of the current document
    const cache = app.metadataCache.getFileCache(currentDocument);

    if (cache && cache.embeds) {
        for (let i = cache.embeds.length - 1; i >= 0; i--) {
            const embed = cache.embeds[i];
            const attachedFile = app.metadataCache.getFirstLinkpathDest(
                embed.link,
                currentDocument.path,
            );
            if (attachedFile?.path === target.path) {
                // Found the file we're trying to delete
                const linkInDocument = embed.original; // For exaple "![](Test/Foo/Bar/pic1.png)"

                // Update the document
                let content = await app.vault.read(currentDocument);
                content = content.replaceAll(linkInDocument, "");
                await app.vault.modify(currentDocument, content);
            }
        }
    }
}

export async function moveAllFilesToNewLocation(
    app: App,
    currentDocument: TFile,
    formatTo: string,
): Promise<boolean> {
    const cache = app.metadataCache.getFileCache(currentDocument);
    for (const embed of cache?.embeds ?? []) {
        const attachment = app.metadataCache.getFirstLinkpathDest(embed.link, currentDocument.path);

        if (attachment instanceof TFile) {
            let newName = generateFormattedPath(currentDocument, attachment, formatTo);
            await moveFileToNewLocation(app, attachment, newName);
        }
    }

    return true;
}
