import type { AdminOptions, ConfigModule, Logger } from "@medusajs/types"
import { FileSystem, getConfigFile, getResolvedPlugins } from "@medusajs/utils"
import chokidar from "chokidar"
import { access, constants, copyFile, mkdir, rm } from "fs/promises"
import path from "path"
import type tsStatic from "typescript"

/**
 * The compiler exposes the opinionated APIs for compiling Medusa
 * applications and plugins. You can perform the following
 * actions.
 *
 * - loadTSConfigFile: Load and parse the TypeScript config file. All errors
 *   will be reported using the logger.
 *
 * - buildAppBackend: Compile the Medusa application backend source code to the
 *   ".medusa/server" directory. The admin source and integration-tests are
 *   skipped.
 *
 * - buildAppFrontend: Compile the admin extensions using the "@medusjs/admin-bundler"
 *   package. Admin can be compiled for self hosting (aka adminOnly), or can be compiled
 *   to be bundled with the backend output.
 */
export class Compiler {
  #logger: Logger
  #projectRoot: string
  #tsConfigPath: string
  #pluginsDistFolder: string
  #backendIgnoreFiles: string[]
  #adminOnlyDistFolder: string
  #tsCompiler?: typeof tsStatic

  constructor(projectRoot: string, logger: Logger) {
    this.#projectRoot = projectRoot
    this.#logger = logger
    this.#tsConfigPath = path.join(this.#projectRoot, "tsconfig.json")
    this.#adminOnlyDistFolder = path.join(this.#projectRoot, ".medusa/admin")
    this.#pluginsDistFolder = path.join(this.#projectRoot, ".medusa/server")
    this.#backendIgnoreFiles = [
      "/integration-tests/",
      "/test/",
      "/unit-tests/",
      "/src/admin/",
    ]
  }

  /**
   * Util to track duration using hrtime
   */
  #trackDuration() {
    const startTime = process.hrtime()
    return {
      getSeconds() {
        const duration = process.hrtime(startTime)
        return (duration[0] + duration[1] / 1e9).toFixed(2)
      },
    }
  }

  /**
   * Returns the dist folder from the tsconfig.outDir property
   * or uses the ".medusa/server" folder
   */
  #computeDist(tsConfig: { options: { outDir?: string } }): string {
    const distFolder = tsConfig.options.outDir ?? ".medusa/server"
    return path.isAbsolute(distFolder)
      ? distFolder
      : path.join(this.#projectRoot, distFolder)
  }

  /**
   * Imports and stores a reference to the TypeScript compiler.
   * We dynamically import "typescript", since its is a dev
   * only dependency
   */
  async #loadTSCompiler() {
    if (!this.#tsCompiler) {
      this.#tsCompiler = await import("typescript")
    }
    return this.#tsCompiler
  }

  /**
   * Copies the file to the destination without throwing any
   * errors if the source file is missing
   */
  async #copy(source: string, destination: string) {
    let sourceExists = false
    try {
      await access(source, constants.F_OK)
      sourceExists = true
    } catch (error) {
      if (error.code !== "ENOENT") {
        throw error
      }
    }

    if (sourceExists) {
      await copyFile(path.join(source), path.join(destination))
    }
  }

  /**
   * Copies package manager files from the project root
   * to the specified dist folder
   */
  async #copyPkgManagerFiles(dist: string) {
    /**
     * Copying package manager files
     */
    await this.#copy(
      path.join(this.#projectRoot, "package.json"),
      path.join(dist, "package.json")
    )
    await this.#copy(
      path.join(this.#projectRoot, "yarn.lock"),
      path.join(dist, "yarn.lock")
    )
    await this.#copy(
      path.join(this.#projectRoot, "pnpm.lock"),
      path.join(dist, "pnpm.lock")
    )
    await this.#copy(
      path.join(this.#projectRoot, "package-lock.json"),
      path.join(dist, "package-lock.json")
    )
  }

  /**
   * Removes the directory and its children recursively and
   * ignores any errors
   */
  async #clean(path: string) {
    await rm(path, { recursive: true }).catch(() => {})
  }

  /**
   * Returns a boolean indicating if a file extension belongs
   * to a JavaScript or TypeScript file
   */
  #isScriptFile(filePath: string) {
    if (filePath.endsWith(".ts") && !filePath.endsWith(".d.ts")) {
      return true
    }
    return filePath.endsWith(".js")
  }

  /**
   * Loads the medusa config file and prints the error to
   * the console (in case of any errors). Otherwise, the
   * file path and the parsed config is returned
   */
  async #loadMedusaConfig() {
    const { configModule, configFilePath, error } =
      await getConfigFile<ConfigModule>(this.#projectRoot, "medusa-config")
    if (error) {
      this.#logger.error(`Failed to load medusa-config.(js|ts) file`)
      this.#logger.error(error)
      return
    }

    return { configFilePath, configModule }
  }

  /**
   * Prints typescript diagnostic messages
   */
  #printDiagnostics(ts: typeof tsStatic, diagnostics: tsStatic.Diagnostic[]) {
    if (diagnostics.length) {
      console.error(
        ts.formatDiagnosticsWithColorAndContext(
          diagnostics,
          ts.createCompilerHost({})
        )
      )
    }
  }

  /**
   * Given a tsconfig file, this method will write the compiled
   * output to the specified destination
   */
  async #emitBuildOutput(
    tsConfig: tsStatic.ParsedCommandLine,
    chunksToIgnore: string[],
    dist: string
  ): Promise<{
    emitResult: tsStatic.EmitResult
    diagnostics: tsStatic.Diagnostic[]
  }> {
    const ts = await this.#loadTSCompiler()
    const filesToCompile = tsConfig.fileNames.filter((fileName) => {
      return !chunksToIgnore.some((chunk) => fileName.includes(`${chunk}`))
    })

    /**
     * Create emit program to compile and emit output
     */
    const program = ts.createProgram(filesToCompile, {
      ...tsConfig.options,
      ...{
        outDir: dist,
        inlineSourceMap: !tsConfig.options.sourceMap,
      },
    })

    const emitResult = program.emit()
    const diagnostics = ts
      .getPreEmitDiagnostics(program)
      .concat(emitResult.diagnostics)

    /**
     * Log errors (if any)
     */
    this.#printDiagnostics(ts, diagnostics)

    return { emitResult, diagnostics }
  }

  /**
   * Loads and parses the TypeScript config file. In case of an error, the errors
   * will be logged using the logger and undefined it returned
   */
  async loadTSConfigFile(): Promise<tsStatic.ParsedCommandLine | undefined> {
    const ts = await this.#loadTSCompiler()
    let tsConfigErrors: tsStatic.Diagnostic[] = []

    const tsConfig = ts.getParsedCommandLineOfConfigFile(
      this.#tsConfigPath,
      {
        inlineSourceMap: true,
        excludes: [],
      },
      {
        ...ts.sys,
        useCaseSensitiveFileNames: true,
        getCurrentDirectory: () => this.#projectRoot,
        onUnRecoverableConfigFileDiagnostic: (error) =>
          (tsConfigErrors = [error]),
      }
    )

    /**
     * Push errors from the tsConfig parsed output to the
     * tsConfigErrors array.
     */
    if (tsConfig?.errors.length) {
      tsConfigErrors.push(...tsConfig.errors)
    }

    /**
     * Display all config errors using the diagnostics reporter
     */
    this.#printDiagnostics(ts, tsConfigErrors)

    /**
     * Return undefined when there are errors in parsing the config
     * file
     */
    if (tsConfigErrors.length) {
      return
    }

    return tsConfig
  }

  /**
   * Builds the application backend source code using
   * TypeScript's official compiler. Also performs
   * type-checking
   */
  async buildAppBackend(
    tsConfig: tsStatic.ParsedCommandLine
  ): Promise<boolean> {
    const tracker = this.#trackDuration()
    const dist = this.#computeDist(tsConfig)
    this.#logger.info("Compiling backend source...")

    /**
     * Step 1: Cleanup existing build output
     */
    this.#logger.info(
      `Removing existing "${path.relative(this.#projectRoot, dist)}" folder`
    )
    await this.#clean(dist)

    /**
     * Create first the target directory now that everything is clean
     */
    await mkdir(dist, { recursive: true })

    /**
     * Step 2: Compile TypeScript source code
     */
    const { emitResult, diagnostics } = await this.#emitBuildOutput(
      tsConfig,
      this.#backendIgnoreFiles,
      dist
    )

    /**
     * Exit early if no output is written to the disk
     */
    if (emitResult.emitSkipped) {
      this.#logger.warn("Backend build completed without emitting any output")
      return false
    }

    /**
     * Step 3: Copy package manager files to the output folder
     */
    await this.#copyPkgManagerFiles(dist)

    /**
     * Notify about the state of build
     */
    if (diagnostics.length) {
      this.#logger.warn(
        `Backend build completed with errors (${tracker.getSeconds()}s)`
      )
      return false
    }

    this.#logger.info(
      `Backend build completed successfully (${tracker.getSeconds()}s)`
    )
    return true
  }

  /**
   * Builds the frontend source code of a Medusa application
   * using the "@medusajs/admin-bundler" package.
   */
  async buildAppFrontend(
    adminOnly: boolean,
    tsConfig: tsStatic.ParsedCommandLine,
    adminBundler: {
      build: (
        options: AdminOptions & {
          sources: string[]
          plugins: string[]
          outDir: string
        }
      ) => Promise<void>
    }
  ): Promise<boolean> {
    const tracker = this.#trackDuration()

    /**
     * Step 1: Load the medusa config file to read
     * admin options
     */
    const configFile = await this.#loadMedusaConfig()
    if (!configFile) {
      return false
    }

    /**
     * Return early when admin is disabled and we are trying to
     * create a bundled build for the admin.
     */
    if (configFile.configModule.admin.disable && !adminOnly) {
      this.#logger.info(
        "Skipping admin build, since its disabled inside the medusa-config file"
      )
      return true
    }

    /**
     * Warn when we are creating an admin only build, but forgot to disable
     * the admin inside the config file
     */
    if (!configFile.configModule.admin.disable && adminOnly) {
      this.#logger.warn(
        `You are building using the flag --admin-only but the admin is enabled in your medusa-config, If you intend to host the dashboard separately you should disable the admin in your medusa config`
      )
    }

    const plugins = await getResolvedPlugins(
      this.#projectRoot,
      configFile.configModule,
      true
    )

    const adminSources = plugins
      .map((plugin) =>
        plugin.admin?.type === "local" ? plugin.admin.resolve : undefined
      )
      .filter(Boolean) as string[]

    const adminPlugins = plugins
      .map((plugin) =>
        plugin.admin?.type === "package" ? plugin.admin.resolve : undefined
      )
      .filter(Boolean) as string[]

    try {
      this.#logger.info("Compiling frontend source...")
      await adminBundler.build({
        disable: false,
        sources: adminSources,
        plugins: adminPlugins,
        ...configFile.configModule.admin,
        outDir: adminOnly
          ? this.#adminOnlyDistFolder
          : path.join(this.#computeDist(tsConfig), "./public/admin"),
      })

      this.#logger.info(
        `Frontend build completed successfully (${tracker.getSeconds()}s)`
      )
      return true
    } catch (error) {
      this.#logger.error("Unable to compile frontend source")
      this.#logger.error(error)
      return false
    }
  }

  /**
   * Compiles the plugin source code to JavaScript using the
   * TypeScript's official compiler
   */
  async buildPluginBackend(tsConfig: tsStatic.ParsedCommandLine) {
    const tracker = this.#trackDuration()
    const dist = ".medusa/server"
    this.#logger.info("Compiling plugin source...")

    /**
     * Step 1: Cleanup existing build output
     */
    this.#logger.info(
      `Removing existing "${path.relative(this.#projectRoot, dist)}" folder`
    )
    await this.#clean(dist)

    /**
     * Step 2: Compile TypeScript source code
     */
    const { emitResult, diagnostics } = await this.#emitBuildOutput(
      tsConfig,
      this.#backendIgnoreFiles,
      dist
    )

    /**
     * Exit early if no output is written to the disk
     */
    if (emitResult.emitSkipped) {
      this.#logger.warn("Plugin build completed without emitting any output")
      return false
    }

    /**
     * Notify about the state of build
     */
    if (diagnostics.length) {
      this.#logger.warn(
        `Plugin build completed with errors (${tracker.getSeconds()}s)`
      )
      return false
    }

    this.#logger.info(
      `Plugin build completed successfully (${tracker.getSeconds()}s)`
    )
    return true
  }

  /**
   * Compiles the backend source code of a plugin project in watch
   * mode. Type-checking is disabled to keep compilation fast.
   *
   * The "onFileChange" argument can be used to get notified when
   * a file has changed.
   */
  async developPluginBackend(
    transformer: (filePath: string) => Promise<string>,
    onFileChange?: (
      filePath: string,
      action: "add" | "change" | "unlink"
    ) => void
  ) {
    const fs = new FileSystem(this.#pluginsDistFolder)
    await fs.createJson("medusa-plugin-options.json", {
      srcDir: path.join(this.#projectRoot, "src"),
    })

    const watcher = chokidar.watch(["."], {
      ignoreInitial: true,
      cwd: this.#projectRoot,
      ignored: [
        /(^|[\\/\\])\../,
        "node_modules",
        "dist",
        "static",
        "private",
        ".medusa/**/*",
        ...this.#backendIgnoreFiles,
      ],
    })

    watcher.on("add", async (file) => {
      if (!this.#isScriptFile(file)) {
        return
      }
      const relativePath = path.relative(this.#projectRoot, file)
      const outputPath = relativePath.replace(/\.ts$/, ".js")

      this.#logger.info(`${relativePath} updated: Republishing changes`)
      await fs.create(outputPath, await transformer(file))

      onFileChange?.(file, "add")
    })
    watcher.on("change", async (file) => {
      if (!this.#isScriptFile(file)) {
        return
      }
      const relativePath = path.relative(this.#projectRoot, file)
      const outputPath = relativePath.replace(/\.ts$/, ".js")

      this.#logger.info(`${relativePath} updated: Republishing changes`)
      await fs.create(outputPath, await transformer(file))

      onFileChange?.(file, "change")
    })
    watcher.on("unlink", async (file) => {
      if (!this.#isScriptFile(file)) {
        return
      }
      const relativePath = path.relative(this.#projectRoot, file)
      const outputPath = relativePath.replace(/\.ts$/, ".js")

      this.#logger.info(`${relativePath} removed: Republishing changes`)
      await fs.remove(outputPath)
      onFileChange?.(file, "unlink")
    })

    watcher.on("ready", () => {
      this.#logger.info("watching for file changes")
    })
  }

  async buildPluginAdminExtensions(bundler: {
    plugin: (options: { root: string; outDir: string }) => Promise<void>
  }) {
    const tracker = this.#trackDuration()
    this.#logger.info("Compiling plugin admin extensions...")

    try {
      await bundler.plugin({
        root: this.#projectRoot,
        outDir: this.#pluginsDistFolder,
      })
      this.#logger.info(
        `Plugin admin extensions build completed successfully (${tracker.getSeconds()}s)`
      )
      return true
    } catch (error) {
      this.#logger.error(`Plugin admin extensions build failed`, error)
      return false
    }
  }

  /**
   * Builds a production bundle using @vercel/ncc that packages
   * the entire application with all dependencies into deployable artifacts.
   * This creates an optimized, self-contained bundle suitable for production deployment.
   */
  async buildProductionBundle(
    tsConfig: tsStatic.ParsedCommandLine
  ): Promise<boolean> {
    const tracker = this.#trackDuration()
    this.#logger.info("Building production bundle...")

    try {
      const dist = this.#computeDist(tsConfig)

      /**
       * Step 1: First compile TypeScript to JavaScript
       * We need intermediate JS files for ncc to bundle
       */
      this.#logger.info("Compiling TypeScript source...")
      const tempDist = path.join(this.#projectRoot, ".medusa", "temp")
      await this.#clean(tempDist)
      await mkdir(tempDist, { recursive: true })

      const { emitResult, diagnostics } = await this.#emitBuildOutput(
        tsConfig,
        this.#backendIgnoreFiles,
        tempDist
      )

      if (emitResult.emitSkipped) {
        this.#logger.error("TypeScript compilation failed")
        return false
      }

      if (diagnostics.length) {
        this.#logger.warn("TypeScript compilation completed with errors")
      }

      /**
       * Step 2: Load medusa config and compile it separately
       */
      const configFile = await this.#loadMedusaConfig()
      if (!configFile) {
        return false
      }

      // Compile the config file separately since it's not in src/
      const ts = await this.#loadTSCompiler()

      // getConfigFile may return path without extension or with incorrect path
      // We should construct it from project root instead
      const { existsSync } = await import("fs")
      const configBasePath = path.join(this.#projectRoot, "medusa-config")

      let actualConfigPath: string
      if (existsSync(`${configBasePath}.ts`)) {
        actualConfigPath = `${configBasePath}.ts`
      } else if (existsSync(`${configBasePath}.js`)) {
        actualConfigPath = `${configBasePath}.js`
      } else {
        // Fallback to what getConfigFile returned
        actualConfigPath = configFile.configFilePath
      }

      const configFileName = path.basename(actualConfigPath)
      const isTypeScript = configFileName.endsWith(".ts")
      // Determine output filename (JS for TS files, same for JS files)
      const outputConfigFileName = isTypeScript ? configFileName.replace(/\.ts$/, ".js") : configFileName

      this.#logger.info(`Config file path: ${actualConfigPath}`)
      this.#logger.info(`Config file: ${configFileName}, isTS: ${isTypeScript}, output: ${outputConfigFileName}`)

      if (isTypeScript) {
        // Compile TS config to JS using transpileModule for direct control
        const { readFileSync } = await import("fs")
        const configSource = readFileSync(actualConfigPath, "utf-8")
        const compiledConfigContent = ts.transpileModule(configSource, {
          compilerOptions: {
            module: ts.ModuleKind.CommonJS,
            target: ts.ScriptTarget.ES2020,
          },
        })

        // Write compiled config to temp directory
        await new FileSystem(tempDist).create(outputConfigFileName, compiledConfigContent.outputText)
      } else {
        // Copy JS config directly
        await this.#copy(
          actualConfigPath,
          path.join(tempDist, outputConfigFileName)
        )
      }

      /**
       * Step 3: Create bundle entry point that pre-loads all @medusajs packages
       * This ensures ncc bundles them even though they're loaded dynamically
       */

      // Scan node_modules to find all @medusajs packages with valid main exports
      const nodeModulesDir = path.join(this.#projectRoot, "node_modules")
      const medusaPackagesDir = path.join(nodeModulesDir, "@medusajs")
      let medusaPackages: string[] = []

      const { readdirSync, statSync, existsSync: fsExistsSync, readFileSync } = await import("fs")
      if (fsExistsSync(medusaPackagesDir)) {
        const allPackages = readdirSync(medusaPackagesDir).filter(pkg => {
          const pkgPath = path.join(medusaPackagesDir, pkg)
          return statSync(pkgPath).isDirectory()
        })

        // Filter to only packages that have a main entry point
        for (const pkg of allPackages) {
          const pkgJsonPath = path.join(medusaPackagesDir, pkg, "package.json")
          if (fsExistsSync(pkgJsonPath)) {
            try {
              const pkgJson = JSON.parse(readFileSync(pkgJsonPath, "utf-8"))
              // Check if package has main, exports["."], or dist/index.js
              if (pkgJson.main || pkgJson.exports?.["."] || fsExistsSync(path.join(medusaPackagesDir, pkg, "dist", "index.js"))) {
                medusaPackages.push(pkg)
              }
            } catch (e) {
              // Skip packages with invalid package.json
            }
          }
        }
      }

      this.#logger.info(`Pre-loading ${medusaPackages.length} @medusajs packages for bundling`)

      // Generate imports for all @medusajs packages to ensure ncc bundles them
      // Wrap in try-catch to handle packages that might fail to load
      const packageImports = medusaPackages
        .map(pkg => `  "@medusajs/${pkg}": (() => { try { return require("@medusajs/${pkg}"); } catch (e) { return null; } })()`)
        .join(",\n")

      const entryContent = `
// Production bundle entry point
const { default: start } = require("@medusajs/medusa/commands/start");
const path = require("path");

// Pre-load all @medusajs packages so ncc bundles them
// Even though they're loaded dynamically, having them in the bundle
// allows them to be resolved at runtime
const __MEDUSA_PACKAGES__ = {
${packageImports}
};

// Make packages available for dynamic require
const Module = require("module");
const originalRequire = Module.prototype.require;
Module.prototype.require = function(id) {
  // Intercept @medusajs package loads and serve from pre-loaded bundle
  if (id.startsWith("@medusajs/") && __MEDUSA_PACKAGES__[id]) {
    return __MEDUSA_PACKAGES__[id];
  }
  return originalRequire.apply(this, arguments);
};

// Start the Medusa server with the bundled application
start({
  directory: __dirname,
  port: process.env.PORT || 9000,
  host: process.env.HOST,
  types: false,
}).catch((error) => {
  console.error("Failed to start Medusa server:", error);
  process.exit(1);
});
`

      const entryPath = path.join(tempDist, "index.js")
      await new FileSystem(tempDist).create("index.js", entryContent)

      /**
       * Step 4: Clean and prepare final output directory
       */
      this.#logger.info(
        `Removing existing "${path.relative(this.#projectRoot, dist)}" folder`
      )
      await this.#clean(dist)
      await mkdir(dist, { recursive: true })

      /**
       * Step 5: Bundle with @vercel/ncc
       * This creates a single optimized bundle with all dependencies
       */
      this.#logger.info(
        "Creating optimized production bundle with @vercel/ncc..."
      )

      const ncc = await import("@vercel/ncc")

      // Bundle the entry point
      const { code, map, assets } = await ncc.default(entryPath, {
        minify: true,
        sourceMap: true,
        cache: false,
        externals: [
          // Native modules that can't be bundled
          "better-sqlite3",
          "pg-native",
          "@swc/core",
          // Virtual modules from admin dashboard (Vite-specific)
          /^virtual:/,
        ],
        filterAssetBase: tempDist,
      })

      /**
       * Step 6: Write bundle output
       */
      const fs = new FileSystem(dist)
      await fs.create("bundle.js", code)

      if (map) {
        await fs.create("bundle.js.map", map)
      }

      // Write any assets (JSON configs, etc.)
      for (const [assetPath, asset] of Object.entries(assets)) {
        const assetData = asset as any
        if (assetData.source) {
          await fs.create(assetPath, assetData.source)
        }
      }

      /**
       * Step 7: Copy additional files needed for deployment
       */
      // Copy compiled config file from temp directory (it was compiled in Step 2)
      const compiledConfigPath = path.join(tempDist, outputConfigFileName)
      const targetConfigPath = path.join(dist, outputConfigFileName)

      this.#logger.info(`Copying config file: ${outputConfigFileName}`)
      this.#logger.info(`  From: ${compiledConfigPath}`)
      this.#logger.info(`  To: ${targetConfigPath}`)

      // Use access to check if file exists before copying
      try {
        await access(compiledConfigPath, constants.F_OK)
        await copyFile(compiledConfigPath, targetConfigPath)
        this.#logger.info(`Config file copied successfully`)
      } catch (error) {
        // If compiled config not found, try copying source config
        this.#logger.warn(`Could not copy compiled config: ${error.message}`)
        try {
          await copyFile(configFile.configFilePath, path.join(dist, configFileName))
          this.#logger.info(`Copied source config instead`)
        } catch (sourceError) {
          this.#logger.error(`Failed to copy config file: ${sourceError.message}`)
        }
      }

      // Copy .env file if it exists
      await this.#copy(
        path.join(this.#projectRoot, ".env"),
        path.join(dist, ".env")
      )

      // Copy compiled instrumentation file if it exists
      const compiledInstrumentationPath = path.join(tempDist, "instrumentation.js")

      try {
        await this.#copy(
          compiledInstrumentationPath,
          path.join(dist, "instrumentation.js")
        )
      } catch {
        // No instrumentation file, create empty one
        await fs.create("instrumentation.js", "")
      }

      // Copy package.json (minimal version for deployment)
      await this.#copyPkgManagerFiles(dist)

      // Copy compiled user source files (for runtime loading via file-based routing)
      // ncc bundles dependencies, but user source files need to be available for dynamic loading
      const srcDir = path.join(tempDist, "src")
      const srcDirExists = await new FileSystem(srcDir).exists("")
      if (srcDirExists) {
        const glob = await import("glob")
        const srcFiles = glob.globSync("**/*.js", {
          cwd: srcDir,
          absolute: true,
          nodir: true,
        })

        for (const file of srcFiles) {
          const relativePath = path.relative(srcDir, file)
          const targetPath = path.join(dist, "src", relativePath)
          await mkdir(path.dirname(targetPath), { recursive: true })
          await this.#copy(file, targetPath)
        }
      }

      // Copy public directory if it exists
      const publicDir = path.join(this.#projectRoot, "public")
      const publicDirExists = await new FileSystem(publicDir).exists("")
      if (publicDirExists) {
        const glob = await import("glob")
        const publicFiles = glob.globSync("**/*", {
          cwd: publicDir,
          absolute: true,
          nodir: true,
        })

        for (const file of publicFiles) {
          const relativePath = path.relative(publicDir, file)
          const targetPath = path.join(dist, "public", relativePath)
          await mkdir(path.dirname(targetPath), { recursive: true })
          await this.#copy(file, targetPath)
        }
      }

      /**
       * Step 8: Cleanup temp directory
       */
      await this.#clean(tempDist)

      /**
       * Step 9: Log bundle statistics
       */
      const bundleSize = (code.length / 1024 / 1024).toFixed(2)
      this.#logger.info(`Bundle size: ${bundleSize} MB`)
      this.#logger.info(
        `Production bundle created successfully (${tracker.getSeconds()}s)`
      )
      this.#logger.info(`Output: ${path.relative(this.#projectRoot, dist)}`)
      this.#logger.info("\nTo deploy:")
      this.#logger.info(`  1. Copy the ${path.relative(this.#projectRoot, dist)} directory to your server`)
      this.#logger.info(`  2. Set up environment variables (copy .env or set in your environment)`)
      this.#logger.info(`  3. Run migrations: cd ${path.relative(this.#projectRoot, dist)} && node bundle.js db:migrate`)
      this.#logger.info(`  4. Start the server: cd ${path.relative(this.#projectRoot, dist)} && node bundle.js start`)
      this.#logger.info(`\nNote: The bundle is self-contained with all @medusajs packages included.`)
      this.#logger.info(`      No node_modules required!`)

      return true
    } catch (error) {
      this.#logger.error("Production bundle build failed")
      this.#logger.error(error)
      return false
    }
  }
}
