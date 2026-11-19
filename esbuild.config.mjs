import esbuild from "esbuild";
import { execFileSync } from "node:child_process";

const isWatch = process.argv.includes("--watch");

const context = await esbuild.context({
    entryPoints: ["src/main.ts"],
    bundle: true,
    format: "cjs",
    platform: "browser",
    target: "es2020",
    outfile: "main.js",
    sourcemap: true,
    external: ["obsidian"],
    logLevel: "info",
    plugins: [{
        name: "oxfmt",
        setup(build) {
            build.onStart(() => {
                execFileSync(process.execPath, ["node_modules/oxfmt/bin/oxfmt", "src"], {
                    stdio: "inherit",
                });
            });
        },
    }],
});

if (isWatch) {
    await context.watch();
    console.log("Watching... (esbuild)");
} else {
    await context.rebuild();
    await context.dispose();
}
