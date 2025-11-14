export type ResourcePath = string
export type ResourceType = string
export type ResourceEntry = {
  id: string
  workflowId?: string
  [key: string]: any
}
export type ResourceMap = Map<string, ResourceEntry[]>

export interface BaseResourceData {
  type: string
  id: string
  sourcePath?: string
}

export interface WorkflowResourceData extends BaseResourceData {
  type: "workflow"
  sourcePath: string
}

export interface StepResourceData extends BaseResourceData {
  type: "step"
  workflowId?: string
  sourcePath?: string
}

export type ResourceRegistrationData = WorkflowResourceData | StepResourceData

export interface ResourceTypeHandler<
  T extends BaseResourceData = BaseResourceData
> {
  readonly type: string

  validate(data: T): void

  resolveSourcePath(data: T): string

  createEntry(data: T): ResourceEntry

  getInverseKey(data: T): string
}
