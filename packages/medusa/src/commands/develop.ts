import { MEDUSA_CLI_PATH } from "@medusajs/framework"
import type { DevServerInstance } from "@medusajs/framework/dev-server"
import {
  ContainerRegistrationKeys,
  FeatureFlag,
} from "@medusajs/framework/utils"
import { Store } from "@medusajs/telemetry"
import boxen from "boxen"
import { ChildProcess, execSync, fork } from "child_process"
import chokidar, { FSWatcher } from "chokidar"
import { EOL } from "os"
import path from "path"
import BackendHmrFeatureFlag from "../feature-flags/backend-hmr"
import { initializeContainer } from "../loaders"
import { default as startApp } from "./start"
import { reloadResources } from "./utils/dev-server"

const defaultConfig = {
  padding: 5,
  borderColor: `blue`,
  borderStyle: `double`,
} as boxen.Options

export default async function ({ types, directory }) {
  const container = await initializeContainer(directory)
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)

  const isBackendHmrEnabled = FeatureFlag.isFeatureEnabled(
    BackendHmrFeatureFlag.key
  )

  // if (isBackendHmrEnabled) {
  //   logger.info("⚡ Backend HMR enabled (experimental) - Hot reload is active")
  //   return await startHmrDevServer({ types, directory, logger })
  // }

  // Legacy fork-based dev server
  logger.info("Using standard dev server (restart on file change)")

  const args = process.argv

  const argv =
    process.argv.indexOf("--") !== -1
      ? process.argv.slice(process.argv.indexOf("--") + 1)
      : []

  args.shift()
  args.shift()
  args.shift()

  if (types) {
    args.push("--types")
  }

  /**
   * Re-constructing the path to Medusa CLI to execute the
   * start command.
   */

  const cliPath = path.resolve(MEDUSA_CLI_PATH, "..", "..", "cli.js")

  const devServer = {
    childProcess: null as ChildProcess | null,
    watcher: null as FSWatcher | null,

    /**
     * Start the development server by forking a new process.
     *
     * We do not kill the parent process when child process dies. This is
     * because sometimes the dev server can die because of programming
     * or logical errors and we can still watch the file system and
     * restart the dev server instead of asking the user to re-run
     * the command.
     */
    async start() {
      if (isBackendHmrEnabled) {
        ;(global as any).__MEDUSA_HMR_ROUTE_REGISTRY__ = true
        await startApp({ directory })
        return
      }

      this.childProcess = fork(cliPath, ["start", ...args], {
        cwd: directory,
        env: {
          ...process.env,
          NODE_ENV: "development",
        },
        execArgv: argv,
      })
      this.childProcess.on("error", (error) => {
        // @ts-ignore
        logger.error("Dev server failed to start", error)
        logger.info("The server will restart automatically after your changes")
      })
    },

    /**
     * Restarts the development server by cleaning up the existing
     * child process and forking a new one
     */
    async restart(action, file) {
      if (isBackendHmrEnabled) {
        const absoluteFilePath = path.resolve(directory, file)
        const reloaderArguments = { action, absoluteFilePath, logger }
        await reloadResources(reloaderArguments)

        return
      }

      if (this.childProcess) {
        this.childProcess.removeAllListeners()
        if (process.platform === "win32") {
          execSync(`taskkill /PID ${this.childProcess.pid} /F /T`)
        } else {
          this.childProcess.kill("SIGINT")
        }
      }
      await this.start()
    },

    /**
     * Watches the entire file system and ignores the following files
     *
     * - Dot files
     * - node_modules
     * - dist
     * - src/admin/**
     */
    watch() {
      this.watcher = chokidar.watch(["."], {
        ignoreInitial: true,
        cwd: process.cwd(),
        ignored: [
          /(^|[\\/\\])\../,
          "node_modules",
          "dist",
          "static",
          "private",
          "src/admin/**/*",
          ".medusa/**/*",
        ],
      })

      const action = isBackendHmrEnabled ? "reloading" : "restarting"

      this.watcher.on("add", async (file) => {
        logger.info(
          `${path.relative(directory, file)} created: ${action} dev server`
        )
        await this.restart("add", file)
      })
      this.watcher.on("change", async (file) => {
        logger.info(
          `${path.relative(directory, file)} modified: ${action} dev server`
        )
        await this.restart("change", file)
      })
      this.watcher.on("unlink", async (file) => {
        logger.info(
          `${path.relative(directory, file)} removed: ${action} dev server`
        )
        await this.restart("unlink", file)
      })

      this.watcher.on("ready", function () {
        logger.info(`Watching filesystem to reload dev server on file change`)
      })
    },
  }

  process.on("SIGINT", () => {
    const configStore = new Store()
    const hasPrompted = configStore.getConfig("star.prompted") ?? false
    if (!hasPrompted) {
      const defaultMessage =
        `✨ Thanks for using Medusa. ✨${EOL}${EOL}` +
        `If you liked it, please consider starring us on GitHub${EOL}` +
        `https://medusajs.com/star${EOL}` +
        `${EOL}` +
        `Note: you will not see this message again.`

      console.log()
      console.log(boxen(defaultMessage, defaultConfig))

      configStore.setConfig("star.prompted", true)
    }
    process.exit(0)
  })

  await devServer.start()
  devServer.watch()
}

/**
 * Start the HMR-enabled dev server with Vite
 * This is used when the backend_hmr feature flag is enabled
 */
// @ts-ignore
async function startHmrDevServer({
  types,
  directory,
  logger,
}: {
  types: boolean
  directory: string
  logger: any
}) {
  let hmrServer: DevServerInstance | null = null

  try {
    // Check if Vite is installed (it's an optional peer dependency)
    try {
      require.resolve("vite")
    } catch (error) {
      logger.error(
        "Vite is required for backend HMR but is not installed. " +
          "Please install it: npm install vite@^5.4.14 --save-dev"
      )
      logger.info("Falling back to standard dev server...")
      throw new Error("Vite not installed")
    }

    const { createDevServer } = await import("@medusajs/framework/dev-server")
    const express = await import("express")
    const http = await import("http")
    const { GracefulShutdownServer } = await import("@medusajs/framework/utils")

    // Create Express app
    const app = express.default()

    const port = Number(process.env.PORT || 9000)
    const verbose = process.env.MEDUSA_HMR_VERBOSE === "true"

    // Create the Vite-powered dev server (for file watching and HMR)
    hmrServer = await createDevServer({
      root: directory,
      port,
      verbose,
      typeCheck: types,
      exclude: [
        "**/node_modules/**",
        "**/.git/**",
        "**/dist/**",
        "**/.medusa/**",
        "**/src/admin/**", // Admin has its own dev server
      ],
    })

    // Attach Express app to HMR server
    hmrServer.app = app

    // Store route registry globally so ApiLoader can access it
    // We'll use a symbol to avoid naming conflicts
    ;(global as any).__MEDUSA_HMR_ROUTE_REGISTRY__ = hmrServer.routeRegistry

    // Load Medusa app with all loaders
    const { default: loaders } = require("../loaders")
    const { shutdown: medusaShutdown, container } = await loaders({
      directory,
      expressApp: app,
    })

    if (verbose) {
      logger.info("✨ HMR Dev Server is ready")
      logger.info("   File changes will hot reload in <100ms")
      logger.info(
        "   Database connections and state will persist across reloads"
      )
      logger.warn(
        "   Note: This is experimental. Route HMR is enabled, other features may require restart."
      )
    }

    // Create HTTP server
    const host = process.env.HOST
    const http_ = http.createServer(app)

    const server = GracefulShutdownServer.create(
      http_.listen(port, host).on("listening", () => {
        logger.success(`Server is ready on port: ${port}`)
        if (process.env.NODE_ENV !== "production") {
          const configModule = container.resolve(
            ContainerRegistrationKeys.CONFIG_MODULE
          )
          const adminPath = configModule.admin.path
          if (!configModule.admin.disable) {
            logger.info(
              `Admin URL → http://${host || "localhost"}:${port}${adminPath}`
            )
          }
        }
      })
    )

    // Start the HMR watcher
    await hmrServer.start()

    // Handle graceful shutdown
    const shutdown = async () => {
      const configStore = new Store()
      const hasPrompted = configStore.getConfig("star.prompted") ?? false
      if (!hasPrompted) {
        const defaultMessage =
          `✨ Thanks for using Medusa. ✨${EOL}${EOL}` +
          `If you liked it, please consider starring us on GitHub${EOL}` +
          `https://medusajs.com/star${EOL}` +
          `${EOL}` +
          `Note: you will not see this message again.`

        console.log()
        console.log(boxen(defaultMessage, defaultConfig))

        configStore.setConfig("star.prompted", true)
      }

      logger.info("Gracefully shutting down HMR dev server...")

      if (hmrServer) {
        await hmrServer.stop()
      }
      await medusaShutdown()
      await server.shutdown()

      process.exit(0)
    }

    process.on("SIGINT", shutdown)
    process.on("SIGTERM", shutdown)
  } catch (error) {
    logger.error("Failed to start HMR dev server", error)
    logger.info("Falling back to standard dev server...")

    // Fallback to legacy dev server if HMR fails
    // This ensures users can still develop even if HMR has issues
    throw error
  }
}
