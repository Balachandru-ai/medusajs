/**
 * Converts an npx command to its yarn or pnpm equivalent
 * Assumes the package is installed locally in node_modules
 * @param npxCommand - The npx command to convert (e.g., "npx medusa db:migrate")
 * @param packageManager - The target package manager ("yarn" or "pnpm")
 * @returns The converted command
 *
 * @example
 * npxToYarn("npx medusa db:migrate", "yarn") // "yarn medusa db:migrate"
 * npxToYarn("npx medusa db:migrate", "pnpm") // "pnpm medusa db:migrate"
 */
export function npxToYarn(
  npxCommand: string,
  packageManager: "yarn" | "pnpm"
): string {
  // Remove leading/trailing whitespace
  const trimmed = npxCommand.trim()

  // Check if command starts with npx
  if (!trimmed.startsWith("npx ")) {
    return trimmed
  }

  // Remove "npx " prefix and replace with the target package manager
  const command = trimmed.slice(4)

  if (packageManager === "yarn") {
    return `yarn ${command}`
  } else if (packageManager === "pnpm") {
    return `pnpm ${command}`
  }

  return trimmed
}
