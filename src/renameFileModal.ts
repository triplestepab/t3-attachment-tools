import { Modal, TFile } from "obsidian";
import type AttachmentToolsPlugin from "./main";
import { moveFileToNewLocation } from "./functions";
import { generateFormattedPath } from "./templateHelper";
import { extractPathComponents } from "./fsHelper";
export class RenameFileModal extends Modal {

    private readonly currentDocument: TFile;

    private readonly attachment: TFile;
    private inputEl?: HTMLInputElement;
    private previewEl1?: HTMLDivElement;
    private previewEl2?: HTMLDivElement;

    constructor(plugin: AttachmentToolsPlugin, file: TFile, currentDocument: TFile) {
        super(plugin.app);
        this.attachment = file;
        this.currentDocument = currentDocument;
    }

    override onOpen(): void {

        if (!this.currentDocument) {
            console.log("No current document")
            return;
        }

        const { contentEl } = this;
        contentEl.empty();

        contentEl.createEl("h3", { text: "Rename file" });
        contentEl.createEl("div", { text: `${this.attachment.path} (it's possible to use templates here)`, cls: "setting-item-description" });

        const input = contentEl.createEl("input", {
            type: "text",
            value: "./" + this.attachment.name,
        });
        input.style.width = "100%";
        this.inputEl = input;

        this.previewEl1 = contentEl.createEl("div", { cls: "setting-item-description" });
        this.previewEl2 = contentEl.createEl("div", { cls: "setting-item-description" });
        this.updatePreview();

        input.addEventListener("input", () => {
            this.updatePreview();
        });

        input.addEventListener("keydown", (e) => {
            if (e.key === "Enter") {
                e.preventDefault();
                void this.submit();
            }
        });

        const buttonRow = contentEl.createDiv({ cls: "modal-button-container" });
        const cancelBtn = buttonRow.createEl("button", { text: "Cancel" });
        const renameBtn = buttonRow.createEl("button", { text: "Rename" });

        renameBtn.addEventListener("click", () => void this.submit());
        cancelBtn.addEventListener("click", () => this.close());

        setTimeout(() => {
            input.focus();
            const start = 2;    // ./
            const end = start + this.attachment.basename.length;
            input.setSelectionRange(start, end);
        }, 0);
    }

    private async submit(): Promise<void> {
        const value = (this.inputEl?.value ?? "").trim();
        var success = await moveFileToNewLocation(this.app, this.currentDocument, this.attachment, value);
        if (success)
            this.close();

    }

    override onClose(): void {
        this.contentEl.empty();
    }

    private updatePreview(): void {

        const formatted = generateFormattedPath(this.currentDocument, this.attachment, this.inputEl?.value ?? "");
        var pieces = extractPathComponents(formatted);
        this.previewEl1?.setText(pieces.path ? `Path: ${pieces.path}` : "");
        this.previewEl2?.setText(pieces.filenameWithExtension ? `Name: ${pieces.filenameWithExtension}` : "");
    }
}
