import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// 用 vite 的 mode 功能实现了条件编译

// https://vitejs.dev/config/
/** @type {import('vite').UserConfig} */
export default defineConfig({
	plugins: [react()],
	server: {
		port: 3000,
		cors: {
			origin: "*", // 允许所有域访问本资源
		}
	},
	build: {
		outDir: "build",
		rollupOptions: {
			output: {
				entryFileNames: `assets/[name].js`,
				chunkFileNames: `assets/[name].js`,
				assetFileNames: `assets/[name].[ext]`,
			},
		},
		sourcemap: true
	},
	test: {
		environment: "jsdom",
		globals: true,
		setupFiles: ["./setupTests.js"],
	},
});
