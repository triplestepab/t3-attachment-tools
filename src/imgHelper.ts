import { Notice, TFile } from "obsidian";
import { getFullVaultPath } from "./fsHelper";
import type AttachmentToolsPlugin from "./main";

export function findTFileFromHTMLElement(plugin: AttachmentToolsPlugin, target: HTMLElement): TFile | undefined {

    var pictureRelativePath = getRelativePathFromHTMLElement(plugin, target);
    if (!pictureRelativePath)
        return undefined;

    const file = plugin.app.vault.getAbstractFileByPath(pictureRelativePath);

    if (file instanceof TFile) {
        console.log("findTFileFromHTMLElement(): Success! Found TFile:", file.path);
        return file;
    } else {
        new Notice(`Please refresh, could not find file '${pictureRelativePath}'`);
        console.log("findTFileFromHTMLElement(): Failed to find TFile for path:", pictureRelativePath, target);
    }
}

function getRelativePathFromHTMLElement(plugin: AttachmentToolsPlugin, target: HTMLElement) {

    // Try data-path first (this is exposed in the file tree if you click between the name and the extension)

    var dataPath = target.getAttribute('data-path'); // This is already relative
    if (dataPath) {
        console.log("getRelativePath(): Found data-path attribute, using it:", dataPath);
        return dataPath;
    }

    // Fallback to src attribute of img element (this is exposed in the markdown preview)

    const imgElement = target.closest('img');
    const src = imgElement?.getAttribute('src');

    if (!src) {
        console.log("No picture found (img -> src attribute is empty)");
        return undefined;
    }

    // Decode and normalize the path to NFC form (to avoid issues with different unicode representations)

    const pathWithoutProtocol = src.replace(/^app:\/\/[\w-]+\//, "");
    var pictureFullPath = decodeURIComponent(pathWithoutProtocol).split('?')[0].trim();
    pictureFullPath = pictureFullPath.normalize('NFC');

    // Make it relative to vault path

    var fullVaultPath = getFullVaultPath(plugin); // full OS path without the leading /
    if (!pictureFullPath.startsWith(fullVaultPath)) {
        console.log("Picture path does not start with vault system path");
        console.log("Expected vault path: " + fullVaultPath);
        console.log("Picture path: " + pictureFullPath);
        return undefined;
    }

    var result = pictureFullPath.substring(fullVaultPath.length).substring(1);
    return result;
}




