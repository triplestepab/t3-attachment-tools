import { Notice, TFile } from "obsidian";

import type AttachmentToolsPlugin from "./main.ts";

import { getFullVaultPath } from "./fsHelper.ts";

export function findTFileFromHTMLElement(
    plugin: AttachmentToolsPlugin,
    target: HTMLElement,
): TFile | undefined {
    const pictureRelativePath = getRelativePathFromHTMLElement(plugin, target);
    if (!pictureRelativePath) return undefined;

    const file = plugin.app.vault.getAbstractFileByPath(pictureRelativePath);

    if (file instanceof TFile) {
        console.debug("findTFileFromHTMLElement(): Success! Found TFile:", file.path);
        return file;
    } else {
        new Notice(`Please refresh, could not find file '${pictureRelativePath}'`);
        console.debug(
            "findTFileFromHTMLElement(): Failed to find TFile for path:",
            pictureRelativePath,
            target,
        );
    }
}

function getRelativePathFromHTMLElement(plugin: AttachmentToolsPlugin, target: HTMLElement) {
    // Try data-path first (this is exposed in the file tree if you click between the name and the extension)

    const dataPath = target.getAttribute("data-path"); // This is already relative
    if (dataPath) {
        console.debug("getRelativePath(): Found data-path attribute, using it:", dataPath);
        return dataPath;
    }

    // Fallback to src attribute of img element (this is exposed in the markdown preview)

    const imgElement = target.closest("img");
    const src = imgElement?.getAttribute("src");

    if (!src) {
        console.debug("No picture found (img -> src attribute is empty)");
        return undefined;
    }

    // Decode and normalize the path to NFC form (to avoid issues with different unicode representations)

    const pathWithoutProtocol = src.replace(/^app:\/\/[\w-]+\//, "");
    let pictureFullPath = decodeURIComponent(pathWithoutProtocol).split("?")[0].trim();
    pictureFullPath = pictureFullPath.normalize("NFC");

    // Make it relative to vault path

    const fullVaultPath = getFullVaultPath(plugin); // full OS path without the leading /
    if (!pictureFullPath.startsWith(fullVaultPath)) {
        console.debug("Picture path does not start with vault system path");
        console.debug("Expected vault path: " + fullVaultPath);
        console.debug("Picture path: " + pictureFullPath);
        return undefined;
    }

    const result = pictureFullPath.substring(fullVaultPath.length).substring(1);
    return result;
}
