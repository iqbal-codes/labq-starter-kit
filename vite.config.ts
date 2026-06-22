import { defineConfig } from "vite-plus";

const ignorePatterns = [
  "**/.next/**",
  "**/dist/**",
  "**/.nx/**",
  "**/dev-dist/**",
  "**/.zed/**",
  "**/.vscode/**",
  "**/routeTree.gen.ts",
  "**/src-tauri/**",
  "**/.nuxt/**",
  "bts.jsonc",
  "**/.expo/**",
  "**/.wrangler/**",
  "**/.alchemy/**",
  "**/.svelte-kit/**",
  "**/wrangler.jsonc",
  "**/.source/**",
  "**/convex/_generated/**",
  ".agents/**",
  "docs/**",
  "e2e/.auth/**",
  ".claude/**",
];

export default defineConfig({
  staged: {
    "*": "vp check --fix",
  },
  fmt: {
    ignorePatterns,
    tabWidth: 2,
    useTabs: false,
    singleQuote: false,
  },
  lint: {
    ignorePatterns,
    jsPlugins: [{ name: "vite-plus", specifier: "vite-plus/oxlint-plugin" }],
    rules: {
      "vite-plus/prefer-vite-plus-imports": "error",
    },
    options: {
      typeAware: true,
      typeCheck: true,
    },
  },
  test: {
    include: [
      "apps/**/*.{test,spec}.{ts,tsx}",
      "packages/**/*.{test,spec}.{ts,tsx}",
      "packages/**/src/test.ts",
      "e2e/*.test.ts",
    ],
    exclude: [
      "**/node_modules/**",
      "**/.next/**",
      "**/dist/**",
      "**/.astro/**",
      "**/*.e2e.{ts,tsx}",
      "e2e/*.spec.ts",
      "e2e/*.setup.ts",
    ],
  },
});
