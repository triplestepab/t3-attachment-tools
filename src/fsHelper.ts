import { FileSystemAdapter, normalizePath, TFile, TFolder, type App } from "obsidian";
import type { DeleteMethod } from "./settings.types";
import type AttachmentToolsPlugin from "./main";


/**
 * Get full vault path by decoding the resource path and stripping the "app://local/" prefix.
x */
export function getFullVaultPath(plugin: AttachmentToolsPlugin): string {

    // Get the Vault System Root
    const resourcePath = plugin.app.vault.adapter.getResourcePath("");
    const result = decodeURIComponent(resourcePath)
        .replace(/^app:\/\/[\w-]+\//, "")
        .split('?')[0];

    return result;

}

/**
 * Renames a file to a new name or path. Handles both absolute and relative paths.
 */
export async function renameFile(app: App, currentDocument: TFile, attachment: TFile, newName: string): Promise<TFile> {

    console.log("renameFile(): Starting rename process");
    console.log("--- From=" + attachment);
    console.log("--- locatedAt=" + getFullPath(attachment))
    console.log("--- newName=" + newName);
    var caluclatedTarget = combinePath(attachment, newName);
    console.log("--- caluclatedTarget=" + caluclatedTarget)

    var parentFolderOfcaluclatedTarget = caluclatedTarget.substring(0, caluclatedTarget.lastIndexOf("/"));
    await createFolderIfNotFound(app, parentFolderOfcaluclatedTarget);

    
    await app.fileManager.renameFile(attachment, caluclatedTarget);
    const renamed = app.vault.getAbstractFileByPath(caluclatedTarget);
    if (!(renamed instanceof TFile)) throw new Error("Rename succeeded but file was not found");
    return attachment;
}

/**
 * There is no built-in method to combine paths in Obsidian :(
 * This basically does "path.join"
 */
export function combinePath(file: TFile, input: string): string {

    // 1. Check if the input is meant to be relative
    // Rules: starts with "./" or "../" or is exactly ".."
    const isRelative = input.startsWith("./") || input.startsWith("../") || input === "..";

    if (!isRelative) {
        // This is an absolute path; just use it (but remove leading slash as Obsidian requires it)
        const absolutePath = input.startsWith("/") ? input.slice(1) : input;
        return normalizePath(absolutePath);
    }

    // Handle Relative Calculation
    const currentDir = file.parent?.path ?? "";
    const filename = file.name;

    // If input is just "..", user wants to move file one level up

    const adjustedInput = input === ".." ? "../" + filename : input;
    const rawPath = currentDir === "" ? adjustedInput : `${currentDir}/${adjustedInput}`;

    // Resolve stack for ".."
    const parts = rawPath.split("/");
    const stack: string[] = [];

    for (const part of parts) {
        if (part === "." || part === "") continue;
        if (part === "..") {
            stack.pop();
        } else {
            stack.push(part);
        }
    }

    return normalizePath(stack.join("/"));
}



/**
 * Returns the absolute path of the file on disk (if possible)
 */
function getFullPath(file: TFile): string | null {
    const adapter = file.vault.adapter;

    if (adapter instanceof FileSystemAdapter)
        return adapter.getFullPath(file.path);

    return null;
}


/**
 * Deletes file (either by moving to trash or permanently, depending on the deleteMethod).
 */
export async function deleteFile(app: App, deleteMethod: DeleteMethod, target: TFile): Promise<void> {

    if (deleteMethod === "immediately") {
        await app.vault.delete(target);
        return;
    }

    // Prefer system trash when available.
    try {
        await app.vault.trash(target, true);
    } catch {
        await app.vault.trash(target, false);
    }
}

/**
 * Extracts components from a given path.
 * Returns { filename, filenameWithExtension, path, extension }
 */
export function extractPathComponents(targetPath: string): { filename: string, filenameWithExtension: string, path: string, extension: string } {


    const isRooted = targetPath.startsWith("/");
    // Normalize without the leading slash so we can later reapply rootedness
    const normalized = normalizePath(isRooted ? targetPath.slice(1) : targetPath);

    var result = { filename: "", filenameWithExtension: "", path: isRooted ? "/" : "", extension: "" };
    const parts = normalized.split("/").filter(Boolean);

    if (parts.length > 0) {

        const fullFilename = parts.pop()!;
        let path = parts.join("/");

        if (isRooted)
            path = path ? "/" + path : "/";

        const lastDotIndex = fullFilename.lastIndexOf(".");

        // Handle files with no extension or hidden files (starting with dot)

        if (lastDotIndex === -1 || lastDotIndex === 0) {
            result = { filename: fullFilename, filenameWithExtension: fullFilename, path, extension: "" };
        } else {
            const filename = fullFilename.substring(0, lastDotIndex);
            const extension = fullFilename.substring(lastDotIndex + 1);

            result = { filename, filenameWithExtension: fullFilename, path, extension };
        }

    }

    return result;
}

/**
 * Creates a folder if it doesn't exist. If a file exists at the path, an error is thrown.
 */
async function createFolderIfNotFound(app: App, folderPath: string): Promise<void> {

    const path = normalizePath(folderPath);
    if (!path || path === "/") return;

    const folder = app.vault.getAbstractFileByPath(path);

    if (!folder) {
        console.log("createFolderIfNotFound(): Creating folder at " + path);
        await app.vault.createFolder(path);
    } else if (!(folder instanceof TFolder)) {
        throw new Error(`Conflict: '${path}' is a file`);
    }
}



/**
 * Finds the next free numeric value for `{number}`.
 *
 * @param currentFile The current file (used for vault access + relative path base).
 * @param suggestedFileName A path template that contains `{number}`.
 * Example: `some/folder/name_{number}.jpg`.
 *
 * @returns The next available number, or `undefined` if `{number}` is missing or none found.
 */
export function findNextFreeNumber(currentFile: TFile, suggestedFileName: string): number | undefined {

    if (!suggestedFileName.includes("{number}")) return undefined;

    const occupiedPaths = new Set<string>();
    for (const file of currentFile.vault.getFiles()) {
        if (file === currentFile) continue;

        const { path, filename } = extractPathComponents(file.path);
        occupiedPaths.add(path ? `${path}/${filename}` : filename);
    }

    const maxAttempts = 5000;
    for (let n = 1; n <= maxAttempts; n++) {
        const newFileName = combinePath(currentFile, suggestedFileName.replaceAll("{number}", String(n)));
        const { path, filename } = extractPathComponents(newFileName);
        const candidatePath = path ? `${path}/${filename}` : filename;
        if (!occupiedPaths.has(candidatePath)) return n;
    }

    return undefined;
}
