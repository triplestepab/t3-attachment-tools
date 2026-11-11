import { type TFile, normalizePath } from "obsidian";
import { findNextFreeNumber, extractPathComponents } from "./fsHelper";

const TOKEN_REGEX = /\{((?:\\[pP]\{[^}]+\}|\\.|\{[^{}]*\}|[^\\{}])*)\}/gi;

/**
 * Formats a rename template against a file and returns the resulting path.
 */
export function generateFormattedPath(currentDocument: TFile, picture: TFile, formatTo: string, isPreview = false): string {

    if (!formatTo) return picture.path;

    // Log debug output if the picture includes the name "debug" :)
    // We might have clicked a picture directly in the file explorer OR a picture in the markdown preview.

    if (picture.name.includes("debug")) {
        console.log(`generateFormattedPath()`);
        if (currentDocument.path !== picture.path)
            console.log(`--- markdown=${currentDocument.path}`);
        console.log(`--- picture =${picture.path}`);
        console.log(`--- Template=${formatTo}`);
    }

    // Rooted paths needs to be temporarily disabled

    const rooted = formatTo.startsWith("/");
    let result = rooted ? formatTo.slice(1) : formatTo;

    // Replace all strings from the template

    const now = new Date();
    const lastModified = new Date(picture.stat.mtime);

    // Debug output

    if (picture.name.includes("debug"))
        console.log('Tokens to process: [' + (result.match(TOKEN_REGEX) ?? []).join(', ') + ']');

    // Replace each token, one by one

    result = result.replace(TOKEN_REGEX, (match, _key) => {

        let replacement = match;
        replacement = formatDate(replacement, now);
        replacement = formatLastModified(replacement, lastModified, isPreview);
        replacement = formatPathItems(picture, replacement, currentDocument, isPreview);

        return replacement;
    });

    // Incremental numbers are left to process 

    if (result.includes("{number}") && isPreview==false) {
        const nextNumber = findNextFreeNumber(picture, result);
        result = result.replaceAll("{number}", String(nextNumber ?? ""));
    }

    // Do som final cleanup

    const normalized = normalizePath(result);
    result = rooted ? `/${normalized}` : normalized;

    // debug logging

    if (picture.name.includes("debug"))
        console.log(`--- Result=${result}`);

    return result;
}

function formatDate(tokenMatch: string, now: Date): string {
    const key = tokenMatch.slice(1, -1);

    if (key === "date" || key === "yyyymmdd") return formatWithMask(now, "YYYYMMDD");
    if (key === "time") return formatWithMask(now, "HHmmss");
    if (key === "ms") return String(now.getTime());
    if (key.startsWith("date:")) return formatWithMask(now, key.slice(5));

    return tokenMatch;
}

function formatLastModified(tokenMatch: string, lastModified: Date, isPreview ): string {
    const key = tokenMatch.slice(1, -1);

    if (isPreview && key.startsWith("lastmodified"))
        return "{lastmodified}";

    if (key === "lastmodified") return formatWithMask(lastModified, "YYYYMMDD_HHmmss");
    if (key.startsWith("lastmodified:")) return formatWithMask(lastModified, key.slice(13));

    return tokenMatch;
}

function formatPathItems(file: TFile, findAndReplace: string, documentFile?: TFile, isPreview = false): string {

    const key = findAndReplace.slice(1, -1); // remove leading { and trailing }

    if (key.startsWith("name:") || key.startsWith("documentname:")) {
        const separator = key.indexOf(":");
        const value = key.startsWith("name:") ? file.basename : (documentFile?.basename ?? "");
        const pattern = new RegExp(key.slice(separator + 1), "gu");
        return value.match(pattern)?.join("") ?? "";
    }

    switch (key) {
        case "directoryname": {
            const parts = extractPathComponents(file.path).path.split("/").filter(Boolean);
            return parts.length > 0 ? parts[parts.length - 1] : "";
        }
        case "parentdirectoryname": {
            const parts = extractPathComponents(file.path).path.split("/").filter(Boolean);
            return parts.length > 1 ? parts[parts.length - 2] : "";
        }
        case "name":
            return file.basename;
        case "ext":
            return isPreview ? "{ext}" : (file.extension ?? "");
        case "extension":
            return isPreview ? "{ext}" : (file.extension ?? "");
        case "filename":
            return file.name;
        case "fullpath":
            return file.path;
        case "path":
            return extractPathComponents(file.path).path;
        case "documentname":
            return documentFile?.basename ?? "";
        case "documentextension":
            return documentFile?.extension ?? "";
        case "documentfullname":
            return documentFile?.name ?? "";
        case "documentpath":
            return documentFile ? extractPathComponents(documentFile.path).path : "";
        default:
            return findAndReplace;
    }
}

function formatWithMask(date: Date, mask: string): string {

    const d: Record<string, string> = {
        "YYYY": String(date.getFullYear()),
        "YY": String(date.getFullYear()).slice(-2),
        "MM": String(date.getMonth() + 1).padStart(2, "0"),
        "DD": String(date.getDate()).padStart(2, "0"),
        "HH": String(date.getHours()).padStart(2, "0"),
        "mm": String(date.getMinutes()).padStart(2, "0"),
        "ss": String(date.getSeconds()).padStart(2, "0"),
        "SSS": String(date.getMilliseconds()).padStart(3, "0"),
    };

    let out = mask;
    for (const k in d) {
        out = out.split(k).join(d[k]);
    }
    return out;
}

