import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// 用 vite 的 mode 功能替代

// function replaceDevPlugin(options) {
// 	return {
// 		name: 'replaceDev',
// 		enforce: 'pre',
// 		transform(code, id) {
// 			const dev_regexp = /IS_DEV *= *true/g;
// 			if (id.endsWith('.tsx') && code.match(dev_regexp)) {
// 				console.log(`替换了 ${id} 中的 IS_DEV = true`);
// 				code = code.replace(dev_regexp, 'IS_DEV = false');
// 				let sourcemap = this.getCombinedSourcemap();
// 				console.log(sourcemap)
// 				sourcemap.sourcesContent[0] = sourcemap.sourcesContent[0].replace(dev_regexp, 'IS_DEV = false');
// 				return {
// 					code: code,
// 					map: sourcemap
// 				};
// 			}
// 			return null;
// 		},
// 	};
// }

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
