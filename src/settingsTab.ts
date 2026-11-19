import {
    App,
    Plugin,
    PluginSettingTab,
    type SettingDefinition,
    type SettingDefinitionItem,
} from "obsidian";

import type { Template } from "./fsHelper.ts";

import { type AttachmentToolsSettings } from "./settings.types.ts";
import { generateFormattedPath, validateTemplate } from "./templateHelper.ts";

const renamePatternKeys = [
    "renamePattern1",
    "renamePattern2",
    "renamePattern3",
    "renamePattern4",
] as const;

const menuItemKeys = [
    "displayDelete",
    "fileTreeDisplayRenameAll",
    "objectDisplayRenameSingleFile",
    "objectDisplayRenameAll",
] as const;

type MenuItemKey = (typeof menuItemKeys)[number];
type SettingKey = (typeof renamePatternKeys)[number] | MenuItemKey | "deleteMethod";

function isMenuItemKey(key: string): key is MenuItemKey {
    return menuItemKeys.some((menuItemKey) => menuItemKey === key);
}

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
        box.addClass("t3-attachment-tools-token-section");
        box.createEl("b", { text: title });

        const table = box.createEl("table");
        table.addClass("t3-attachment-tools-token-table");

        tokens.forEach(([t, d]) => {
            const tr = table.createEl("tr");
            tr.addClass("t3-attachment-tools-token-row");

            const td1 = tr.createEl("td");
            const code = td1.createEl("code", { text: t });
            code.addClass("t3-attachment-tools-token-name");

            const td2 = tr.createEl("td", { text: " — " + d });
            td2.addClass("t3-attachment-tools-token-description");
        });
    }

    /**
     * Renders detailed path logic examples with visual callouts for results and logic comments.
     */
    private createPathLogicExamples(parent: HTMLElement): void {
        const exampleBox = parent.createDiv();
        exampleBox.createEl("b", { text: "Path Resolution examples" });

        const groups: ExampleGroup[] = [
            {
                title: "Absolute Paths",
                items: [
                    {
                        pos: "Foo/Bar/file.png",
                        input: "{filename}",
                        res: "baz.png",
                        comment: "As no path is set, the file will be moved to the root.",
                    },
                    {
                        pos: "Foo/Bar/file.png",
                        input: "Bar/{filename}",
                        res: "Bar/baz.png",
                        comment: "Moves to a specific folder from root.",
                    },
                    {
                        pos: "Foo/Bar/file.png",
                        input: "/Foo/Bar/{filename}",
                        res: "Foo/Bar/baz.png",
                        comment: "Leading slashes are treated as absolute vault paths.",
                    },
                    {
                        pos: "Foo/Bar/Pictures/file.png",
                        input: "{documentpath}/{documentname}-pic-{number}.{extension}",
                        res: "{documentname}-pic-1.png",
                        comment: "Places the file next to the active document.",
                    },
                    {
                        pos: "Foo/Bar/Pictures/file with spaces and numbers 123!!.png",
                        document: "Foo/Bar/Åäö file with spaces and numbers123!!.md",
                        input: "{documentpath}/{documentname:[\\p{L}\\p{M} ]}-{number}.{extension}",
                        res: "Foo/Bar/Åäö file with spaces and numbers-1.png",
                        comment:
                            "Keeps letters from all languages, combining accents, and spaces in the document name; removes digits and punctuation. Assumes number 1 is free.",
                    },
                    {
                        pos: "Foo/Bar/Pictures/file with spaces and numbers 123!!.png",
                        document: "Foo/Bar/Åäö file with spaces and numbers123!!.md",
                        input: "{documentpath}/{documentname:[a-zA-Z]}-{number}.{extension}",
                        res: "Foo/Bar/filewithspacesandnumbers-1.png",
                        comment:
                            "Keeps only English letters in the document name; removes Åäö, spaces, digits, and punctuation. Assumes number 1 is free.",
                    },
                    {
                        pos: "Foo/Bar/Pictures/file.png",
                        input: "{documentpath}/Pictures/{lastmodified:YYYY}/{filename}",
                        res: "{documentpath}/Pictures/2026/file.png",
                        comment: "Move to a subfolder relative to the current document",
                    },
                ],
            },
            {
                title: "Relative Paths",
                items: [
                    {
                        pos: "Foo/Bar/Pictures/file.png",
                        input: "../{filename}",
                        res: "Foo/Bar/file.png",
                        comment: "Keep the name and move to the parent folder.",
                    },
                    {
                        pos: "Foo/Bar/Pictures/file.png",
                        input: "..",
                        res: "Foo/Bar/file.png",
                        comment: "Shorthand to move to parent directory while keeping name.",
                    },
                    {
                        pos: "Foo/Bar/Pictures/file.png",
                        input: "./{name}-{number}.{extension}",
                        res: "Foo/Bar/Pictures/file-1.png",
                        comment: "Add a number in current directory.",
                    },
                    {
                        pos: "Foo/Bar/Pictures/file.png",
                        input: "./{lastmodified:YYYY}/{filename}",
                        res: "Foo/Bar/Pictures/2026/file.png",
                        comment: "Move to a subfolder relative the current one",
                    },
                ],
            },
        ];

        groups.forEach((group: ExampleGroup) => {
            const groupDiv = exampleBox.createDiv();
            groupDiv
                .createEl("p", { text: group.title })
                .addClass("t3-attachment-tools-example-heading");
            groupDiv.addClass("t3-attachment-tools-example-group");

            group.items.forEach((item: PathExample) => {
                const wrapper = groupDiv.createDiv();
                wrapper.addClass("t3-attachment-tools-example");

                // Logic Description
                const commentDiv = wrapper.createDiv();
                commentDiv.addClass("t3-attachment-tools-example-comment");
                commentDiv.createSpan({ text: `// ${item.comment}` });

                // Original Path Context
                const line1 = wrapper.createDiv();
                line1.addClass("t3-attachment-tools-example-context");
                line1.createSpan({ text: "Original: " + item.pos });
                if (item.document) {
                    line1.createDiv({ text: "Active document: " + item.document });
                }

                // User Input Example
                const line2 = wrapper.createDiv();
                line2.createSpan({ text: "Input: " });
                const inputCode = line2.createEl("code", { text: item.input });
                inputCode.addClass("t3-attachment-tools-example-input");

                // Resulting Path
                const line3 = wrapper.createDiv();
                line3.createSpan({ text: "Result: " });
                const resCode = line3.createEl("code", { text: item.res });
                resCode.addClass("t3-attachment-tools-example-result");
            });
        });
    }

    // Menu controls bind to the existing nested data without changing saved settings.
    override getControlValue(key: string): unknown {
        if (isMenuItemKey(key)) return this.plugin.settings.menuItems[key];
        return super.getControlValue(key);
    }

    override async setControlValue(key: string, value: unknown): Promise<void> {
        if (isMenuItemKey(key)) {
            if (typeof value !== "boolean") return;
            this.plugin.settings.menuItems[key] = value;
            await this.plugin.saveSettings();
            return;
        }

        // Preserve the trimming previously applied when editing rename patterns.
        const isPattern = renamePatternKeys.some((patternKey) => patternKey === key);
        await super.setControlValue(
            key,
            isPattern && typeof value === "string" ? value.trim() : value,
        );
    }

    private validatePattern(value: string): string {
        const pattern = value.trim() as Template;
        if (!pattern) return "✅ Disabled (empty pattern).";

        const file = this.app.workspace.getActiveFile();
        if (!file) return "❌ Open a file to preview this pattern.";

        try {
            const valid = validateTemplate(file, file, pattern);
            const result = generateFormattedPath(file, file, pattern, false);
            return `${valid ? "✅" : "❌"} ${result}`;
        } catch (error) {
            return `❌ ${error instanceof Error ? error.message : "Could not render this pattern."}`;
        }
    }

    override getSettingDefinitions(): SettingDefinitionItem<SettingKey>[] {
        const help = createFragment((fragment) => {
            const helpContent = fragment.createDiv({ cls: "t3-attachment-tools-help-content" });

            this.createTokenTable(helpContent, "Attachment Tokens", [
                ["{name}", 'Filename without extension (e.g. "foo")'],
                [
                    "{name:[\\p{L}\\p{M} ]}",
                    "Keep only letters from all languages, combining accents, and spaces (e.g. Åäö 123! → Åäö )",
                ],
                ["{extension}", 'Original extension (e.g. "png")'],
                ["{filename}", 'Full name with extension (e.g. "foo.png")'],
                ["{path}", 'Full path to folder (e.g. "Bar/Baz")'],
                ["{fullpath}", 'Full path including name (e.g. "Bar/Baz/foo.png")'],
                ["{directoryname}", 'Only the folder name (e.g. "Baz")'],
                ["{parentdirectoryname}", 'Grandparent folder name (e.g. "Bar")'],
                ["{number}", "Auto-numbering if file already exists"],
                ["{date}", "Current date (YYYYMMDD)"],
                ["{time}", "Current time (HHmmss)"],
                ["{date:FORMAT}", "Custom date format (e.g. {date:YYYY-MM-DD})"],
                ["{lastmodified}", "Modification time (YYYYMMDD_HHmmss_mss)"],
                ["{lastmodified:FORMAT}", "Modification time with custom format"],
            ]);

            this.createTokenTable(helpContent, "Document Tokens (Active Note)", [
                ["{documentname}", "Active document name without extension"],
                [
                    "{documentname:[\\p{L}\\p{M} ]}",
                    "Keep only letters from all languages, combining accents, and spaces (e.g. Notes 123! → Notes )",
                ],
                ["{documentextension}", "Active document extension only"],
                ["{documentfullname}", "Active document including extension"],
                ["{documentpath}", "Path of active document"],
            ]);

            this.createPathLogicExamples(helpContent);

            const helpNote = helpContent.createEl("p", {
                text: "💡 Note: Paths are absolute if they don't start with ./ or ../",
            });
            helpNote.addClass("t3-attachment-tools-help-note");
        });

        return [
            {
                name: "Supported tokens and path examples",
                desc: help,
            },
            {
                type: "group",
                heading: "Rename patterns",
                cls: "t3-attachment-tools-rename-patterns",
                items: renamePatternKeys.flatMap<SettingDefinition<SettingKey>>((key, index) => {
                    const resultEl = createDiv({
                        attr: { "aria-live": "polite", role: "status" },
                    });

                    return [
                        {
                            name: `Rename pattern ${index + 1}`,
                            desc: "Use tokens to name and move attachments. Leave empty to hide this pattern from the menu.",
                            control: {
                                type: "textarea",
                                key,
                                rows: 3,
                                placeholder: `Pattern ${index + 1} # Comment`,
                                validate: (value: string) =>
                                    resultEl?.setText(this.validatePattern(value)),
                            },
                        },
                        {
                            name: "",
                            searchable: false,
                            render: (setting) => {
                                setting.settingEl.addClass("t3-attachment-tools-pattern-result");
                                setting.descEl.appendChild(resultEl);
                            },
                        },
                    ];
                }),
            },
            {
                type: "group",
                heading: "Right-click a picture inside a document",
                items: [
                    {
                        name: "Rename single file",
                        desc: "Show the rename action for the selected attachment.",
                        control: { type: "toggle", key: "objectDisplayRenameSingleFile" },
                    },
                    {
                        name: "Rename all",
                        desc: "Show the action to rename all attachments in the document.",
                        control: { type: "toggle", key: "objectDisplayRenameAll" },
                    },
                ],
            },
            {
                type: "group",
                heading: "Right-click a document in the file tree",
                items: [
                    {
                        name: "Rename all files",
                        desc: "Show the action to rename all attachments in the selected document.",
                        control: { type: "toggle", key: "fileTreeDisplayRenameAll" },
                    },
                ],
            },
            {
                type: "group",
                heading: "Trashcan",
                items: [
                    {
                        name: "Show delete attachment action",
                        desc: "Show the delete action when right-clicking an attachment.",
                        control: { type: "toggle", key: "displayDelete" },
                    },
                    {
                        name: "Delete attachments",
                        desc: "Choose how files are deleted.",
                        control: {
                            type: "dropdown",
                            key: "deleteMethod",
                            options: {
                                immediately: "Immediately",
                                trash: "To the trashcan",
                            },
                        },
                    },
                ],
            },
        ];
    }
}
