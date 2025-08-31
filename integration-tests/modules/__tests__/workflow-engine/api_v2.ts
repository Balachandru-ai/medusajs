import { workflowEngineTestSuite } from "./tests"

jest.setTimeout(5000000)

const env = {}

workflowEngineTestSuite(env)
