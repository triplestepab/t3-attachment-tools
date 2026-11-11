import { Menu, Notice, TFile } from "obsidian";
import { RenameFileModal } from "./renameFileModal";
import type AttachmentToolsPlugin from "./main";
import { moveAllFilesToNewLocation, moveFileToNewLocation, moveFileToTrash } from "./functions";
import { findTFileFromHTMLElement } from "./imgHelper";
import { generateFormattedPath } from "./templateHelper";


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
                console.log("Not displaying file menu for view:", view);
                return;
            }

            // Check that we right clicked a file
            const file = abstractFile instanceof TFile ? abstractFile : null;
            if (!file) {
                console.log("Skipping this item, not a file. Path=" + abstractFile?.path);
                return;
            }

            // Only display for .md files

            const extension = file.extension.toLowerCase();
            if (extension !== "md") {
                console.log("Skipping this item, not a markdown file. Path=" + file.path);
                return;
            }

            // All ok, add the menu items

            menu.addItem((item) => {
                addMenuItems("filetree", menu, plugin, file);
            });
        })
    );

    plugin.registerDomEvent(
        document,
        "contextmenu",
        (evt: MouseEvent) => {


            if (!(evt.target instanceof HTMLImageElement))
                return;

            const file = findTFileFromHTMLElement(plugin, evt.target);

            if (!file)
                return;

            // We have a right-click on a file attachment! Show our custom menu.

            evt.preventDefault();
            evt.stopImmediatePropagation();

            const menu = new Menu();
            addMenuItems("document", menu, plugin, file);
            menu.showAtMouseEvent(evt);
        },
        { capture: true } // Run before Obsidian's own context menu handler
    );
}


/**
 * The actual menu to show when right-clicking
 */
export function addMenuItems(source: "filetree" | "document", menu: Menu, plugin: AttachmentToolsPlugin, file: TFile): void {

    console.log("Adding menu items for source:", source);

    const currentDocument = source === "filetree" ? file : plugin.app.workspace.getActiveFile();
    if (!currentDocument)
        return;

    // Generate sample names

    var name1 = generateFormattedPath(currentDocument, file, plugin.settings.renamePattern1, true);
    var name2 = generateFormattedPath(currentDocument, file, plugin.settings.renamePattern2, true);
    var name3 = generateFormattedPath(currentDocument, file, plugin.settings.renamePattern3, true);
    var name4 = generateFormattedPath(currentDocument, file, plugin.settings.renamePattern4, true);

    menu.addItem((item) => {
        item.setTitle(file.name).onClick(() => {
            new RenameFileModal(plugin, file, currentDocument).open();
        });
    });

    menu.addSeparator();

    // rename single file

    if (source === "document" && plugin.settings.menuItems.objectDisplayRenameSingleFile) {

        if (plugin.settings.renamePattern1 || plugin.settings.renamePattern2 || plugin.settings.renamePattern3 || plugin.settings.renamePattern4) {
            menu.addItem((item) => {
                item.setTitle("Rename selected file").setDisabled(true);
            });
        }

        if (plugin.settings.renamePattern1) {
            menu.addItem((item) => {
                item.setTitle(name1).onClick(() => moveFileToNewLocation(plugin.app, currentDocument!, file, name1));
            });
        }

        if (plugin.settings.renamePattern2) {
            menu.addItem((item) => {
                item.setTitle(name2).onClick(() => moveFileToNewLocation(plugin.app, currentDocument!, file, name2));
            });
        }

        if (plugin.settings.renamePattern3) {
            menu.addItem((item) => {
                item.setTitle(name3).onClick(() => moveFileToNewLocation(plugin.app, currentDocument!, file, name3));
            });
        }

        if (plugin.settings.renamePattern4) {
            menu.addItem((item) => {
                item.setTitle(name4).onClick(() => moveFileToNewLocation(plugin.app, currentDocument!, file, name4));
            });
        }

    }


    // rename all

    if ((source == "document" && plugin.settings.menuItems.objectDisplayRenameAll)
    || (source == "filetree" && plugin.settings.menuItems.fileTreeDisplayRenameAll)) {


        if (plugin.settings.renamePattern1 || plugin.settings.renamePattern2 || plugin.settings.renamePattern3 || plugin.settings.renamePattern4) {

            menu.addSeparator();

            menu.addItem((item) => {
                item.setTitle("Rename all files in document").setDisabled(true);
            });
        }

        if (plugin.settings.renamePattern1) {
            menu.addItem((item) => {
                item.setTitle(name1).onClick(() => moveAllFilesToNewLocation(plugin.app, currentDocument!, plugin.settings.renamePattern1));
            });
        }

        if (plugin.settings.renamePattern2) {
            menu.addItem((item) => {
                item.setTitle(name2).onClick(() => moveAllFilesToNewLocation(plugin.app, currentDocument!, plugin.settings.renamePattern2));
            });
        }

        if (plugin.settings.renamePattern3) {
            menu.addItem((item) => {
                item.setTitle(name3).onClick(() => moveAllFilesToNewLocation(plugin.app, currentDocument!, plugin.settings.renamePattern3));
            });
        }

        if (plugin.settings.renamePattern4) {
            menu.addItem((item) => {
                item.setTitle(name4).onClick(() => moveAllFilesToNewLocation(plugin.app, currentDocument!, plugin.settings.renamePattern4));
            });
        }

    }

    // Trash file

    if (plugin.settings.menuItems.displayDelete) {

        menu.addSeparator();
        menu.addItem((item) => {
            var message = plugin.settings.deleteMethod === "immediately" ? "Delete immediately" : "Delete to trash";
            item.setTitle(message).onClick(() => {
                moveFileToTrash(plugin.app, currentDocument!, plugin.settings.deleteMethod, file);
            });
        });

    }


}

