import { defineConfig } from "oxfmt";

export default defineConfig({
    ignorePatterns: ["*", "!*/", "!*.ts", "!*.tsx", "!*.css"],
    tabWidth: 4,
    bracketSameLine: true,
    sortImports: {
        groups: [
            "type-import",
            ["value-builtin", "value-external"],
            "type-internal",
            "value-internal",
            ["type-parent", "type-sibling", "type-index"],
            ["value-parent", "value-sibling", "value-index"],
            "unknown",
        ],
    },
});
