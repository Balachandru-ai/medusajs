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

  private detectFromUserAgent(): PackageManagerType {
    const userAgent = process.env.npm_config_user_agent

    if (userAgent?.includes("pnpm")) {
      return "pnpm"
    }
    if (userAgent?.includes("yarn")) {
      return "yarn"
    }
    // Default to npm if user agent exists but doesn't match known managers
    return "npm"
  }

  private async isAvailable(
    pm: PackageManagerType,
    execOptions: Record<string, unknown>
  ): Promise<boolean> {
    const commands: Record<PackageManagerType, string> = {
      yarn: "yarn -v",
      pnpm: "pnpm -v",
      npm: "npm -v",
    }

    try {
      await execute([commands[pm], execOptions], { verbose: false })
      return true
    } catch {
      return false
    }
  }

  async setPackageManager(execOptions: Record<string, unknown>): Promise<void> {
    if (this.packageManager) {
      return
    }

    // check whether yarn is available
    await this.processManager.runProcess({
      process: async () => {
        if (this.chosenPackageManager) {
          const isAvailable = await this.isAvailable(
            this.chosenPackageManager,
            execOptions
          )

          if (isAvailable) {
            this.packageManager = this.chosenPackageManager
            return
          }

          logMessage({
            type: "warn",
            message: `The specified package manager "${this.chosenPackageManager}" is not available. Detecting available package manager...`,
          })
        }

        const detected = this.detectFromUserAgent()
        const isDetectedAvailable = await this.isAvailable(
          detected,
          execOptions
        )

        if (isDetectedAvailable) {
          this.packageManager = detected
          logMessage({
            type: "info",
            message: `Using detected package manager "${detected}".`,
          })
          return
        }

        // Fallback to npm
        this.packageManager = "npm"
        logMessage({
          type: "info",
          message: `Falling back to "npm" as the package manager.`,
        })
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
        rmSync(filePath)
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

    const command = commands[this.packageManager!]

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
}
