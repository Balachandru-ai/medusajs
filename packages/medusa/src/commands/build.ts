import { Compiler, ModuleTracer } from "@medusajs/framework/build-tools"
import {
  ContainerRegistrationKeys,
  dynamicImport,
} from "@medusajs/framework/utils"
import { existsSync } from "fs"
import path from "path"
import { initializeContainer } from "../loaders"

export default async function build({
  directory,
  adminOnly,
  production,
  trace,
  bundle,
  traceTimeout,
}: {
  directory: string
  adminOnly: boolean
  production?: boolean
  trace?: boolean
  bundle?: boolean
  traceTimeout?: number
}) {
  process.argv.splice(process.argv.indexOf("--trace"), 1)
  process.argv.splice(process.argv.indexOf("--production"), 1)
  process.argv.splice(process.argv.indexOf("--bundle"), 1)

  const container = await initializeContainer(directory, {
    skipDbConnection: true,
  })
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)

  // Handle trace mode
  if (production && trace) {
    logger.info("Starting trace mode...")
    logger.info("Loading application to trace all module dependencies")

    const tracer = new ModuleTracer(directory, logger)

    // Start tracing BEFORE any imports
    tracer.start()

    try {
      // Build admin
      if (!adminOnly) {
        const compiler = new Compiler(directory, logger)
        const tsConfig = await compiler.loadTSConfigFile()
        if (tsConfig) {
          const bundler = await import("@medusajs/admin-bundler")
          await compiler.buildAppFrontend(adminOnly, tsConfig, bundler)
        }
      }

      // Load the application directly (don't use start command to avoid forking)
      const express = (await import("express")).default
      const app = express()

      logger.info("Initializing loaders to trace dependencies...")

      // Import loaders - need to resolve absolute path
      process.env.NODE_ENV = "development"
      const loadersPath = path.join(__dirname, "../loaders/index.js")
      const loaders = await dynamicImport(loadersPath)
      // Call the default export function directly
      const loaderFn = loaders.default as any
      await loaderFn({
        directory,
        expressApp: app,
        skipLoadingEntryPoints: false, // We want to load everything
      })

      logger.info("✓ Application loaded successfully")
    } catch (error) {
      logger.warn(`Error during trace: ${error.message}`)
      logger.warn(`Stack trace: ${error.stack}`)
      logger.warn("Continuing with partial trace...")
    }

    // Stop tracing and save manifest
    const manifestPath = path.join(directory, ".medusa", "build-manifest.json")
    const tracedCount = tracer.stop(manifestPath)

    logger.info(`✓ Trace complete! Found ${tracedCount} modules`)
    logger.info(`Manifest saved to: .medusa/build-manifest.json`)
    logger.info(
      `Next step: Run 'medusa build --production --bundle' to create bundle`
    )

    process.exit(0)
  }

  // Handle bundle mode
  if (production && bundle) {
    const manifestPath = path.join(directory, ".medusa", "build-manifest.json")

    if (!existsSync(manifestPath)) {
      logger.error(
        "Manifest not found! Run 'medusa build --production --trace' first"
      )
      process.exit(1)
    }

    logger.info("Building from trace manifest...")
    const compiler = new Compiler(directory, logger)
    const success = await compiler.buildAppBackendFromManifest(manifestPath)

    if (!success) {
      logger.error("Bundle build failed")
      process.exit(1)
    }

    // Build admin
    if (!adminOnly) {
      const tsConfig = await compiler.loadTSConfigFile()
      if (tsConfig) {
        const bundler = await import("@medusajs/admin-bundler")
        await compiler.buildAppFrontend(adminOnly, tsConfig, bundler)
      }
    }

    logger.info("✓ Production bundle complete!")
    logger.info("Run 'medusa start' from .medusa/server directory")
    process.exit(0)
  }

  // Standard build (development or production without trace/bundle)
  logger.info(`Starting build${production ? " (production mode)" : ""}...`)
  const compiler = new Compiler(directory, logger)

  const tsConfig = await compiler.loadTSConfigFile()
  if (!tsConfig) {
    logger.error("Unable to compile application")
    process.exit(1)
  }

  const promises: Promise<boolean>[] = []
  if (!adminOnly) {
    if (production) {
      promises.push(compiler.buildAppBackendProduction(tsConfig))
    } else {
      promises.push(compiler.buildAppBackend(tsConfig))
    }
  }

  const bundler = await import("@medusajs/admin-bundler")
  promises.push(compiler.buildAppFrontend(adminOnly, tsConfig, bundler))
  const responses = await Promise.all(promises)

  if (responses.every((response) => response === true)) {
    process.exit(0)
  } else {
    process.exit(1)
  }
}
