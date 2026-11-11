import esbuild from "esbuild";

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
    logLevel: "info"
});

if (isWatch) {
    await context.watch();
    console.log("Watching... (esbuild)");
} else {
    await context.rebuild();
    await context.dispose();
}
