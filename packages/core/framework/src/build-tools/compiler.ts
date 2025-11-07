import type { AdminOptions, ConfigModule, Logger } from "@medusajs/types"
import { FileSystem, getConfigFile, getResolvedPlugins } from "@medusajs/utils"
import chokidar from "chokidar"
import {
  access,
  constants,
  copyFile,
  mkdir,
  rm,
  readFile,
  writeFile,
} from "fs/promises"
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
  async #copyPkgManagerFiles(dist: string, externalDeps?: string[]) {
    /**
     * Copying package manager files
     */
    const pkgPath = path.join(this.#projectRoot, "package.json")
    const targetPath = path.join(dist, "package.json")

    // If externalDeps provided, filter package.json to only include those
    if (externalDeps && externalDeps.length > 0) {
      const pkgJson = JSON.parse(await readFile(pkgPath, "utf-8"))
      const filteredDeps: Record<string, string> = {}

      // Only keep dependencies that are external (not bundled)
      if (pkgJson.dependencies) {
        for (const dep of externalDeps) {
          if (pkgJson.dependencies[dep]) {
            filteredDeps[dep] = pkgJson.dependencies[dep]
          }
        }
      }

      // Always include @medusajs/cli for running commands
      if (pkgJson.dependencies?.["@medusajs/cli"]) {
        filteredDeps["@medusajs/cli"] = pkgJson.dependencies["@medusajs/cli"]
      }

      pkgJson.dependencies = filteredDeps
      await writeFile(targetPath, JSON.stringify(pkgJson, null, 2))
    } else {
      await this.#copy(pkgPath, targetPath)
    }

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
   * Builds the application backend source code using esbuild
   * with tree shaking and minification for production deployments.
   * Maintains file structure for Medusa's file-based routing.
   */
  async buildAppBackendProduction(
    tsConfig: tsStatic.ParsedCommandLine
  ): Promise<boolean> {
    const tracker = this.#trackDuration()
    const dist = this.#computeDist(tsConfig)
    this.#logger.info("Compiling backend source for production (optimized)...")

    /**
     * Step 1: Cleanup existing build output
     */
    this.#logger.info(
      `Removing existing "${path.relative(this.#projectRoot, dist)}" folder`
    )
    await this.#clean(dist)

    /**
     * Create target directory
     */
    await mkdir(dist, { recursive: true })

    /**
     * Step 2: Build using esbuild with optimizations
     */
    try {
      const esbuild = await import("esbuild")

      // Find all entry points from user's src directory
      const srcDir = path.join(this.#projectRoot, "src")
      const glob = await import("glob")

      // Discover all TypeScript/JavaScript files as entry points
      // This includes api routes, subscribers, jobs, workflows, etc.
      const files = glob.globSync("**/*.{ts,js}", {
        cwd: srcDir,
        ignore: [
          "**/*.d.ts",
          "**/__tests__/**",
          "**/__mocks__/**",
          "**/__fixtures__/**",
          "**/test/**",
          "**/tests/**",
          "**/integration-tests/**",
        ],
        absolute: true,
      })

      const entryPoints = files.filter((file) => {
        return !this.#backendIgnoreFiles.some((chunk) => file.includes(chunk))
      })

      this.#logger.info(`Found ${entryPoints.length} files to optimize`)

      // Build with esbuild - transpile and optimize each file
      // Keep file structure for Medusa's file-based routing
      await esbuild.build({
        entryPoints,
        bundle: false, // Keep 1:1 file structure (required for Medusa)
        platform: "node",
        target: "node20",
        format: "cjs",
        outdir: dist,
        outbase: srcDir,
        sourcemap: true,
        minify: true, // Minify for production
        minifyWhitespace: true,
        minifySyntax: true,
        minifyIdentifiers: false, // Keep identifiers for debugging
        treeShaking: true, // Remove unused code
        keepNames: true, // Preserve function/class names for stack traces
        legalComments: "none",
        loader: {
          ".ts": "ts",
          ".js": "js",
        },
        logLevel: "warning",
      })

      this.#logger.info("Production build created successfully")

      /**
       * Step 3: Generate TypeScript declarations using tsc
       */
      this.#logger.info("Generating TypeScript declarations...")
      const ts = await this.#loadTSCompiler()
      const program = ts.createProgram(
        tsConfig.fileNames.filter((fileName) => {
          return !this.#backendIgnoreFiles.some((chunk) =>
            fileName.includes(`${chunk}`)
          )
        }),
        {
          ...tsConfig.options,
          outDir: dist,
          emitDeclarationOnly: true,
          declaration: true,
        }
      )

      const emitResult = program.emit()
      const diagnostics = ts
        .getPreEmitDiagnostics(program)
        .concat(emitResult.diagnostics)

      this.#printDiagnostics(ts, diagnostics)

      if (diagnostics.length) {
        this.#logger.warn("Type declaration generation completed with errors")
      }

      /**
       * Step 4: Copy package manager files
       */
      await this.#copyPkgManagerFiles(dist)

      this.#logger.info(
        `Production build completed successfully (${tracker.getSeconds()}s)`
      )
      return true
    } catch (error) {
      this.#logger.error("Production build failed")
      this.#logger.error(error)
      return false
    }
  }

  /**
   * Builds a production bundle from a trace manifest
   * This creates a single bundled server file with all dependencies
   */
  async buildAppBackendFromManifest(manifestPath: string): Promise<boolean> {
    const tracker = this.#trackDuration()
    this.#logger.info("Building production bundle from trace manifest...")

    try {
      // Read manifest
      const manifestContent = await readFile(manifestPath, "utf-8")
      const manifest = JSON.parse(manifestContent)

      this.#logger.info(`Manifest stats:`)
      this.#logger.info(`  - User modules: ${manifest.stats.userModules}`)
      this.#logger.info(
        `  - Dependencies: ${manifest.stats.uniqueDependencies}`
      )
      this.#logger.info(`  - Dynamic imports: ${manifest.stats.dynamicImports}`)

      // Prepare output directory
      const dist = path.join(this.#projectRoot, ".medusa", "server")
      await this.#clean(dist)
      await mkdir(dist, { recursive: true })

      const esbuild = await import("esbuild")
      const fs = await import("fs/promises")

      // Categorize modules by type for better bundling
      const apiModules = manifest.userModules.filter((m: any) =>
        m.path.includes("/api/")
      )
      const subscriberModules = manifest.userModules.filter((m: any) =>
        m.path.includes("/subscribers/")
      )
      const jobModules = manifest.userModules.filter((m: any) =>
        m.path.includes("/jobs/")
      )
      const workflowModules = manifest.userModules.filter((m: any) =>
        m.path.includes("/workflows/")
      )
      const otherModules = manifest.userModules.filter(
        (m: any) =>
          !m.path.includes("/api/") &&
          !m.path.includes("/subscribers/") &&
          !m.path.includes("/jobs/") &&
          !m.path.includes("/workflows/")
      )

      // Native/platform-specific modules and optional dependencies that can't be bundled
      // Everything else will be bundled and tree-shaken
      const external = [
        // Native binary modules
        "better-sqlite3",
        "pg-native",
        "@swc/core",
        "fsevents",
        // Optional database drivers (not always installed)
        "tedious", // MSSQL
        "mysql",
        "mysql2",
        "oracledb",
        "mariadb",
        "mariadb/callback",
        "libsql",
        "sqlite3",
        "pg-query-stream", // PostgreSQL streaming
        // Build tools (referenced by start command but not needed at runtime)
        "esbuild",
        "vite",
        "lightningcss",
        "@babel/preset-typescript",
        "@babel/core",
        // Native file patterns
        "*.node",
      ]

      this.#logger.info(`Creating single optimized bundle with tree shaking...`)
      this.#logger.info(`  - API routes: ${apiModules.length}`)
      this.#logger.info(`  - Subscribers: ${subscriberModules.length}`)
      this.#logger.info(`  - Jobs: ${jobModules.length}`)
      this.#logger.info(`  - Workflows: ${workflowModules.length}`)
      this.#logger.info(`  - Other: ${otherModules.length}`)

      // Combine ALL modules into a single bundle
      const allModules = [
        ...apiModules,
        ...subscriberModules,
        ...jobModules,
        ...workflowModules,
        ...otherModules,
      ]

      // Find and copy the start command before bundling
      // The CLI needs it as a separate file, not minified in the bundle
      let startCommandPath: string
      try {
        // First try to resolve @medusajs/medusa package
        const medusaPkgPath = require.resolve("@medusajs/medusa/package.json", {
          paths: [this.#projectRoot],
        })
        const medusaDir = path.dirname(medusaPkgPath)
        startCommandPath = path.join(medusaDir, "dist", "commands", "start.js")
      } catch {
        // Fallback: try direct resolution
        startCommandPath = require.resolve("@medusajs/medusa/commands/start")
      }

      // Copy the start command to a separate file (not in bundle)
      const startCommandDist = path.join(dist, "commands", "start.js")
      await mkdir(path.dirname(startCommandDist), { recursive: true })
      await this.#copy(startCommandPath, startCommandDist)
      this.#logger.info("  ✓ Copied start command separately (not bundled)")

      // Create a single virtual entry that exports all modules
      const createVirtualEntry = (modules: any[]) => {
        const imports = modules
          .map((m: any, idx: number) => {
            const modulePath = m.path.startsWith("/")
              ? m.path
              : path.join(this.#projectRoot, m.path)
            return `export * as _module_${idx} from "${modulePath}";`
          })
          .join("\n")

        return imports
      }

      // Write virtual entry file
      const virtualDir = path.join(this.#projectRoot, ".medusa", "virtual")
      await mkdir(virtualDir, { recursive: true })

      const virtualEntry = path.join(virtualDir, "bundle.entry.js")
      const virtualContent = createVirtualEntry(allModules)
      await fs.writeFile(virtualEntry, virtualContent)

      // Create the single bundle
      const result = await esbuild.build({
        entryPoints: [virtualEntry],
        bundle: true, // FULL bundling with tree shaking
        platform: "node",
        target: "node20",
        format: "cjs",
        outfile: path.join(dist, "bundle.js"),
        sourcemap: true,
        minify: true,
        treeShaking: true,
        keepNames: true,
        external,
        metafile: true,
        loader: {
          ".ts": "ts",
          ".js": "js",
        },
        logLevel: "warning", // Show warnings to see what's not being bundled
      })

      // Create manifest mapping original paths to bundle exports
      const routeManifest: Record<string, { bundle: string; export: string }> =
        {}

      allModules.forEach((m: any, idx: number) => {
        routeManifest[m.path] = {
          bundle: "bundle.js",
          export: `_module_${idx}`,
        }
      })

      // Save route manifest
      await fs.writeFile(
        path.join(dist, "route-manifest.json"),
        JSON.stringify(routeManifest, null, 2)
      )

      this.#logger.info("  ✓ Bundle created with self-executing start command")
      this.#logger.info(
        "  ✓ Postinstall script will create stub @medusajs/medusa after yarn install"
      )

      // Clean up virtual directory
      await rm(virtualDir, { recursive: true, force: true })

      const bundleSize =
        Object.values(result.metafile?.outputs || {})[0]?.bytes || 0
      this.#logger.info(
        `  ✓ Single bundle: ${(bundleSize / 1024 / 1024).toFixed(2)} MB`
      )
      this.#logger.info("Bundle created successfully with full tree shaking")

      // Transpile and copy essential config files (not traced but needed at runtime)
      this.#logger.info("Processing config files...")
      const configFiles = ["medusa-config", "instrumentation"]

      for (const configName of configFiles) {
        const tsPath = path.join(this.#projectRoot, `${configName}.ts`)
        const jsPath = path.join(this.#projectRoot, `${configName}.js`)

        // Check if TS version exists and transpile it
        if (
          await fs
            .access(tsPath)
            .then(() => true)
            .catch(() => false)
        ) {
          await esbuild.build({
            entryPoints: [tsPath],
            bundle: false, // Just transpile, don't bundle
            platform: "node",
            target: "node20",
            format: "cjs",
            outfile: path.join(dist, `${configName}.js`),
            // No external - bundle: false doesn't support it
            loader: { ".ts": "ts" },
            logLevel: "error",
          })
        }
        // Otherwise copy JS version if it exists
        else if (
          await fs
            .access(jsPath)
            .then(() => true)
            .catch(() => false)
        ) {
          await this.#copy(jsPath, path.join(dist, `${configName}.js`))
        }
      }

      // Copy package manager files (with filtered dependencies for bundle mode)
      await this.#copyPkgManagerFiles(dist, external)

      // Create post-install script to set up stub medusa package
      const postInstallScript = `// Post-install script to create stub @medusajs/medusa package
const fs = require('fs');
const path = require('path');

const stubMedusaDir = path.join(__dirname, 'node_modules', '@medusajs', 'medusa');
const stubCommandsDir = path.join(stubMedusaDir, 'dist', 'commands');

fs.mkdirSync(stubCommandsDir, { recursive: true });

// Create stub start.js that points to the separate start command file
const stubStartCommand = \`// This file is a stub that loads the actual start command
const path = require('path');
const startCommandPath = path.join(__dirname, '..', '..', '..', '..', '..', 'commands', 'start.js');
module.exports = require(startCommandPath);
\`;

fs.writeFileSync(path.join(stubCommandsDir, 'start.js'), stubStartCommand);

// Create minimal package.json
const stubPackageJson = {
  name: '@medusajs/medusa',
  version: '0.0.0-bundle',
  main: './dist/index.js'
};

fs.writeFileSync(
  path.join(stubMedusaDir, 'package.json'),
  JSON.stringify(stubPackageJson, null, 2)
);

console.log('✓ Created stub @medusajs/medusa package');
`

      await fs.writeFile(path.join(dist, "postinstall.js"), postInstallScript)

      // Update package.json to run postinstall script and disable PnP
      const pkgJsonPath = path.join(dist, "package.json")
      const pkgJson = JSON.parse(await fs.readFile(pkgJsonPath, "utf-8"))
      pkgJson.scripts = pkgJson.scripts || {}
      pkgJson.scripts.postinstall = "node postinstall.js"

      // Disable Yarn PnP - we need real node_modules for the stub package
      pkgJson.installConfig = {
        pnp: false
      }

      await fs.writeFile(pkgJsonPath, JSON.stringify(pkgJson, null, 2))

      // Create .yarnrc.yml to disable PnP
      const yarnrcContent = `nodeLinker: node-modules
`
      await fs.writeFile(path.join(dist, ".yarnrc.yml"), yarnrcContent)

      // Copy environment files if they exist
      await this.#copy(
        path.join(this.#projectRoot, ".env"),
        path.join(dist, ".env")
      ).catch(() => {
        // .env might not exist, that's ok
      })
      await this.#copy(
        path.join(this.#projectRoot, ".env.local"),
        path.join(dist, ".env.local")
      ).catch(() => {})
      await this.#copy(
        path.join(this.#projectRoot, ".env.production"),
        path.join(dist, ".env.production")
      ).catch(() => {})

      this.#logger.info(
        `Production bundle completed (${tracker.getSeconds()}s)`
      )
      this.#logger.info(`Output: ${path.relative(this.#projectRoot, dist)}`)
      this.#logger.info(
        `Run 'node bundle.js' to start the server (no dependencies needed)`
      )
      return true
    } catch (error) {
      this.#logger.error("Bundle build failed", error)
      return false
    }
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
}
