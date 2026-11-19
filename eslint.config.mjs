import { defineConfig, globalIgnores } from "eslint/config";
import obsidianmd from "eslint-plugin-obsidianmd";

export default defineConfig([
    // Oxlint checks build tooling; ESLint checks plugin source and metadata.
    globalIgnores([
        "node_modules/",
        "dist/",
        "bin/",
        "main.js",
        "esbuild.config.mjs",
        "oxfmt.config.ts",
        "oxlint.config.ts",
    ]),
    ...obsidianmd.configs.recommended,
    {
        files: ["src/**/*.ts"],
        languageOptions: {
            parserOptions: {
                projectService: true,
                tsconfigRootDir: import.meta.dirname,
            },
        },
    },
]);
