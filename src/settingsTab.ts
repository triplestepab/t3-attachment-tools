import { App, Plugin, PluginSettingTab, Setting } from "obsidian";
import {  type AttachmentToolsSettings, type DeleteMethod } from "./settings.types";

/**
 * Extension of the base Plugin type to include specific settings properties.
 */
type SettingsHostPlugin = Plugin & {
    settings: AttachmentToolsSettings;
    saveSettings: () => Promise<void>;
};

/**
 * Interface representing a path resolution example.
 */
interface PathExample {
    pos: string;
    document?: string;
    input: string;
    res: string;
    comment: string;
}

/**
 * Interface representing a grouped set of path resolution examples.
 */
interface ExampleGroup {
    title: string;
    items: PathExample[];
}

export class AttachmentToolsSettingTab extends PluginSettingTab {
    plugin: SettingsHostPlugin;

    constructor(app: App, plugin: SettingsHostPlugin) {
        super(app, plugin);
        this.plugin = plugin;
    }


    private createTokenTable(parent: HTMLElement, title: string, tokens: string[][]): void {
        const box = parent.createDiv();
        box.style.marginBottom = "20px";
        box.createEl("h4", { text: title });

        const table = box.createEl("table");
        table.style.width = "100%";
        table.style.borderCollapse = "collapse";
        table.style.fontSize = "0.9em";

        tokens.forEach(([t, d]) => {
            const tr = table.createEl("tr");
            tr.style.borderBottom = "1px solid var(--background-modifier-border-focus)";

            const td1 = tr.createEl("td");
            const code = td1.createEl("code", { text: t });
            code.style.userSelect = "text";
            code.style.cursor = "text";

            const td2 = tr.createEl("td", { text: " — " + d });
            td2.style.color = "var(--text-muted)";
            td2.style.paddingLeft = "8px";
            td2.style.userSelect = "text";
        });
    }

    /**
     * Renders detailed path logic examples with visual callouts for results and logic comments.
     */
    private createPathLogicExamples(parent: HTMLElement): void {
        const exampleBox = parent.createDiv();
        exampleBox.createEl("h4", { text: "Path Resolution examples" });

        const groups: ExampleGroup[] = [
            {
                title: "Absolute Paths",
                items: [
                    { pos: "Foo/Bar/file.png", input: "{filename}", res: "baz.png", comment: "As no path is set, the file will be moved to the root." },
                    { pos: "Foo/Bar/file.png", input: "Bar/{filename}", res: "Bar/baz.png", comment: "Moves to a specific folder from root." },
                    { pos: "Foo/Bar/file.png", input: "/Foo/Bar/{filename}", res: "Foo/Bar/baz.png", comment: "Leading slashes are treated as absolute vault paths." },
                    { pos: "Foo/Bar/Pictures/file.png", input: "{documentpath}/{documentname}-pic-{number}.{extension}", res: "{documentname}-pic-1.png", comment: "Places the file next to the active document." },
                    { pos: "Foo/Bar/Pictures/file with spaces and numbers 123!!.png", document: "Foo/Bar/Åäö file with spaces and numbers123!!.md", input: "{documentpath}/{documentname:[\\p{L}\\p{M} ]}-{number}.{extension}", res: "Foo/Bar/Åäö file with spaces and numbers-1.png", comment: "Keeps letters from all languages, combining accents, and spaces in the document name; removes digits and punctuation. Assumes number 1 is free." },
                    { pos: "Foo/Bar/Pictures/file with spaces and numbers 123!!.png", document: "Foo/Bar/Åäö file with spaces and numbers123!!.md", input: "{documentpath}/{documentname:[a-zA-Z]}-{number}.{extension}", res: "Foo/Bar/filewithspacesandnumbers-1.png", comment: "Keeps only English letters in the document name; removes Åäö, spaces, digits, and punctuation. Assumes number 1 is free." },
                    { pos: "Foo/Bar/Pictures/file.png", input: "{documentpath}/Pictures/{lastmodified:YYYY}/{filename}", res: "{documentpath}/Pictures/2026/file.png", comment: "Move to a subfolder relative to the current document" },
                ]
            },
            {
                title: "Relative Paths",
                items: [
                    { pos: "Foo/Bar/Pictures/file.png", input: "../{filename}", res: "Foo/Bar/file.png", comment: "Keep the name and move to the parent folder." },
                    { pos: "Foo/Bar/Pictures/file.png", input: "..", res: "Foo/Bar/file.png", comment: "Shorthand to move to parent directory while keeping name." },
                    { pos: "Foo/Bar/Pictures/file.png", input: "./{name}-{number}.{extension}", res: "Foo/Bar/Pictures/file-1.png", comment: "Add a number in current directory." },
                    { pos: "Foo/Bar/Pictures/file.png", input: "./{lastmodified:YYYY}/{filename}", res: "Foo/Bar/Pictures/2026/file.png", comment: "Move to a subfolder relative the current one" },
                ]
            }
        ];

        groups.forEach((group: ExampleGroup) => {
            const groupDiv = exampleBox.createDiv();
            groupDiv.createEl("p", { text: group.title }).style.fontWeight = "bold";
            groupDiv.style.marginTop = "15px";

            group.items.forEach((item: PathExample) => {
                const wrapper = groupDiv.createDiv();
                wrapper.style.marginBottom = "12px";
                wrapper.style.paddingLeft = "12px";
                wrapper.style.borderLeft = "2px solid var(--interactive-accent)";

                // Logic Description
                const commentDiv = wrapper.createDiv();
                commentDiv.style.fontSize = "0.85em";
                commentDiv.style.fontStyle = "italic";
                commentDiv.style.color = "var(--text-accent)";
                commentDiv.style.marginBottom = "4px";
                commentDiv.createSpan({ text: `// ${item.comment}` });

                // Original Path Context
                const line1 = wrapper.createDiv();
                line1.style.fontSize = "0.8em";
                line1.style.color = "var(--text-muted)";
                line1.createSpan({ text: "Original: " + item.pos });
                if (item.document) {
                    line1.createDiv({ text: "Active document: " + item.document });
                }

                // User Input Example
                const line2 = wrapper.createDiv();
                line2.createSpan({ text: "Input: " });
                const inputCode = line2.createEl("code", { text: item.input });
                inputCode.style.userSelect = "text";
                inputCode.style.backgroundColor = "var(--background-primary-alt)";

                // Resulting Path
                const line3 = wrapper.createDiv();
                line3.createSpan({ text: "Result: " });
                const resCode = line3.createEl("code", { text: item.res });
                resCode.style.color = "var(--text-success)";
                resCode.style.fontWeight = "bold";
                resCode.style.userSelect = "text";
            });
        });
    }

    override display(): void {
        const { containerEl } = this;
        containerEl.empty();

        containerEl.createEl("h1", { text: "T3 Attachment Tools" });

        const help = containerEl.createEl("details");
        help.setAttr("open", true);
        help.createEl("summary", { text: "Help: Supported tokens & examples" });
        help.style.marginBottom = "20px";

        const helpContent = help.createDiv();
        helpContent.style.padding = "15px";
        helpContent.style.border = "1px solid var(--background-modifier-border)";
        helpContent.style.borderRadius = "8px";
        helpContent.style.backgroundColor = "var(--background-secondary)";
        helpContent.style.userSelect = "text";
        helpContent.style.webkitUserSelect = "text";

        this.createTokenTable(helpContent, "Attachment Tokens", [
            ["{name}", "Filename without extension (e.g. \"foo\")"],
            ["{name:[\\p{L}\\p{M} ]}", "Keep only letters from all languages, combining accents, and spaces (e.g. Åäö 123! → Åäö )"],
            ["{extension}", "Original extension (e.g. \"png\")"],
            ["{filename}", "Full name with extension (e.g. \"foo.png\")"],
            ["{path}", "Full path to folder (e.g. \"Bar/Baz\")"],
            ["{fullpath}", "Full path including name (e.g. \"Bar/Baz/foo.png\")"],
            ["{directoryname}", "Only the folder name (e.g. \"Baz\")"],
            ["{parentdirectoryname}", "Grandparent folder name (e.g. \"Bar\")"],
            ["{number}", "Auto-numbering if file already exists"],
            ["{date}", "Current date (YYYYMMDD)"],
            ["{time}", "Current time (HHmmss)"],
            ["{date:FORMAT}", "Custom date format (e.g. {date:YYYY-MM-DD})"],
            ["{lastmodified}", "Modification time (YYYYMMDD_HHmmss_mss)"],
            ["{lastmodified:FORMAT}", "Modification time with custom format"]
        ]);

        this.createTokenTable(helpContent, "Document Tokens (Active Note)", [
            ["{documentname}", "Active document name without extension"],
            ["{documentname:[\\p{L}\\p{M} ]}", "Keep only letters from all languages, combining accents, and spaces (e.g. Notes 123! → Notes )"],
            ["{documentextension}", "Active document extension only"],
            ["{documentfullname}", "Active document including extension"],
            ["{documentpath}", "Path of active document"]
        ]);

        this.createPathLogicExamples(helpContent);

        const helpNote = helpContent.createEl("p", {
            text: "💡 Note: Paths are absolute if they don't start with ./ or ../"
        });
        helpNote.style.color = "var(--text-warning)";
        helpNote.style.marginTop = "20px";
        helpNote.style.fontSize = "0.9em";
        helpNote.style.userSelect = "text";

        containerEl.createEl("h2", { text: "Rename patterns" });

        const renameSetting = new Setting(containerEl).setName("");
        renameSetting.infoEl.style.display = "none";
        renameSetting.controlEl.style.flex = "1";
        renameSetting.controlEl.style.flexDirection = "column";
        renameSetting.controlEl.style.alignItems = "stretch";

        const templates: (keyof AttachmentToolsSettings)[] = ['renamePattern1', 'renamePattern2', 'renamePattern3', 'renamePattern4'];
        templates.forEach((key: keyof AttachmentToolsSettings, i: number) => {
            renameSetting.addText((text) => {
                text.setPlaceholder(`Pattern ${i + 1} # Comment`)
                    .setValue(this.plugin.settings[key] as string)
                    .onChange(async (val: string) => {
                        (this.plugin.settings as any)[key] = val.trim();
                        await this.plugin.saveSettings();
                    });
                text.inputEl.style.width = "100%";
                if (i < 3) text.inputEl.style.marginBottom = "8px";
            });
        });


        // Menu items

const addCheckbox = (
    setting: Setting,
    checked: boolean,
    setChecked: (checked: boolean) => void,
): void => {
    const checkbox = setting.controlEl.createEl("input", {
        type: "checkbox",
        attr: { "aria-label": setting.nameEl.textContent ?? "" },
    });

    checkbox.checked = checked;
    checkbox.addEventListener("change", async () => {
        setChecked(checkbox.checked);
        await this.plugin.saveSettings();
    });
};

        new Setting(containerEl).
            setName("Right-click a picture inside a document")
            .setHeading()
            .setDesc("If all three boxes are unticked, the entire menu will be hidden.")
        
        addCheckbox(new Setting(containerEl).setName("Rename Single File"), this.plugin.settings.menuItems.objectDisplayRenameSingleFile, (v) => this.plugin.settings.menuItems.objectDisplayRenameSingleFile = v);
        addCheckbox(new Setting(containerEl).setName("Rename All"), this.plugin.settings.menuItems.objectDisplayRenameAll, (v) => this.plugin.settings.menuItems.objectDisplayRenameAll = v);

        new Setting(containerEl)
            .setName("Right-click a document in the file tree")
            .setHeading()

        addCheckbox(new Setting(containerEl)
            .setName("Rename all files"), this.plugin.settings.menuItems.fileTreeDisplayRenameAll, (v) => this.plugin.settings.menuItems.fileTreeDisplayRenameAll = v);


        // Trashcan

        new Setting(containerEl).
                setName("Trashcan settings")
                .setHeading()

        addCheckbox(new Setting(containerEl)
            .setName("Rename all files"), this.plugin.settings.menuItems.displayDelete, (v) => this.plugin.settings.menuItems.displayDelete = v);

        new Setting(containerEl)
            .setName("Delete Attachments")
            .setDesc("Choose how files are deleted.")
            .addDropdown((d) => d
                .addOption("immediately", "Immediately")
                .addOption("trash", "To the trashcan")
                .setValue(this.plugin.settings.deleteMethod)
                .onChange(async (v: string) => {
                    this.plugin.settings.deleteMethod = v as DeleteMethod;
                    await this.plugin.saveSettings();
                }));

    }

}
