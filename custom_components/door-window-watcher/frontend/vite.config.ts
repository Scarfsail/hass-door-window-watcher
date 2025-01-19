import { defineConfig } from "vite";
//import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const isProduction = mode === 'production';
    return {
       // root: 'src',
        build: {
            lib: {
                entry: "./src/panel.ts",
                formats: ["es"],
                fileName: () => `door-window-watcher-panel-${isProduction ? "prod" : "dev"}.js`, // Force .js extension                
            },
            emptyOutDir: false,
            // Relative to the root
            outDir: './dist',
            assetsDir: "compiled",
            sourcemap: !isProduction, // Enable source maps in development mode
            minify: isProduction, // Minify only in production mode
            rollupOptions: {
                // Use a regex or string array to mark modules as external
                external: [
                  // Either a specific path:
                  "@home-assistant/frontend/src/components/ha-entity-picker",
          
                  // Or a more general regex to match anything starting with @home-assistant/frontend
                  /^@home-assistant\/frontend/,
                ],
              },            
        },
        /*
        esbuild: {
            legalComments: "none",
        },*/
        plugins: [
            //react(),
        ],
        define: {
            "process.env.NODE_ENV": JSON.stringify(isProduction ? "production" : "development"),
        }
    }
});
