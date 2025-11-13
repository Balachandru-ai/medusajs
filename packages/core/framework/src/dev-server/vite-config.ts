import path from "path"
import type { DevServerConfig } from "./types"
import { VitePluginNode } from "vite-plugin-node"

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
      target: "node",
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
    plugins: [
      hmrPlugin,
      ...VitePluginNode({
        // Nodejs native Request adapter
        // currently this plugin support 'express', 'nest', 'koa' and 'fastify' out of box,
        // you can also pass a function if you are using other frameworks, see Custom Adapter section
        adapter: "express",

        // tell the plugin where is your project entry
        appPath: config.root,

        // Optional, default: 'viteNodeApp'
        // the name of named export of you app from the appPath file
        exportName: "viteNodeApp",

        // Optional, default: false
        // if you want to init your app on boot, set this to true
        initAppOnBoot: false,

        // Optional, default: false
        // if you want to reload your app on file changes, set this to true, rebounce delay is 500ms
        //reloadAppOnFileChange: true,

        // Optional, default: 'esbuild'
        // The TypeScript compiler you want to use
        // by default this plugin is using vite default ts compiler which is esbuild
        // 'swc' compiler is supported to use as well for frameworks
        // like Nestjs (esbuild dont support 'emitDecoratorMetadata' yet)
        // you need to INSTALL `@swc/core` as dev dependency if you want to use swc
        tsCompiler: "swc",

        // Optional, default: {
        // jsc: {
        //   target: 'es2019',
        //   parser: {
        //     syntax: 'typescript',
        //     decorators: true
        //   },
        //  transform: {
        //     legacyDecorator: true,
        //     decoratorMetadata: true
        //   }
        // }
        // }
        // swc configs, see [swc doc](https://swc.rs/docs/configuration/swcrc)
        // swcOptions: {},
      }),
    ],

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
