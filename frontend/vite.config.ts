import { defineConfig } from "vite";

export default defineConfig(({ mode }) => {
    const isProduction = mode === 'production';
    return {
        build: {
            lib: {
                entry: "./cards/door-window-watcher-card.ts",
                formats: ["es"],
                fileName: () => "door-window-watcher-card.js",
            },
            emptyOutDir: false,
            outDir: '../custom_components/door_window_watcher/frontend_compiled',
            assetsDir: "compiled",
            sourcemap: !isProduction,
            minify: isProduction,
        },
        define: {
            "process.env.NODE_ENV": JSON.stringify(isProduction ? "production" : "development"),
        }
    }
});
