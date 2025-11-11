import path from "path"
import type { DevServerConfig } from "./types"

// Use any types for Vite to avoid build-time dependency
type InlineConfig = any
type Plugin = any

/**
 * Node.js built-in modules that should be externalized
 */
const NODE_BUILTINS = [
  "assert",
  "buffer",
  "child_process",
  "cluster",
  "crypto",
  "dgram",
  "dns",
  "events",
  "fs",
  "http",
  "https",
  "net",
  "os",
  "path",
  "punycode",
  "querystring",
  "readline",
  "stream",
  "string_decoder",
  "tls",
  "tty",
  "url",
  "util",
  "v8",
  "vm",
  "zlib",
]

/**
 * Create Vite configuration for backend SSR mode
 */
export async function createViteConfig(
  config: DevServerConfig,
  hmrPlugin: Plugin
): Promise<InlineConfig> {
  const { searchForWorkspaceRoot } = await import("vite")

  return {
    root: config.root,
    mode: "development",

    // Enable SSR mode for backend
    ssr: {
      // External all Node.js built-ins
      external: NODE_BUILTINS,
      // Don't bundle node_modules - load them directly
      noExternal: false,
      // Resolve conditions for Node.js
      resolve: {
        conditions: ["node"],
        externalConditions: ["node"],
      },
    },

    // Build configuration (not used in dev, but good to have)
    build: {
      ssr: true,
      sourcemap: true,
      target: "node18",
      outDir: path.resolve(config.root, ".medusa/server"),
    },

    // Resolve configuration
    resolve: {
      // Resolve TypeScript and JavaScript files
      extensions: [".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs"],
      // Allow absolute imports from src
      alias: {
        "@src": path.resolve(config.root, "src"),
      },
    },

    // Server configuration
    server: {
      // File system access
      fs: {
        allow: [searchForWorkspaceRoot(config.root)],
      },
      // Watch configuration
      watch: {
        // Ignore common directories
        ignored: [
          "**/node_modules/**",
          "**/.git/**",
          "**/dist/**",
          "**/.medusa/**",
          "**/src/admin/**", // Admin has its own dev server
          ...(config.exclude || []),
        ],
      },
      // Disable HMR client (we're not in a browser)
      hmr: false,
    },

    // Optimization
    optimizeDeps: {
      // Don't pre-bundle anything in SSR mode
      disabled: true,
    },

    // Enable source maps for debugging
    esbuild: {
      sourcemap: true,
      target: "node18",
    },

    // Plugins
    plugins: [hmrPlugin],

    // Logging
    logLevel: config.verbose ? "info" : "warn",

    // Clear screen on reload
    clearScreen: false,
  }
}

/**
 * Check if a module should be externalized (not bundled)
 * In SSR mode, we want to external most things and load them directly from node_modules
 */
export function isExternal(id: string): boolean {
  // External Node.js built-ins
  if (NODE_BUILTINS.includes(id)) {
    return true
  }

  // External node_modules except for specific ones we want to transform
  if (id.includes("node_modules")) {
    // We might want to allow some modules to be transformed
    // For example, ESM-only packages that need transpilation
    return true
  }

  return false
}
