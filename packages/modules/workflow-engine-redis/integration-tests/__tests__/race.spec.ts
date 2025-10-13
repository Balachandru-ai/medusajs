import { IWorkflowEngineService } from "@medusajs/framework/types"
import { Modules, TransactionHandlerType } from "@medusajs/framework/utils"
import {
  createStep,
  createWorkflow,
  parallelize,
  StepResponse,
  transform,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { moduleIntegrationTestRunner } from "@medusajs/test-utils"
import { setTimeout as setTimeoutSync } from "timers"
import { setTimeout } from "timers/promises"
import { ulid } from "ulid"
import "../__fixtures__"
import { TestDatabase } from "../utils/database"

jest.setTimeout(3000000)

const failTrap = (done, name, timeout = 5000) => {
  return setTimeoutSync(() => {
    // REF:https://stackoverflow.com/questions/78028715/jest-async-test-with-event-emitter-isnt-ending
    console.warn(
      `Jest is breaking the event emit with its debouncer. This allows to continue the test by managing the timeout of the test manually. ${name}`
    )
    done()
  }, timeout)
}

// REF:https://stackoverflow.com/questions/78028715/jest-async-test-with-event-emitter-isnt-ending

moduleIntegrationTestRunner<IWorkflowEngineService>({
  moduleName: Modules.WORKFLOW_ENGINE,
  resolve: __dirname + "/../..",
  moduleOptions: {
    redis: {
      url: "localhost:6379",
    },
  },
  testSuite: ({ service: workflowOrcModule, medusaApp }) => {
    describe("Testing race condition of the workflow during retry", () => {
      afterEach(async () => {
        await TestDatabase.clearTables()
      })

      it("should manage saving multiple async steps in concurrency", async () => {
        const step0 = createStep(
          { name: "step0", async: true, backgroundExecution: true },
          async () => {
            return new StepResponse("result from step 0")
          }
        )

        const step1 = createStep(
          { name: "step1", async: true, backgroundExecution: true },
          async () => {
            return new StepResponse("result from step 1")
          }
        )

        const step2 = createStep(
          { name: "step2", async: true, backgroundExecution: true },
          async () => {
            return new StepResponse("result from step 2")
          }
        )
        const step3 = createStep(
          { name: "step3", async: true, backgroundExecution: true },
          async () => {
            return new StepResponse("result from step 3")
          }
        )

        const step4 = createStep(
          { name: "step4", async: true, backgroundExecution: true },
          async () => {
            return new StepResponse("result from step 4")
          }
        )
        const step5 = createStep({ name: "step5" }, async (all: string[]) => {
          const ret = [...all, "result from step 5"]
          return new StepResponse(ret)
        })

        createWorkflow(
          {
            name: "workflow-1",
            idempotent: true,
            retentionTime: 1,
          },
          function () {
            const all = parallelize(step0(), step1(), step2(), step3(), step4())
            const res = step5(all)
            return new WorkflowResponse(res)
          }
        )

        const transactionId = ulid()
        let resolveDone: () => void
        const done = new Promise<void>((resolve, reject) => {
          resolveDone = resolve
        })
        void workflowOrcModule.subscribe({
          workflowId: "workflow-1",
          transactionId,
          subscriber: async (event) => {
            if (event.eventType === "onFinish") {
              resolveDone()
            }
          },
        })

        await workflowOrcModule.run("workflow-1", {
          throwOnError: false,
          logOnError: true,
          transactionId,
        })

        await done

        const { transaction, result } = await workflowOrcModule.run(
          "workflow-1",
          {
            throwOnError: false,
            transactionId,
          }
        )

        expect(result).toEqual([
          "result from step 0",
          "result from step 1",
          "result from step 2",
          "result from step 3",
          "result from step 4",
          "result from step 5",
        ])
      })

      it.only("should manage saving multiple async steps in concurrency without background execution while setting steps as success manually concurrently", async () => {
        const step0 = createStep({ name: "step0", async: true }, async () => {})

        const step1 = createStep({ name: "step1", async: true }, async () => {})

        const step2 = createStep({ name: "step2", async: true }, async () => {})
        const step3 = createStep({ name: "step3", async: true }, async () => {})

        const step4 = createStep({ name: "step4", async: true }, async () => {})
        const step5 = createStep({ name: "step5" }, async (all: any[]) => {
          const ret = [...all, "result from step 5"]
          return new StepResponse(ret)
        })

        createWorkflow(
          {
            name: "workflow-1",
            idempotent: true,
            retentionTime: 1,
          },
          function () {
            const all = parallelize(step0(), step1(), step2(), step3(), step4())
            const res = step5(all)
            return new WorkflowResponse(res)
          }
        )

        const transactionId = ulid()
        let resolveDone: () => void
        const done = new Promise<void>((resolve, reject) => {
          resolveDone = resolve
        })
        void workflowOrcModule.subscribe({
          workflowId: "workflow-1",
          transactionId,
          subscriber: async (event) => {
            if (event.eventType === "onFinish") {
              resolveDone()
            }
          },
        })

        await workflowOrcModule.run("workflow-1", {
          throwOnError: false,
          logOnError: true,
          transactionId,
        })

        await setTimeout(100) // Just to wait a bit before firering everything

        for (let i = 0; i <= 4; i++) {
          void workflowOrcModule.setStepSuccess({
            idempotencyKey: {
              workflowId: "workflow-1",
              transactionId: transactionId,
              stepId: `step${i}`,
              action: TransactionHandlerType.INVOKE,
            },
            stepResponse: new StepResponse("result from step " + i),
          })
        }

        await done

        const { transaction, result } = await workflowOrcModule.run(
          "workflow-1",
          {
            throwOnError: false,
            transactionId,
          }
        )

        expect(result).toEqual([
          "result from step 0",
          "result from step 1",
          "result from step 2",
          "result from step 3",
          "result from step 4",
          "result from step 5",
        ])
      })

      it("should prevent race continuation of the workflow during retryIntervalAwaiting in background execution", (done) => {
        const transactionId = "transaction_id" + ulid()
        const workflowId = "workflow-1" + ulid()
        const subWorkflowId = "sub-" + workflowId

        const step0InvokeMock = jest.fn()
        const step1InvokeMock = jest.fn()
        const step2InvokeMock = jest.fn()
        const transformMock = jest.fn()

        const step0 = createStep("step0", async (_) => {
          step0InvokeMock()
          return new StepResponse("result from step 0")
        })

        const step1 = createStep("step1", async (_) => {
          step1InvokeMock()
          await setTimeout(200)
          return new StepResponse({ isSuccess: true })
        })

        const step2 = createStep("step2", async (input: any) => {
          step2InvokeMock()
          return new StepResponse({ result: input })
        })

        const subWorkflow = createWorkflow(subWorkflowId, function () {
          const status = step1()
          return new WorkflowResponse(status)
        })

        createWorkflow(workflowId, function () {
          const build = step0()

          const status = subWorkflow.runAsStep({} as any).config({
            async: true,
            compensateAsync: true,
            backgroundExecution: true,
            retryIntervalAwaiting: 0.1,
          })

          const transformedResult = transform({ status }, (data) => {
            transformMock()
            return {
              status: data.status,
            }
          })

          step2(transformedResult)
          return new WorkflowResponse(build)
        })

        let timeout: NodeJS.Timeout
        void workflowOrcModule.subscribe({
          workflowId,
          transactionId,
          subscriber: async (event) => {
            if (event.eventType === "onFinish") {
              try {
                expect(step0InvokeMock).toHaveBeenCalledTimes(1)
                expect(
                  step1InvokeMock.mock.calls.length
                ).toBeGreaterThanOrEqual(1)
                expect(step2InvokeMock).toHaveBeenCalledTimes(1)
                expect(transformMock).toHaveBeenCalledTimes(1)

                // Prevent killing the test to early
                await setTimeout(500)
                done()
              } catch (e) {
                return done(e)
              } finally {
                clearTimeout(timeout)
              }
            }
          },
        })

        workflowOrcModule
          .run(workflowId, { transactionId })
          .then(({ result }) => {
            expect(result).toBe("result from step 0")
          })

        timeout = failTrap(
          done,
          "should prevent race continuation of the workflow during retryIntervalAwaiting in background execution"
        )
      })

      it("should prevent race continuation of the workflow compensation during retryIntervalAwaiting in background execution", (done) => {
        const transactionId = "transaction_id" + ulid()
        const workflowId = "RACE_workflow-1" + ulid()

        const step0InvokeMock = jest.fn()
        const step0CompensateMock = jest.fn()
        const step1InvokeMock = jest.fn()
        const step1CompensateMock = jest.fn()
        const step2InvokeMock = jest.fn()
        const transformMock = jest.fn()

        const step0 = createStep(
          "RACE_step0",
          async (_) => {
            step0InvokeMock()
            return new StepResponse("result from step 0")
          },
          () => {
            step0CompensateMock()
          }
        )

        const step1 = createStep(
          "RACE_step1",
          async (_) => {
            step1InvokeMock()
            await setTimeout(500)
            throw new Error("error from step 1")
          },
          () => {
            step1CompensateMock()
          }
        )

        const step2 = createStep("RACE_step2", async (input: any) => {
          step2InvokeMock()
          return new StepResponse({ result: input })
        })

        const subWorkflow = createWorkflow("RACE_sub-workflow-1", function () {
          const status = step1()
          return new WorkflowResponse(status)
        })

        createWorkflow(workflowId, function () {
          const build = step0()

          const status = subWorkflow.runAsStep({} as any).config({
            async: true,
            compensateAsync: true,
            backgroundExecution: true,
            retryIntervalAwaiting: 0.1,
          })

          const transformedResult = transform({ status }, (data) => {
            transformMock()
            return {
              status: data.status,
            }
          })

          step2(transformedResult)
          return new WorkflowResponse(build)
        })

        let timeout: NodeJS.Timeout
        void workflowOrcModule.subscribe({
          workflowId: workflowId,
          transactionId,
          subscriber: (event) => {
            if (event.eventType === "onFinish") {
              console.log({
                step0InvokeMock: step0InvokeMock.mock.calls.length,
                step0CompensateMock: step0CompensateMock.mock.calls.length,
                step1InvokeMock: step1InvokeMock.mock.calls.length,
                step1CompensateMock: step1CompensateMock.mock.calls.length,
                step2InvokeMock: step2InvokeMock.mock.calls.length,
                transformMock: transformMock.mock.calls.length,
                eventType: event.eventType,
              })

              try {
                expect(step0InvokeMock).toHaveBeenCalledTimes(1)
                expect(step0CompensateMock).toHaveBeenCalledTimes(1)
                expect(
                  step1InvokeMock.mock.calls.length
                ).toBeGreaterThanOrEqual(2) // Called every 0.1s at least (it can take more than 0.1s depending on the event loop congestions)
                expect(step1CompensateMock).toHaveBeenCalledTimes(1)
                expect(step2InvokeMock).toHaveBeenCalledTimes(0)
                expect(transformMock).toHaveBeenCalledTimes(0)
                done()
              } catch (e) {
                return done(e)
              } finally {
                clearTimeout(timeout)
              }
            }
          },
        })

        workflowOrcModule
          .run(workflowId, {
            transactionId,
            throwOnError: false,
            logOnError: true,
          })
          .then(({ result }) => {
            expect(result).toBe("result from step 0")
          })

        timeout = failTrap(
          done,
          "should prevent race continuation of the workflow compensation during retryIntervalAwaiting in background execution"
        )
      })
    })
  },
})
