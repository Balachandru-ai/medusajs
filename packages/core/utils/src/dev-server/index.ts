type ResourcePath = string

export const globalDevServerRegistry = new Map<ResourcePath, Map<any, any>>()
export const inverseDevServerRegistry = new Map<string, string[]>()

export function registerDevServerResource(
  data:
    | {
        sourcePath: string
        id: string
        type: "workflow"
      }
    | {
        type: "step"
        id: string
        workflowId?: string
        sourcePath?: string
      }
) {
  if (data.type === "workflow") {
    const registry =
      globalDevServerRegistry.get(data.sourcePath) ||
      new Map<string, string[]>()
    globalDevServerRegistry.set(data.sourcePath, registry)

    registry.set(data.type, [
      ...(registry.get(data.type) || []),
      {
        id: data.id,
        workflowId: data.id,
      },
    ])

    inverseDevServerRegistry.set(`${data.type}:${data.id}`, [data.sourcePath])
  }

  if (data.type === "step") {
    const sourcePath =
      data.sourcePath ??
      inverseDevServerRegistry.get(`workflow:${data.workflowId}`)?.[0]

    if (!sourcePath) {
      throw new Error(
        `step workflow not found: ${data.workflowId} for step ${data.id}`
      )
    }

    const registry =
      globalDevServerRegistry.get(sourcePath!) ?? new Map<string, string[]>()
    globalDevServerRegistry.set(sourcePath!, registry)

    registry.set(data.type, [
      ...(registry.get(data.type) || []),
      { id: data.id, workflowId: data.workflowId },
    ])

    inverseDevServerRegistry.set(
      `${data.type}:${data.id}`,
      Array.from(
        new Set([
          ...(inverseDevServerRegistry.get(`${data.type}:${data.id}`) || []),
          sourcePath!,
        ])
      )
    )
  }
}
