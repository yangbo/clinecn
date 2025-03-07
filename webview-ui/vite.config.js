import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// 用 vite 的 mode 功能实现了条件编译

// https://vitejs.dev/config/
/** @type {import('vite').UserConfig} */
export default defineConfig({
	plugins: [react()],
	base: '/',
	server: {
		port: 3000,
		cors: {
			// 允许所有域访问本资源
			origin: "*",
		},
		fs: {
			// 解决 codicon.tff 访问 404 问题
			strict: false
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
