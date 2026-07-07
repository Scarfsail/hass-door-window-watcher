import { defineConfig } from "vite";

export default defineConfig(({ mode }) => {
    const isProduction = mode === 'production';
    return {
        build: {
            lib: {
                entry: "./config-editor/panel.ts",
                formats: ["es"],
                fileName: () => "door-window-watcher-panel.js",
            },
            emptyOutDir: false,
            outDir: '../custom_components/door_window_watcher/frontend_compiled',
            assetsDir: "compiled",
            sourcemap: !isProduction,
            minify: isProduction,
            rollupOptions: {
                external: [
                    "@home-assistant/frontend/src/components/ha-entity-picker",
                    /^@home-assistant\/frontend/,
                ],
            },
        },
        define: {
            "process.env.NODE_ENV": JSON.stringify(isProduction ? "production" : "development"),
        }
    }
});
