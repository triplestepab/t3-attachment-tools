import { defineConfig } from "oxlint";

export default defineConfig({
    plugins: ["typescript", "unicorn", "oxc"],
    categories: {
        correctness: "error",
    },
    rules: {
        curly: ["off"],
        "@stylistic/curly-newline": [
            "error",
            {
                IfStatementConsequent: "always",
                IfStatementAlternative: "always",
                ForStatement: "always",
                ForInStatement: "always",
                ForOfStatement: "always",
                WhileStatement: "always",
                DoWhileStatement: "always",
                SwitchStatement: "always",
                SwitchCase: "always",
                TryStatementBlock: "always",
                TryStatementHandler: "always",
                TryStatementFinalizer: "always",
                BlockStatement: "always",
                ArrowFunctionExpression: "always",
                FunctionDeclaration: "always",
                FunctionExpression: "always",
                Property: "always",
                ClassBody: "always",
                StaticBlock: "always",
                WithStatement: "always",
                TSModuleBlock: "always",
            },
        ],
    },
    env: {
        builtin: true,
    },
    jsPlugins: ["@stylistic/eslint-plugin"],
});
