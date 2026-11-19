import { Menu, TFile } from "obsidian";

import type AttachmentToolsPlugin from "./main.ts";

import { moveAllFilesToNewLocation, moveFileToNewLocation, moveFileToTrash } from "./functions.ts";
import { findTFileFromHTMLElement } from "./imgHelper.ts";
import { RenameFileModal } from "./renameFileModal.ts";
import { generatePreview } from "./templateHelper.ts";

/**
 * Register a context menu.
 * This event is fired when right clicking:
 * 1. On an empty area in a document
 * 2. On an image (in a document or in the file tree)
 * 3. On an document (in the file tree)
 * .. and probably more places :)
 */
export function registerImageContextMenu(plugin: AttachmentToolsPlugin): void {
    plugin.registerEvent(
        plugin.app.workspace.on("file-menu", (menu, abstractFile, view) => {
            // Ensure we right clicked in the file tree

            if (view !== "file-explorer-context-menu") {
                console.debug("Not displaying file menu for view:", view);
                return;
            }

            // Check that we right clicked a file
            const file = abstractFile instanceof TFile ? abstractFile : null;
            if (!file) {
                console.debug("Skipping this item, not a file. Path=" + abstractFile?.path);
                return;
            }

            // Only display for .md files

            const extension = file.extension.toLowerCase();
            if (extension !== "md") {
                console.debug("Skipping this item, not a markdown file. Path=" + file.path);
                return;
            }

            // All ok, add the menu items

            menu.addItem(() => {
                addMenuItems("filetree", menu, plugin, file);
            });
        }),
    );

    plugin.registerDomEvent(
        activeDocument,
        "contextmenu",
        (evt: MouseEvent) => {
            // Only pictures are supported for now

            const file = evt.targetNode?.instanceOf(HTMLImageElement)
                ? findTFileFromHTMLElement(plugin, evt.targetNode)
                : null;

            // Nothing found?

            if (!file) return;

            // We have a right-click on a file attachment! Show our custom menu.

            evt.preventDefault();
            evt.stopImmediatePropagation();

            const menu = new Menu();
            addMenuItems("document", menu, plugin, file);
            menu.showAtMouseEvent(evt);
        },
        { capture: true }, // Run before Obsidian's own context menu handler
    );
}

/**
 * The actual menu to show when right-clicking
 */
export function addMenuItems(
    source: "filetree" | "document",
    menu: Menu,
    plugin: AttachmentToolsPlugin,
    file: TFile,
): void {
    console.debug("Adding menu items for source:", source);

    const currentDocument = source === "filetree" ? file : plugin.app.workspace.getActiveFile();
    if (!currentDocument) return;

    // Generate sample names

    const name1 = generatePreview(currentDocument, file, plugin.settings.renamePattern1);
    const name2 = generatePreview(currentDocument, file, plugin.settings.renamePattern2);
    const name3 = generatePreview(currentDocument, file, plugin.settings.renamePattern3);
    const name4 = generatePreview(currentDocument, file, plugin.settings.renamePattern4);

    menu.addItem((item) => {
        item.setTitle(file.name).onClick(() => {
            new RenameFileModal(plugin, file, currentDocument).open();
        });
    });

    menu.addSeparator();

    // rename single file

    if (source === "document" && plugin.settings.menuItems.objectDisplayRenameSingleFile) {
        if (
            plugin.settings.renamePattern1 ||
            plugin.settings.renamePattern2 ||
            plugin.settings.renamePattern3 ||
            plugin.settings.renamePattern4
        ) {
            menu.addItem((item) => {
                item.setTitle("Rename selected file").setDisabled(true);
            });
        }

        if (plugin.settings.renamePattern1) {
            menu.addItem((item) => {
                item.setTitle(name1).onClick(() =>
                    moveFileToNewLocation(plugin.app, currentDocument, file, name1),
                );
            });
        }

        if (plugin.settings.renamePattern2) {
            menu.addItem((item) => {
                item.setTitle(name2).onClick(() =>
                    moveFileToNewLocation(plugin.app, currentDocument, file, name2),
                );
            });
        }

        if (plugin.settings.renamePattern3) {
            menu.addItem((item) => {
                item.setTitle(name3).onClick(() =>
                    moveFileToNewLocation(plugin.app, currentDocument, file, name3),
                );
            });
        }

        if (plugin.settings.renamePattern4) {
            menu.addItem((item) => {
                item.setTitle(name4).onClick(() =>
                    moveFileToNewLocation(plugin.app, currentDocument, file, name4),
                );
            });
        }
    }

    // rename all

    if (
        (source == "document" && plugin.settings.menuItems.objectDisplayRenameAll) ||
        (source == "filetree" && plugin.settings.menuItems.fileTreeDisplayRenameAll)
    ) {
        if (
            plugin.settings.renamePattern1 ||
            plugin.settings.renamePattern2 ||
            plugin.settings.renamePattern3 ||
            plugin.settings.renamePattern4
        ) {
            menu.addSeparator();

            menu.addItem((item) => {
                item.setTitle("Rename all files in document").setDisabled(true);
            });
        }

        if (plugin.settings.renamePattern1) {
            menu.addItem((item) => {
                item.setTitle(name1).onClick(() =>
                    moveAllFilesToNewLocation(
                        plugin.app,
                        currentDocument,
                        plugin.settings.renamePattern1,
                    ),
                );
            });
        }

        if (plugin.settings.renamePattern2) {
            menu.addItem((item) => {
                item.setTitle(name2).onClick(() =>
                    moveAllFilesToNewLocation(
                        plugin.app,
                        currentDocument,
                        plugin.settings.renamePattern2,
                    ),
                );
            });
        }

        if (plugin.settings.renamePattern3) {
            menu.addItem((item) => {
                item.setTitle(name3).onClick(() =>
                    moveAllFilesToNewLocation(
                        plugin.app,
                        currentDocument,
                        plugin.settings.renamePattern3,
                    ),
                );
            });
        }

        if (plugin.settings.renamePattern4) {
            menu.addItem((item) => {
                item.setTitle(name4).onClick(() =>
                    moveAllFilesToNewLocation(
                        plugin.app,
                        currentDocument,
                        plugin.settings.renamePattern4,
                    ),
                );
            });
        }
    }

    // Trash file

    if (plugin.settings.menuItems.displayDelete) {
        menu.addSeparator();
        menu.addItem((item) => {
            let message =
                plugin.settings.deleteMethod === "immediately"
                    ? "Delete immediately"
                    : "Delete to trash";
            item.setTitle(message).onClick(async () => {
                await moveFileToTrash(
                    plugin.app,
                    currentDocument,
                    plugin.settings.deleteMethod,
                    file,
                );
            });
        });
    }
}
