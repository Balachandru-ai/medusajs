import path from "path"
import execute, { VerboseOptions } from "./execute.js"
import logMessage from "./log-message.js"
import ProcessManager from "./process-manager.js"
import { existsSync, rmSync } from "fs"

export type PackageManagerType = "npm" | "yarn" | "pnpm"

type PackageManagerOptions = {
  verbose?: boolean
  useNpm?: boolean
  usePnpm?: boolean
  useYarn?: boolean
}

export default class PackageManager {
  protected packageManager?: PackageManagerType
  protected packageManagerVersion?: string
  protected processManager: ProcessManager
  protected verbose
  protected chosenPackageManager?: PackageManagerType

  constructor(
    processManager: ProcessManager,
    options: PackageManagerOptions = {}
  ) {
    this.processManager = processManager
    this.verbose = options.verbose || false

    switch (true) {
      case options.useNpm:
        this.chosenPackageManager = "npm"
        break
      case options.usePnpm:
        this.chosenPackageManager = "pnpm"
        break
      case options.useYarn:
        this.chosenPackageManager = "yarn"
        break
    }
  }

  private detectFromUserAgent(): {
    manager: PackageManagerType
    version?: string
  } {
    const userAgent = process.env.npm_config_user_agent

    if (this.verbose) {
      console.log(`[DEBUG] User agent: ${userAgent}`)
    }

    if (!userAgent) {
      return { manager: "npm" }
    }

    // Extract package manager and version (e.g., "yarn/4.9.0" -> ["yarn", "4.9.0"])
    const match = userAgent.match(/(pnpm|pnpx|yarn|npm)\/(\d+\.\d+\.\d+)/)
    if (match) {
      const [, manager, version] = match

      if (this.verbose) {
        console.log(`[DEBUG] Detected from user agent: ${manager}@${version}`)
      }

      // pnpx is an alias for pnpm
      if (manager === "pnpx") {
        return { manager: "pnpm", version }
      }

      return { manager: manager as PackageManagerType, version }
    }

    // Fallback detection without version
    if (userAgent.includes("pnpm") || userAgent.includes("pnpx")) {
      return { manager: "pnpm" }
    }
    if (userAgent.includes("yarn")) {
      return { manager: "yarn" }
    }

    return { manager: "npm" }
  }

  private async getVersion(
    pm: PackageManagerType,
    execOptions: Record<string, unknown>
  ): Promise<string | undefined> {
    const commands: Record<PackageManagerType, string> = {
      yarn: "yarn -v",
      pnpm: "pnpm -v",
      npm: "npm -v",
    }

    try {
      const result = await execute([commands[pm], execOptions], {
        verbose: false,
      })
      const version = result.stdout?.trim()
      if (this.verbose) {
        console.log(`[DEBUG] getVersion(${pm}): ${version}`)
      }
      return version
    } catch {
      if (this.verbose) {
        console.log(`[DEBUG] getVersion(${pm}): failed`)
      }
      return undefined
    }
  }

  async setPackageManager(execOptions: Record<string, unknown>): Promise<void> {
    if (this.packageManager) {
      return
    }

    // check whether package manager is available and get version
    await this.processManager.runProcess({
      process: async () => {
        if (this.chosenPackageManager) {
          const version = await this.getVersion(
            this.chosenPackageManager,
            execOptions
          )

          if (version) {
            this.packageManager = this.chosenPackageManager
            // Store version if we don't have it from user agent
            if (!this.packageManagerVersion) {
              this.packageManagerVersion = version
            }
            return
          }

          logMessage({
            type: "error",
            message: `The specified package manager "${this.chosenPackageManager}" is not available. Please install it or choose another package manager.`,
          })
        }

        const detected = this.detectFromUserAgent()
        const detectedVersion = await this.getVersion(
          detected.manager,
          execOptions
        )

        if (detectedVersion) {
          this.packageManager = detected.manager
          // Prefer version from getVersion over user agent
          this.packageManagerVersion = detectedVersion
          if (this.verbose) {
            logMessage({
              type: "info",
              message: `Using detected package manager "${detected.manager}".`,
            })
          }
          return
        }

        // Fallback to npm
        this.packageManager = "npm"
        // Get npm version for fallback
        const npmVersion = await this.getVersion("npm", execOptions)
        if (npmVersion && !this.packageManagerVersion) {
          this.packageManagerVersion = npmVersion
        }
        if (this.verbose) {
          logMessage({
            type: "info",
            message: `Falling back to "npm" as the package manager.`,
          })
        }
      },
      ignoreERESOLVE: true,
    })
  }

  async removeLockFiles(directory: string): Promise<void> {
    const lockFiles: Record<PackageManagerType, string[]> = {
      npm: ["yarn.lock", "pnpm-lock.yaml"],
      yarn: ["package-lock.json", "pnpm-lock.yaml"],
      pnpm: ["yarn.lock", "package-lock.json"],
    }

    if (!this.packageManager) {
      return
    }

    const filesToRemove = lockFiles[this.packageManager] || []
    for (const file of filesToRemove) {
      const filePath = path.join(directory, file)
      if (existsSync(filePath)) {
        rmSync(filePath, {
          force: true,
        })
      }
    }
  }

  async installDependencies(execOptions: Record<string, unknown>) {
    if (!this.packageManager) {
      await this.setPackageManager(execOptions)
    }

    // Remove lock files from other package managers
    if (execOptions.cwd && typeof execOptions.cwd === "string") {
      await this.removeLockFiles(execOptions.cwd)
    }

    const commands: Record<PackageManagerType, string> = {
      yarn: "yarn",
      pnpm: "pnpm install",
      npm: "npm install",
    }

    const command = commands[this.packageManager || "npm"]

    await this.processManager.runProcess({
      process: async () => {
        await execute([command, execOptions], {
          verbose: this.verbose,
        })
      },
      ignoreERESOLVE: true,
    })
  }

  async runCommand(
    command: string,
    execOptions: Record<string, unknown>,
    verboseOptions: VerboseOptions = {}
  ) {
    if (!this.packageManager) {
      await this.setPackageManager(execOptions)
    }

    const commandStr = this.getCommandStr(command)

    return await this.processManager.runProcess({
      process: async () => {
        return await execute([commandStr, execOptions], {
          verbose: this.verbose,
          ...verboseOptions,
        })
      },
      ignoreERESOLVE: true,
    })
  }

  async runMedusaCommand(
    command: string,
    execOptions: Record<string, unknown>,
    verboseOptions: VerboseOptions = {}
  ) {
    if (!this.packageManager) {
      await this.setPackageManager(execOptions)
    }

    const formats: Record<PackageManagerType, string> = {
      yarn: `yarn medusa ${command}`,
      pnpm: `pnpm medusa ${command}`,
      npm: `npx medusa ${command}`,
    }

    const commandStr = formats[this.packageManager || "npm"]

    return await this.processManager.runProcess({
      process: async () => {
        return await execute([commandStr, execOptions], {
          verbose: this.verbose,
          ...verboseOptions,
        })
      },
      ignoreERESOLVE: true,
    })
  }

  getCommandStr(command: string): string {
    if (!this.packageManager) {
      throw new Error("Package manager not set")
    }

    const formats: Record<PackageManagerType, string> = {
      yarn: `yarn ${command}`,
      pnpm: `pnpm ${command}`,
      npm: `npm run ${command}`,
    }

    return formats[this.packageManager]
  }

  getPackageManager(): PackageManagerType | undefined {
    return this.packageManager
  }

  async getPackageManagerString(): Promise<string | undefined> {
    if (!this.packageManager) {
      await this.setPackageManager({})
    }
    if (!this.packageManagerVersion) {
      if (this.verbose) {
        console.log(
          `[DEBUG] getPackageManagerString: no version (packageManager=${this.packageManager})`
        )
      }
      return undefined
    }
    const result = `${this.packageManager}@${this.packageManagerVersion}`
    if (this.verbose) {
      console.log(`[DEBUG] getPackageManagerString: ${result}`)
    }
    return result
  }
}
