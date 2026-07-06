import tsconfigPaths from "vite-tsconfig-paths";
import { defineConfig } from "vitest/config";

export default defineConfig({
	plugins: [tsconfigPaths()],
	test: {
		environment: "node",
		include: ["src/**/*.spec.ts", "test/**/*.e2e-spec.ts"],
		coverage: {
			provider: "v8",
			reporter: ["text", "lcov"],
		},
	},
});
