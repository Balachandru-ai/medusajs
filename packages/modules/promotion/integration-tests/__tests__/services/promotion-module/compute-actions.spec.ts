import { IPromotionModuleService } from "@medusajs/framework/types"
import {
  ApplicationMethodType,
  Modules,
  PromotionStatus,
  PromotionType,
} from "@medusajs/framework/utils"
import { moduleIntegrationTestRunner, SuiteOptions } from "@medusajs/test-utils"
import { createCampaigns } from "../../../__fixtures__/campaigns"
import { createDefaultPromotion } from "../../../__fixtures__/promotion"

jest.setTimeout(30000)

moduleIntegrationTestRunner({
  moduleName: Modules.PROMOTION,
  testSuite: ({
    MikroOrmWrapper,
    service,
  }: SuiteOptions<IPromotionModuleService>) => {
    describe("Promotion Service: computeActions", () => {
      beforeEach(async () => {
        await createCampaigns(MikroOrmWrapper.forkManager())
      })

      it("should return empty array when promotion is not active (draft or inactive)", async () => {
        const promotion = await createDefaultPromotion(service, {
          status: PromotionStatus.DRAFT,
          rules: [
            {
              attribute: "customer.customer_group.id",
              operator: "in",
              values: ["VIP", "top100"],
            },
          ],
          application_method: {
            type: "fixed",
            target_type: "items",
            allocation: "each",
            value: 200,
            max_quantity: 1,
            target_rules: [
              {
                attribute: "product_category.id",
                operator: "eq",
                values: ["catg_cotton"],
              },
            ],
          },
        })

        const result = await service.computeActions([promotion.code!], {
          currency_code: "usd",
          customer: {
            customer_group: {
              id: "VIP",
            },
          },
          items: [
            {
              id: "item_cotton_tshirt",
              quantity: 1,
              subtotal: 100,
              product_category: {
                id: "catg_cotton",
              },
              product: {
                id: "prod_tshirt",
              },
            },
            {
              id: "item_cotton_sweater",
              quantity: 5,
              subtotal: 750,
              product_category: {
                id: "catg_cotton",
              },
              product: {
                id: "prod_sweater",
              },
            },
          ],
        })

        expect(result).toEqual([])
      })

      describe("when code is not present in database", () => {
        it("should return empty array when promotion does not exist", async () => {
          const response = await service.computeActions(["DOES_NOT_EXIST"], {
            currency_code: "usd",
            customer: {
              customer_group: {
                id: "VIP",
              },
            },
            items: [
              {
                id: "item_cotton_tshirt",
                quantity: 1,
                subtotal: 100,
                product_category: {
                  id: "catg_cotton",
                },
                product: {
                  id: "prod_tshirt",
                },
              },
              {
                id: "item_cotton_sweater",
                quantity: 5,
                subtotal: 750,
                product_category: {
                  id: "catg_cotton",
                },
                product: {
                  id: "prod_sweater",
                },
              },
            ],
          })

          expect(response).toEqual([])
        })
      })

      describe("when promotion is for items and allocation is each", () => {
        describe("when application type is fixed", () => {
          it("should compute the correct item amendments", async () => {
            await createDefaultPromotion(service, {
              rules: [
                {
                  attribute: "customer.customer_group.id",
                  operator: "in",
                  values: ["VIP", "top100"],
                },
              ],
              application_method: {
                type: "fixed",
                target_type: "items",
                allocation: "each",
                value: 200,
                max_quantity: 1,
                target_rules: [
                  {
                    attribute: "product_category.id",
                    operator: "eq",
                    values: ["catg_cotton"],
                  },
                ],
              } as any,
            })

            const result = await service.computeActions(["PROMOTION_TEST"], {
              currency_code: "usd",
              customer: {
                customer_group: {
                  id: "VIP",
                },
              },
              items: [
                {
                  id: "item_cotton_tshirt",
                  quantity: 1,
                  subtotal: 100,
                  product_category: {
                    id: "catg_cotton",
                  },
                  product: {
                    id: "prod_tshirt",
                  },
                },
                {
                  id: "item_cotton_sweater",
                  quantity: 5,
                  subtotal: 750,
                  product_category: {
                    id: "catg_cotton",
                  },
                  product: {
                    id: "prod_sweater",
                  },
                },
              ],
            })

            expect(JSON.parse(JSON.stringify(result))).toEqual([
              {
                action: "addItemAdjustment",
                item_id: "item_cotton_tshirt",
                amount: 100,
                code: "PROMOTION_TEST",
                is_tax_inclusive: false,
              },
              {
                action: "addItemAdjustment",
                item_id: "item_cotton_sweater",
                amount: 150,
                code: "PROMOTION_TEST",
                is_tax_inclusive: false,
              },
            ])

            const resultWithoutCustomer = await service.computeActions(
              ["PROMOTION_TEST"],
              {
                currency_code: "usd",
                items: [
                  {
                    id: "item_cotton_tshirt",
                    quantity: 1,
                    subtotal: 100,
                    product_category: {
                      id: "catg_cotton",
                    },
                    product: {
                      id: "prod_tshirt",
                    },
                  },
                  {
                    id: "item_cotton_sweater",
                    quantity: 5,
                    subtotal: 750,
                    product_category: {
                      id: "catg_cotton",
                    },
                    product: {
                      id: "prod_sweater",
                    },
                  },
                ],
              }
            )

            expect(JSON.parse(JSON.stringify(resultWithoutCustomer))).toEqual(
              []
            )
          })

          it("should compute the correct item amendments when there are multiple promotions to apply", async () => {
            await createDefaultPromotion(service, {
              rules: [
                {
                  attribute: "customer.customer_group.id",
                  operator: "in",
                  values: ["VIP", "top100"],
                },
              ],
              application_method: {
                type: "fixed",
                target_type: "items",
                allocation: "each",
                value: 30,
                max_quantity: 2,
                target_rules: [
                  {
                    attribute: "product_category.id",
                    operator: "eq",
                    values: ["catg_cotton"],
                  },
                ],
              } as any,
            })

            await createDefaultPromotion(service, {
              code: "PROMOTION_TEST_2",
              rules: [
                {
                  attribute: "customer.customer_group.id",
                  operator: "in",
                  values: ["VIP", "top100"],
                },
              ],
              application_method: {
                type: "fixed",
                target_type: "items",
                allocation: "each",
                value: 50,
                max_quantity: 1,
                target_rules: [
                  {
                    attribute: "product_category.id",
                    operator: "eq",
                    values: ["catg_cotton"],
                  },
                ],
              } as any,
            })

            const result = await service.computeActions(
              ["PROMOTION_TEST", "PROMOTION_TEST_2"],
              {
                currency_code: "usd",
                customer: {
                  customer_group: {
                    id: "VIP",
                  },
                },
                items: [
                  {
                    id: "item_cotton_tshirt",
                    quantity: 1,
                    subtotal: 50,
                    product_category: {
                      id: "catg_cotton",
                    },
                    product: {
                      id: "prod_tshirt",
                    },
                  },
                  {
                    id: "item_cotton_sweater",
                    quantity: 1,
                    subtotal: 150,
                    product_category: {
                      id: "catg_cotton",
                    },
                    product: {
                      id: "prod_sweater",
                    },
                  },
                ],
              }
            )

            expect(JSON.parse(JSON.stringify(result))).toEqual([
              {
                action: "addItemAdjustment",
                item_id: "item_cotton_tshirt",
                amount: 50,
                code: "PROMOTION_TEST_2",
                is_tax_inclusive: false,
              },
              {
                action: "addItemAdjustment",
                item_id: "item_cotton_sweater",
                amount: 50,
                code: "PROMOTION_TEST_2",
                is_tax_inclusive: false,
              },
              {
                action: "addItemAdjustment",
                item_id: "item_cotton_sweater",
                amount: 30,
                code: "PROMOTION_TEST",
                is_tax_inclusive: false,
              },
            ])
          })

          it("should not compute actions when applicable total is 0", async () => {
            await createDefaultPromotion(service, {
              rules: [
                {
                  attribute: "customer.customer_group.id",
                  operator: "in",
                  values: ["VIP", "top100"],
                },
              ],
              application_method: {
                type: "fixed",
                target_type: "items",
                allocation: "each",
                value: 500,
                max_quantity: 2,
                target_rules: [
                  {
                    attribute: "product_category.id",
                    operator: "eq",
                    values: ["catg_cotton"],
                  },
                ],
              } as any,
            })

            await createDefaultPromotion(service, {
              code: "PROMOTION_TEST_2",
              rules: [
                {
                  attribute: "customer.customer_group.id",
                  operator: "in",
                  values: ["VIP", "top100"],
                },
              ],
              application_method: {
                type: "fixed",
                target_type: "items",
                allocation: "each",
                value: 50,
                max_quantity: 1,
                target_rules: [
                  {
                    attribute: "product_category.id",
                    operator: "eq",
                    values: ["catg_cotton"],
                  },
                ],
              } as any,
            })

            const result = await service.computeActions(
              ["PROMOTION_TEST", "PROMOTION_TEST_2"],
              {
                currency_code: "usd",
                customer: {
                  customer_group: {
                    id: "VIP",
                  },
                },
                items: [
                  {
                    id: "item_cotton_tshirt",
                    quantity: 1,
                    subtotal: 50,
                    product_category: {
                      id: "catg_cotton",
                    },
                    product: {
                      id: "prod_tshirt",
                    },
                  },
                  {
                    id: "item_cotton_sweater",
                    quantity: 1,
                    subtotal: 150,
                    product_category: {
                      id: "catg_cotton",
                    },
                    product: {
                      id: "prod_sweater",
                    },
                  },
                ],
              }
            )

            expect(JSON.parse(JSON.stringify(result))).toEqual([
              {
                action: "addItemAdjustment",
                item_id: "item_cotton_tshirt",
                amount: 50,
                code: "PROMOTION_TEST",
                is_tax_inclusive: false,
              },
              {
                action: "addItemAdjustment",
                item_id: "item_cotton_sweater",
                amount: 150,
                code: "PROMOTION_TEST",
                is_tax_inclusive: false,
              },
            ])
          })

          it("should compute budget exceeded action when applicable total exceeds campaign budget for type spend", async () => {
            await createDefaultPromotion(service, {
              rules: [
                {
                  attribute: "customer.customer_group.id",
                  operator: "in",
                  values: ["VIP", "top100"],
                },
              ],
              application_method: {
                type: "fixed",
                target_type: "items",
                allocation: "each",
                value: 100,
                max_quantity: 5,
                target_rules: [
                  {
                    attribute: "product_category.id",
                    operator: "eq",
                    values: ["catg_cotton"],
                  },
                ],
              } as any,
            })

            const result = await service.computeActions(["PROMOTION_TEST"], {
              currency_code: "usd",
              customer: {
                customer_group: {
                  id: "VIP",
                },
              },
              items: [
                {
                  id: "item_cotton_tshirt",
                  quantity: 5,
                  subtotal: 5000,
                  product_category: {
                    id: "catg_cotton",
                  },
                  product: {
                    id: "prod_tshirt",
                  },
                },
              ],
            })

            expect(JSON.parse(JSON.stringify(result))).toEqual([
              {
                action: "addItemAdjustment",
                item_id: "item_cotton_tshirt",
                amount: 500,
                code: "PROMOTION_TEST",
                is_tax_inclusive: false,
              },
            ])
          })

          it("should compute budget exceeded action when applicable total exceeds campaign budget for type usage", async () => {
            await createDefaultPromotion(service, {
              rules: [
                {
                  attribute: "customer.customer_group.id",
                  operator: "in",
                  values: ["VIP", "top100"],
                },
              ],
              campaign_id: "campaign-id-2",
              application_method: {
                type: "fixed",
                target_type: "items",
                allocation: "each",
                value: 500,
                max_quantity: 5,
                target_rules: [
                  {
                    attribute: "product_category.id",
                    operator: "eq",
                    values: ["catg_cotton"],
                  },
                ],
              } as any,
            })
            await service.updateCampaigns({
              id: "campaign-id-2",
              budget: { used: 1000 },
            })

            const result = await service.computeActions(["PROMOTION_TEST"], {
              currency_code: "usd",
              customer: {
                customer_group: {
                  id: "VIP",
                },
              },
              items: [
                {
                  id: "item_cotton_tshirt",
                  quantity: 5,
                  subtotal: 5000,
                  product_category: {
                    id: "catg_cotton",
                  },
                  product: {
                    id: "prod_tshirt",
                  },
                },
              ],
            })

            expect(JSON.parse(JSON.stringify(result))).toEqual([
              { action: "campaignBudgetExceeded", code: "PROMOTION_TEST" },
            ])
          })
        })

        describe("when application type is percentage", () => {
          it("should compute the correct item amendments", async () => {
            await createDefaultPromotion(service, {
              rules: [
                {
                  attribute: "customer.customer_group.id",
                  operator: "in",
                  values: ["VIP", "top100"],
                },
              ],
              application_method: {
                type: ApplicationMethodType.PERCENTAGE,
                target_type: "items",
                allocation: "each",
                value: 10,
                max_quantity: 1,
                target_rules: [
                  {
                    attribute: "product_category.id",
                    operator: "eq",
                    values: ["catg_cotton"],
                  },
                ],
              } as any,
            })

            const result = await service.computeActions(["PROMOTION_TEST"], {
              currency_code: "usd",
              customer: {
                customer_group: {
                  id: "VIP",
                },
              },
              items: [
                {
                  id: "item_cotton_tshirt",
                  quantity: 1,
                  subtotal: 100,
                  product_category: {
                    id: "catg_cotton",
                  },
                  product: {
                    id: "prod_tshirt",
                  },
                },
                {
                  id: "item_cotton_sweater",
                  quantity: 5,
                  subtotal: 750,
                  product_category: {
                    id: "catg_cotton",
                  },
                  product: {
                    id: "prod_sweater",
                  },
                },
              ],
            })

            expect(JSON.parse(JSON.stringify(result))).toEqual([
              {
                action: "addItemAdjustment",
                item_id: "item_cotton_tshirt",
                amount: 10,
                code: "PROMOTION_TEST",
                is_tax_inclusive: false,
              },
              {
                action: "addItemAdjustment",
                item_id: "item_cotton_sweater",
                amount: 15,
                code: "PROMOTION_TEST",
                is_tax_inclusive: false,
              },
            ])
          })

          it("should compute the correct item amendments when there are multiple promotions to apply", async () => {
            await createDefaultPromotion(service, {
              rules: [
                {
                  attribute: "customer.customer_group.id",
                  operator: "in",
                  values: ["VIP", "top100"],
                },
              ],
              application_method: {
                type: ApplicationMethodType.PERCENTAGE,
                target_type: "items",
                allocation: "each",
                value: 30,
                max_quantity: 2,
                target_rules: [
                  {
                    attribute: "product_category.id",
                    operator: "eq",
                    values: ["catg_cotton"],
                  },
                ],
              } as any,
            })

            await createDefaultPromotion(service, {
              code: "PROMOTION_TEST_2",
              rules: [
                {
                  attribute: "customer.customer_group.id",
                  operator: "in",
                  values: ["VIP", "top100"],
                },
              ],
              application_method: {
                type: ApplicationMethodType.PERCENTAGE,
                target_type: "items",
                allocation: "each",
                value: 10,
                max_quantity: 1,
                target_rules: [
                  {
                    attribute: "product_category.id",
                    operator: "eq",
                    values: ["catg_cotton"],
                  },
                ],
              } as any,
            })

            const result = await service.computeActions(
              ["PROMOTION_TEST", "PROMOTION_TEST_2"],
              {
                currency_code: "usd",
                customer: {
                  customer_group: {
                    id: "VIP",
                  },
                },
                items: [
                  {
                    id: "item_cotton_tshirt",
                    quantity: 3,
                    subtotal: 150,
                    product_category: {
                      id: "catg_cotton",
                    },
                    product: {
                      id: "prod_tshirt",
                    },
                  },
                  {
                    id: "item_cotton_sweater",
                    quantity: 1,
                    subtotal: 150,
                    product_category: {
                      id: "catg_cotton",
                    },
                    product: {
                      id: "prod_sweater",
                    },
                  },
                ],
              }
            )

            expect(JSON.parse(JSON.stringify(result))).toEqual([
              {
                action: "addItemAdjustment",
                item_id: "item_cotton_tshirt",
                amount: 30,
                code: "PROMOTION_TEST",
                is_tax_inclusive: false,
              },
              {
                action: "addItemAdjustment",
                item_id: "item_cotton_sweater",
                amount: 45,
                code: "PROMOTION_TEST",
                is_tax_inclusive: false,
              },
              {
                action: "addItemAdjustment",
                item_id: "item_cotton_tshirt",
                amount: 5,
                code: "PROMOTION_TEST_2",
                is_tax_inclusive: false,
              },
              {
                action: "addItemAdjustment",
                item_id: "item_cotton_sweater",
                amount: 10.5,
                code: "PROMOTION_TEST_2",
                is_tax_inclusive: false,
              },
            ])
          })

          it("should compute actions when 2 percentage promotions are applied to the same item", async () => {
            await createDefaultPromotion(service, {
              code: "PROMO_PERCENTAGE_1",
              rules: [],
              application_method: {
                type: ApplicationMethodType.PERCENTAGE,
                target_type: "items",
                allocation: "each",
                value: 100,
                max_quantity: 1,
                target_rules: [
                  {
                    attribute: "product.id",
                    operator: "eq",
                    values: ["prod_tshirt"],
                  },
                ],
              },
            })

            await createDefaultPromotion(service, {
              code: "PROMO_PERCENTAGE_2",
              rules: [],
              application_method: {
                type: ApplicationMethodType.PERCENTAGE,
                target_type: "items",
                allocation: "each",
                value: 100,
                max_quantity: 1,
                target_rules: [
                  {
                    attribute: "product.id",
                    operator: "eq",
                    values: ["prod_tshirt"],
                  },
                ],
              },
            })

            const result = await service.computeActions(
              ["PROMO_PERCENTAGE_1", "PROMO_PERCENTAGE_2"],
              {
                currency_code: "usd",
                items: [
                  {
                    id: "item_cotton_tshirt",
                    quantity: 4,
                    subtotal: 200,
                    product_category: {
                      id: "catg_cotton",
                    },
                    product: {
                      id: "prod_tshirt",
                    },
                  },
                ],
              }
            )

            expect(JSON.parse(JSON.stringify(result))).toEqual([
              {
                action: "addItemAdjustment",
                item_id: "item_cotton_tshirt",
                amount: 50,
                code: "PROMO_PERCENTAGE_1",
                is_tax_inclusive: false,
              },
              {
                action: "addItemAdjustment",
                item_id: "item_cotton_tshirt",
                amount: 50,
                code: "PROMO_PERCENTAGE_2",
                is_tax_inclusive: false,
              },
            ])
          })

          it("should not compute actions when applicable total is 0", async () => {
            await createDefaultPromotion(service, {
              rules: [
                {
                  attribute: "customer.customer_group.id",
                  operator: "in",
                  values: ["VIP", "top100"],
                },
              ],
              application_method: {
                type: ApplicationMethodType.PERCENTAGE,
                target_type: "items",
                allocation: "each",
                value: 100,
                max_quantity: 10,
                target_rules: [
                  {
                    attribute: "product_category.id",
                    operator: "eq",
                    values: ["catg_cotton"],
                  },
                ],
              } as any,
            })

            await createDefaultPromotion(service, {
              code: "PROMOTION_TEST_2",
              rules: [
                {
                  attribute: "customer.customer_group.id",
                  operator: "in",
                  values: ["VIP", "top100"],
                },
              ],
              application_method: {
                type: ApplicationMethodType.PERCENTAGE,
                target_type: "items",
                allocation: "each",
                value: 50,
                max_quantity: 10,
                target_rules: [
                  {
                    attribute: "product_category.id",
                    operator: "eq",
                    values: ["catg_cotton"],
                  },
                ],
              } as any,
            })

            const result = await service.computeActions(
              ["PROMOTION_TEST", "PROMOTION_TEST_2"],
              {
                currency_code: "usd",
                customer: {
                  customer_group: {
                    id: "VIP",
                  },
                },
                items: [
                  {
                    id: "item_cotton_tshirt",
                    quantity: 1,
                    subtotal: 50,
                    product_category: {
                      id: "catg_cotton",
                    },
                    product: {
                      id: "prod_tshirt",
                    },
                  },
                  {
                    id: "item_cotton_sweater",
                    quantity: 1,
                    subtotal: 150,
                    product_category: {
                      id: "catg_cotton",
                    },
                    product: {
                      id: "prod_sweater",
                    },
                  },
                ],
              }
            )

            expect(JSON.parse(JSON.stringify(result))).toEqual([
              {
                action: "addItemAdjustment",
                item_id: "item_cotton_tshirt",
                amount: 50,
                code: "PROMOTION_TEST",
                is_tax_inclusive: false,
              },
              {
                action: "addItemAdjustment",
                item_id: "item_cotton_sweater",
                amount: 150,
                code: "PROMOTION_TEST",
                is_tax_inclusive: false,
              },
            ])
          })

          it("should compute budget exceeded action when applicable total exceeds campaign budget for type spend", async () => {
            await createDefaultPromotion(service, {
              rules: [
                {
                  attribute: "customer.customer_group.id",
                  operator: "in",
                  values: ["VIP", "top100"],
                },
              ],
              application_method: {
                type: ApplicationMethodType.PERCENTAGE,
                target_type: "items",
                allocation: "each",
                value: 100,
                max_quantity: 5,
                target_rules: [
                  {
                    attribute: "product_category.id",
                    operator: "eq",
                    values: ["catg_cotton"],
                  },
                ],
              } as any,
            })

            const result = await service.computeActions(["PROMOTION_TEST"], {
              currency_code: "usd",
              customer: {
                customer_group: {
                  id: "VIP",
                },
              },
              items: [
                {
                  id: "item_cotton_tshirt",
                  quantity: 5,
                  subtotal: 10000,
                  product_category: {
                    id: "catg_cotton",
                  },
                  product: {
                    id: "prod_tshirt",
                  },
                },
              ],
            })

            expect(JSON.parse(JSON.stringify(result))).toEqual([
              { action: "campaignBudgetExceeded", code: "PROMOTION_TEST" },
            ])
          })

          it("should compute budget exceeded action when applicable total exceeds campaign budget for type usage", async () => {
            await createDefaultPromotion(service, {
              rules: [
                {
                  attribute: "customer.customer_group.id",
                  operator: "in",
                  values: ["VIP", "top100"],
                },
              ],
              campaign_id: "campaign-id-2",
              application_method: {
                type: ApplicationMethodType.PERCENTAGE,
                target_type: "items",
                allocation: "each",
                value: 100,
                max_quantity: 5,
                target_rules: [
                  {
                    attribute: "product_category.id",
                    operator: "eq",
                    values: ["catg_cotton"],
                  },
                ],
              } as any,
            })

            await service.updateCampaigns({
              id: "campaign-id-2",
              budget: { used: 1000 },
            })

            const result = await service.computeActions(["PROMOTION_TEST"], {
              currency_code: "usd",
              customer: {
                customer_group: {
                  id: "VIP",
                },
              },
              items: [
                {
                  id: "item_cotton_tshirt",
                  quantity: 5,
                  subtotal: 5000,
                  product_category: {
                    id: "catg_cotton",
                  },
                  product: {
                    id: "prod_tshirt",
                  },
                },
              ],
            })

            expect(JSON.parse(JSON.stringify(result))).toEqual([
              { action: "campaignBudgetExceeded", code: "PROMOTION_TEST" },
            ])
          })
        })
      })

      describe("when promotion is for items and allocation is across", () => {
        describe("when application type is fixed", () => {
          it("should compute the correct item amendments", async () => {
            await createDefaultPromotion(service, {
              rules: [
                {
                  attribute: "customer.customer_group.id",
                  operator: "in",
                  values: ["VIP", "top100"],
                },
              ],
              campaign_id: "campaign-id-2",
              application_method: {
                type: "fixed",
                target_type: "items",
                allocation: "across",
                value: 400,
                target_rules: [
                  {
                    attribute: "product_category.id",
                    operator: "eq",
                    values: ["catg_cotton"],
                  },
                ],
              } as any,
            })

            const result = await service.computeActions(["PROMOTION_TEST"], {
              currency_code: "usd",
              customer: {
                customer_group: {
                  id: "VIP",
                },
              },
              items: [
                {
                  id: "item_cotton_tshirt",
                  quantity: 2,
                  subtotal: 200,
                  product_category: {
                    id: "catg_cotton",
                  },
                  product: {
                    id: "prod_tshirt",
                  },
                },
                {
                  id: "item_cotton_sweater",
                  quantity: 2,
                  subtotal: 600,
                  product_category: {
                    id: "catg_cotton",
                  },
                  product: {
                    id: "prod_sweater",
                  },
                },
              ],
            })

            expect(JSON.parse(JSON.stringify(result))).toEqual([
              {
                action: "addItemAdjustment",
                item_id: "item_cotton_tshirt",
                amount: 100,
                code: "PROMOTION_TEST",
                is_tax_inclusive: false,
              },
              {
                action: "addItemAdjustment",
                item_id: "item_cotton_sweater",
                amount: 300,
                code: "PROMOTION_TEST",
                is_tax_inclusive: false,
              },
            ])
          })

          it("should compute the correct item amendments when promotion is automatic", async () => {
            await createDefaultPromotion(service, {
              rules: [
                {
                  attribute: "customer.customer_group.id",
                  operator: "in",
                  values: ["VIP", "top100"],
                },
              ],
              is_automatic: true,
              application_method: {
                type: "fixed",
                target_type: "items",
                allocation: "across",
                value: 400,
                target_rules: [
                  {
                    attribute: "product_category.id",
                    operator: "eq",
                    values: ["catg_cotton"],
                  },
                ],
              } as any,
            })

            const result = await service.computeActions([], {
              currency_code: "usd",
              customer: {
                customer_group: {
                  id: "VIP",
                },
              },
              items: [
                {
                  id: "item_cotton_tshirt",
                  quantity: 2,
                  subtotal: 200,
                  product_category: {
                    id: "catg_cotton",
                  },
                  product: {
                    id: "prod_tshirt",
                  },
                },
                {
                  id: "item_cotton_sweater",
                  quantity: 2,
                  subtotal: 600,
                  product_category: {
                    id: "catg_cotton",
                  },
                  product: {
                    id: "prod_sweater",
                  },
                },
              ],
            })

            expect(JSON.parse(JSON.stringify(result))).toEqual([
              {
                action: "addItemAdjustment",
                item_id: "item_cotton_tshirt",
                amount: 100,
                code: "PROMOTION_TEST",
                is_tax_inclusive: false,
              },
              {
                action: "addItemAdjustment",
                item_id: "item_cotton_sweater",
                amount: 300,
                code: "PROMOTION_TEST",
                is_tax_inclusive: false,
              },
            ])
          })

          it("should compute the correct item amendments when there are multiple promotions to apply", async () => {
            await createDefaultPromotion(service, {
              rules: [
                {
                  attribute: "customer.customer_group.id",
                  operator: "in",
                  values: ["VIP", "top100"],
                },
              ],
              application_method: {
                type: "fixed",
                target_type: "items",
                allocation: "across",
                value: 30,
                target_rules: [
                  {
                    attribute: "product_category.id",
                    operator: "eq",
                    values: ["catg_cotton"],
                  },
                ],
              } as any,
            })

            await createDefaultPromotion(service, {
              code: "PROMOTION_TEST_2",
              rules: [
                {
                  attribute: "customer.customer_group.id",
                  operator: "in",
                  values: ["VIP", "top100"],
                },
              ],
              is_automatic: true,
              application_method: {
                type: "fixed",
                target_type: "items",
                allocation: "across",
                value: 50,
                target_rules: [
                  {
                    attribute: "product_category.id",
                    operator: "eq",
                    values: ["catg_cotton"],
                  },
                ],
              } as any,
            })

            const result = await service.computeActions(
              ["PROMOTION_TEST", "PROMOTION_TEST_2"],
              {
                currency_code: "usd",
                customer: {
                  customer_group: {
                    id: "VIP",
                  },
                },
                items: [
                  {
                    id: "item_cotton_tshirt",
                    quantity: 1,
                    subtotal: 50,
                    product_category: {
                      id: "catg_cotton",
                    },
                    product: {
                      id: "prod_tshirt",
                    },
                  },
                  {
                    id: "item_cotton_sweater",
                    quantity: 1,
                    subtotal: 150,
                    product_category: {
                      id: "catg_cotton",
                    },
                    product: {
                      id: "prod_sweater",
                    },
                  },
                ],
              }
            )

            expect(JSON.parse(JSON.stringify(result))).toEqual([
              {
                action: "addItemAdjustment",
                item_id: "item_cotton_tshirt",
                amount: 12.5,
                code: "PROMOTION_TEST_2",
                is_tax_inclusive: false,
              },
              {
                action: "addItemAdjustment",
                item_id: "item_cotton_sweater",
                amount: 37.5,
                code: "PROMOTION_TEST_2",
                is_tax_inclusive: false,
              },
              {
                action: "addItemAdjustment",
                item_id: "item_cotton_tshirt",
                amount: 7.5,
                code: "PROMOTION_TEST",
                is_tax_inclusive: false,
              },
              {
                action: "addItemAdjustment",
                item_id: "item_cotton_sweater",
                amount: 22.5,
                code: "PROMOTION_TEST",
                is_tax_inclusive: false,
              },
            ])
          })

          it("should not compute actions when applicable total is 0", async () => {
            await createDefaultPromotion(service, {
              rules: [
                {
                  attribute: "customer.customer_group.id",
                  operator: "in",
                  values: ["VIP", "top100"],
                },
              ],
              application_method: {
                type: "fixed",
                target_type: "items",
                allocation: "across",
                value: 1000,
                target_rules: [
                  {
                    attribute: "product_category.id",
                    operator: "eq",
                    values: ["catg_cotton"],
                  },
                ],
              } as any,
            })

            await createDefaultPromotion(service, {
              code: "PROMOTION_TEST_2",
              rules: [
                {
                  attribute: "customer.customer_group.id",
                  operator: "in",
                  values: ["VIP", "top100"],
                },
              ],
              is_automatic: true,
              application_method: {
                type: "fixed",
                target_type: "items",
                allocation: "across",
                value: 50,
                target_rules: [
                  {
                    attribute: "product_category.id",
                    operator: "eq",
                    values: ["catg_cotton"],
                  },
                ],
              } as any,
            })

            const result = await service.computeActions(
              ["PROMOTION_TEST", "PROMOTION_TEST_2"],
              {
                currency_code: "usd",
                customer: {
                  customer_group: {
                    id: "VIP",
                  },
                },
                items: [
                  {
                    id: "item_cotton_tshirt",
                    quantity: 1,
                    subtotal: 50,
                    product_category: {
                      id: "catg_cotton",
                    },
                    product: {
                      id: "prod_tshirt",
                    },
                  },
                  {
                    id: "item_cotton_sweater",
                    quantity: 1,
                    subtotal: 150,
                    product_category: {
                      id: "catg_cotton",
                    },
                    product: {
                      id: "prod_sweater",
                    },
                  },
                ],
              }
            )

            expect(JSON.parse(JSON.stringify(result))).toEqual([
              {
                action: "addItemAdjustment",
                item_id: "item_cotton_tshirt",
                amount: 50,
                code: "PROMOTION_TEST",
                is_tax_inclusive: false,
              },
              {
                action: "addItemAdjustment",
                item_id: "item_cotton_sweater",
                amount: 150,
                code: "PROMOTION_TEST",
                is_tax_inclusive: false,
              },
            ])
          })

          it("should compute budget exceeded action when applicable total exceeds campaign budget for type spend", async () => {
            await createDefaultPromotion(service, {
              rules: [
                {
                  attribute: "customer.customer_group.id",
                  operator: "in",
                  values: ["VIP", "top100"],
                },
              ],
              application_method: {
                type: "fixed",
                target_type: "items",
                allocation: "across",
                value: 1500,
                target_rules: [
                  {
                    attribute: "product_category.id",
                    operator: "eq",
                    values: ["catg_cotton"],
                  },
                ],
              } as any,
            })

            const result = await service.computeActions(["PROMOTION_TEST"], {
              currency_code: "usd",
              customer: {
                customer_group: {
                  id: "VIP",
                },
              },
              items: [
                {
                  id: "item_cotton_tshirt",
                  quantity: 5,
                  subtotal: 5000,
                  product_category: {
                    id: "catg_cotton",
                  },
                  product: {
                    id: "prod_tshirt",
                  },
                },
              ],
            })

            expect(JSON.parse(JSON.stringify(result))).toEqual([
              { action: "campaignBudgetExceeded", code: "PROMOTION_TEST" },
            ])
          })

          it("should compute budget exceeded action when applicable total exceeds campaign budget for type usage", async () => {
            await createDefaultPromotion(service, {
              rules: [
                {
                  attribute: "customer.customer_group.id",
                  operator: "in",
                  values: ["VIP", "top100"],
                },
              ],
              campaign_id: "campaign-id-2",
              application_method: {
                type: "fixed",
                target_type: "items",
                allocation: "across",
                value: 500,
                target_rules: [
                  {
                    attribute: "product_category.id",
                    operator: "eq",
                    values: ["catg_cotton"],
                  },
                ],
              } as any,
            })

            await service.updateCampaigns({
              id: "campaign-id-2",
              budget: { used: 1000 },
            })

            const result = await service.computeActions(["PROMOTION_TEST"], {
              currency_code: "usd",
              customer: {
                customer_group: {
                  id: "VIP",
                },
              },
              items: [
                {
                  id: "item_cotton_tshirt",
                  quantity: 5,
                  subtotal: 5000,
                  product_category: {
                    id: "catg_cotton",
                  },
                  product: {
                    id: "prod_tshirt",
                  },
                },
              ],
            })

            expect(JSON.parse(JSON.stringify(result))).toEqual([
              { action: "campaignBudgetExceeded", code: "PROMOTION_TEST" },
            ])
          })
        })

        describe("when application type is percentage", () => {
          it("should compute the correct item amendments", async () => {
            await createDefaultPromotion(service, {
              rules: [
                {
                  attribute: "customer.customer_group.id",
                  operator: "in",
                  values: ["VIP", "top100"],
                },
              ],
              application_method: {
                type: ApplicationMethodType.PERCENTAGE,
                target_type: "items",
                allocation: "across",
                value: 10,
                target_rules: [
                  {
                    attribute: "product_category.id",
                    operator: "eq",
                    values: ["catg_cotton"],
                  },
                ],
              } as any,
            })

            const result = await service.computeActions(["PROMOTION_TEST"], {
              currency_code: "usd",
              customer: {
                customer_group: {
                  id: "VIP",
                },
              },
              items: [
                {
                  id: "item_cotton_tshirt",
                  quantity: 2,
                  subtotal: 200,
                  product_category: {
                    id: "catg_cotton",
                  },
                  product: {
                    id: "prod_tshirt",
                  },
                },
                {
                  id: "item_cotton_sweater",
                  quantity: 2,
                  subtotal: 600,
                  product_category: {
                    id: "catg_cotton",
                  },
                  product: {
                    id: "prod_sweater",
                  },
                },
              ],
            })

            expect(JSON.parse(JSON.stringify(result))).toEqual([
              {
                action: "addItemAdjustment",
                item_id: "item_cotton_tshirt",
                amount: 20,
                code: "PROMOTION_TEST",
                is_tax_inclusive: false,
              },
              {
                action: "addItemAdjustment",
                item_id: "item_cotton_sweater",
                amount: 60,
                code: "PROMOTION_TEST",
                is_tax_inclusive: false,
              },
            ])
          })

          it("should compute the correct item amendments when promotion is automatic", async () => {
            await createDefaultPromotion(service, {
              rules: [
                {
                  attribute: "customer.customer_group.id",
                  operator: "in",
                  values: ["VIP", "top100"],
                },
              ],
              is_automatic: true,
              application_method: {
                type: ApplicationMethodType.PERCENTAGE,
                target_type: "items",
                allocation: "across",
                value: 10,
                target_rules: [
                  {
                    attribute: "product_category.id",
                    operator: "eq",
                    values: ["catg_cotton"],
                  },
                ],
              } as any,
            })

            const result = await service.computeActions([], {
              currency_code: "usd",
              customer: {
                customer_group: {
                  id: "VIP",
                },
              },
              items: [
                {
                  id: "item_cotton_tshirt",
                  quantity: 2,
                  subtotal: 200,
                  product_category: {
                    id: "catg_cotton",
                  },
                  product: {
                    id: "prod_tshirt",
                  },
                },
                {
                  id: "item_cotton_sweater",
                  quantity: 2,
                  subtotal: 600,
                  product_category: {
                    id: "catg_cotton",
                  },
                  product: {
                    id: "prod_sweater",
                  },
                },
              ],
            })

            expect(JSON.parse(JSON.stringify(result))).toEqual([
              {
                action: "addItemAdjustment",
                item_id: "item_cotton_tshirt",
                amount: 20,
                code: "PROMOTION_TEST",
                is_tax_inclusive: false,
              },
              {
                action: "addItemAdjustment",
                item_id: "item_cotton_sweater",
                amount: 60,
                code: "PROMOTION_TEST",
                is_tax_inclusive: false,
              },
            ])
          })

          it("should compute the correct item amendments when there are multiple promotions to apply", async () => {
            await createDefaultPromotion(service, {
              rules: [
                {
                  attribute: "customer.customer_group.id",
                  operator: "in",
                  values: ["VIP", "top100"],
                },
              ],
              application_method: {
                type: ApplicationMethodType.PERCENTAGE,
                target_type: "items",
                allocation: "across",
                value: 10,
                target_rules: [
                  {
                    attribute: "product_category.id",
                    operator: "eq",
                    values: ["catg_cotton"],
                  },
                ],
              } as any,
            })

            await createDefaultPromotion(service, {
              code: "PROMOTION_TEST_2",
              rules: [
                {
                  attribute: "customer.customer_group.id",
                  operator: "in",
                  values: ["VIP", "top100"],
                },
              ],
              application_method: {
                type: ApplicationMethodType.PERCENTAGE,
                target_type: "items",
                allocation: "across",
                value: 10,
                target_rules: [
                  {
                    attribute: "product_category.id",
                    operator: "eq",
                    values: ["catg_cotton"],
                  },
                ],
              } as any,
            })

            const result = await service.computeActions(
              ["PROMOTION_TEST", "PROMOTION_TEST_2"],
              {
                currency_code: "usd",
                customer: {
                  customer_group: {
                    id: "VIP",
                  },
                },
                items: [
                  {
                    id: "item_cotton_tshirt",
                    quantity: 1,
                    subtotal: 50,
                    product_category: {
                      id: "catg_cotton",
                    },
                    product: {
                      id: "prod_tshirt",
                    },
                  },
                  {
                    id: "item_cotton_sweater",
                    quantity: 1,
                    subtotal: 150,
                    product_category: {
                      id: "catg_cotton",
                    },
                    product: {
                      id: "prod_sweater",
                    },
                  },
                ],
              }
            )

            expect(JSON.parse(JSON.stringify(result))).toEqual([
              {
                action: "addItemAdjustment",
                item_id: "item_cotton_tshirt",
                amount: 5,
                code: "PROMOTION_TEST",
                is_tax_inclusive: false,
              },
              {
                action: "addItemAdjustment",
                item_id: "item_cotton_sweater",
                amount: 15,
                code: "PROMOTION_TEST",
                is_tax_inclusive: false,
              },
              {
                action: "addItemAdjustment",
                item_id: "item_cotton_tshirt",
                amount: 4.5,
                code: "PROMOTION_TEST_2",
                is_tax_inclusive: false,
              },
              {
                action: "addItemAdjustment",
                item_id: "item_cotton_sweater",
                amount: 13.5,
                code: "PROMOTION_TEST_2",
                is_tax_inclusive: false,
              },
            ])
          })

          it("should compute actions when 2 percentage promotions are applied to the same item", async () => {
            await createDefaultPromotion(service, {
              code: "PROMO_PERCENTAGE_1",
              rules: [],
              application_method: {
                type: ApplicationMethodType.PERCENTAGE,
                target_type: "items",
                allocation: "across",
                value: 50,
                target_rules: [
                  {
                    attribute: "product.id",
                    operator: "eq",
                    values: ["prod_tshirt"],
                  },
                ],
              },
            })

            await createDefaultPromotion(service, {
              code: "PROMO_PERCENTAGE_2",
              rules: [],
              application_method: {
                type: ApplicationMethodType.PERCENTAGE,
                target_type: "items",
                allocation: "across",
                value: 50,
                target_rules: [
                  {
                    attribute: "product.id",
                    operator: "eq",
                    values: ["prod_tshirt"],
                  },
                ],
              },
            })

            const result = await service.computeActions(
              ["PROMO_PERCENTAGE_1", "PROMO_PERCENTAGE_2"],
              {
                currency_code: "usd",
                items: [
                  {
                    id: "item_cotton_tshirt",
                    quantity: 4,
                    subtotal: 300,
                    product: {
                      id: "prod_tshirt",
                    },
                  },
                  {
                    id: "item_wool_tshirt",
                    quantity: 4,
                    subtotal: 100,
                    product: {
                      id: "prod_tshirt",
                    },
                  },
                ],
              }
            )

            expect(JSON.parse(JSON.stringify(result))).toEqual([
              {
                action: "addItemAdjustment",
                item_id: "item_cotton_tshirt",
                amount: 150,
                code: "PROMO_PERCENTAGE_1",
                is_tax_inclusive: false,
              },
              {
                action: "addItemAdjustment",
                item_id: "item_wool_tshirt",
                amount: 50,
                code: "PROMO_PERCENTAGE_1",
                is_tax_inclusive: false,
              },
              {
                action: "addItemAdjustment",
                item_id: "item_cotton_tshirt",
                amount: 75,
                code: "PROMO_PERCENTAGE_2",
                is_tax_inclusive: false,
              },
              {
                action: "addItemAdjustment",
                item_id: "item_wool_tshirt",
                amount: 25,
                code: "PROMO_PERCENTAGE_2",
                is_tax_inclusive: false,
              },
            ])

            await createDefaultPromotion(service, {
              code: "PROMO_PERCENTAGE_3",
              rules: [],
              application_method: {
                type: ApplicationMethodType.PERCENTAGE,
                target_type: "items",
                allocation: "across",
                value: 100,
                target_rules: [
                  {
                    attribute: "product.id",
                    operator: "eq",
                    values: ["prod_tshirt"],
                  },
                ],
              },
            })

            const result2 = await service.computeActions(
              [
                "PROMO_PERCENTAGE_1",
                "PROMO_PERCENTAGE_2",
                "PROMO_PERCENTAGE_3",
              ],
              {
                currency_code: "usd",
                items: [
                  {
                    id: "item_cotton_tshirt",
                    quantity: 4,
                    subtotal: 300,
                    product: {
                      id: "prod_tshirt",
                    },
                  },
                  {
                    id: "item_wool_tshirt",
                    quantity: 4,
                    subtotal: 100,
                    product: {
                      id: "prod_tshirt",
                    },
                  },
                ],
              }
            )

            // Should only apply the most valuable promotion (100% off - PROMO_PERCENTAGE_3) that covers
            // the entire total of the line item
            expect(JSON.parse(JSON.stringify(result2))).toEqual([
              {
                action: "addItemAdjustment",
                item_id: "item_cotton_tshirt",
                amount: 300,
                code: "PROMO_PERCENTAGE_3",
                is_tax_inclusive: false,
              },
              {
                action: "addItemAdjustment",
                item_id: "item_wool_tshirt",
                amount: 100,
                code: "PROMO_PERCENTAGE_3",
                is_tax_inclusive: false,
              },
            ])
          })

          it("should not compute actions when applicable total is 0", async () => {
            await createDefaultPromotion(service, {
              rules: [
                {
                  attribute: "customer.customer_group.id",
                  operator: "in",
                  values: ["VIP", "top100"],
                },
              ],
              application_method: {
                type: ApplicationMethodType.PERCENTAGE,
                target_type: "items",
                allocation: "across",
                value: 10,
                target_rules: [
                  {
                    attribute: "product_category.id",
                    operator: "eq",
                    values: ["catg_cotton"],
                  },
                ],
              } as any,
            })

            await createDefaultPromotion(service, {
              code: "PROMOTION_TEST_2",
              rules: [
                {
                  attribute: "customer.customer_group.id",
                  operator: "in",
                  values: ["VIP", "top100"],
                },
              ],
              application_method: {
                type: ApplicationMethodType.PERCENTAGE,
                target_type: "items",
                allocation: "across",
                value: 10,
                target_rules: [
                  {
                    attribute: "product_category.id",
                    operator: "eq",
                    values: ["catg_cotton"],
                  },
                ],
              } as any,
            })

            const result = await service.computeActions(
              ["PROMOTION_TEST", "PROMOTION_TEST_2"],
              {
                currency_code: "usd",
                customer: {
                  customer_group: {
                    id: "VIP",
                  },
                },
                items: [
                  {
                    id: "item_cotton_tshirt",
                    quantity: 1,
                    subtotal: 50,
                    product_category: {
                      id: "catg_cotton",
                    },
                    product: {
                      id: "prod_tshirt",
                    },
                  },
                  {
                    id: "item_cotton_sweater",
                    quantity: 1,
                    subtotal: 150,
                    product_category: {
                      id: "catg_cotton",
                    },
                    product: {
                      id: "prod_sweater",
                    },
                  },
                ],
              }
            )

            expect(JSON.parse(JSON.stringify(result))).toEqual([
              {
                action: "addItemAdjustment",
                item_id: "item_cotton_tshirt",
                amount: 5,
                code: "PROMOTION_TEST",
                is_tax_inclusive: false,
              },
              {
                action: "addItemAdjustment",
                item_id: "item_cotton_sweater",
                amount: 15,
                code: "PROMOTION_TEST",
                is_tax_inclusive: false,
              },
              {
                action: "addItemAdjustment",
                item_id: "item_cotton_tshirt",
                amount: 4.5,
                code: "PROMOTION_TEST_2",
                is_tax_inclusive: false,
              },
              {
                action: "addItemAdjustment",
                item_id: "item_cotton_sweater",
                amount: 13.5,
                code: "PROMOTION_TEST_2",
                is_tax_inclusive: false,
              },
            ])
          })

          it("should compute budget exceeded action when applicable total exceeds campaign budget for type spend", async () => {
            await createDefaultPromotion(service, {
              rules: [
                {
                  attribute: "customer.customer_group.id",
                  operator: "in",
                  values: ["VIP", "top100"],
                },
              ],
              application_method: {
                type: ApplicationMethodType.PERCENTAGE,
                target_type: "items",
                allocation: "across",
                value: 100,
                target_rules: [
                  {
                    attribute: "product_category.id",
                    operator: "eq",
                    values: ["catg_cotton"],
                  },
                ],
              } as any,
            })

            const result = await service.computeActions(["PROMOTION_TEST"], {
              currency_code: "usd",
              customer: {
                customer_group: {
                  id: "VIP",
                },
              },
              items: [
                {
                  id: "item_cotton_tshirt",
                  quantity: 5,
                  subtotal: 5000,
                  product_category: {
                    id: "catg_cotton",
                  },
                  product: {
                    id: "prod_tshirt",
                  },
                },
              ],
            })

            expect(JSON.parse(JSON.stringify(result))).toEqual([
              { action: "campaignBudgetExceeded", code: "PROMOTION_TEST" },
            ])
          })

          it("should compute budget exceeded action when applicable total exceeds campaign budget for type usage", async () => {
            await createDefaultPromotion(service, {
              rules: [
                {
                  attribute: "customer.customer_group.id",
                  operator: "in",
                  values: ["VIP", "top100"],
                },
              ],
              campaign_id: "campaign-id-2",
              application_method: {
                type: ApplicationMethodType.PERCENTAGE,
                target_type: "items",
                allocation: "across",
                value: 10,
                target_rules: [
                  {
                    attribute: "product_category.id",
                    operator: "eq",
                    values: ["catg_cotton"],
                  },
                ],
              } as any,
            })

            await service.updateCampaigns({
              id: "campaign-id-2",
              budget: { used: 1000 },
            })

            const result = await service.computeActions(["PROMOTION_TEST"], {
              currency_code: "usd",
              customer: {
                customer_group: {
                  id: "VIP",
                },
              },
              items: [
                {
                  id: "item_cotton_tshirt",
                  quantity: 5,
                  subtotal: 5000,
                  product_category: {
                    id: "catg_cotton",
                  },
                  product: {
                    id: "prod_tshirt",
                  },
                },
              ],
            })

            expect(JSON.parse(JSON.stringify(result))).toEqual([
              { action: "campaignBudgetExceeded", code: "PROMOTION_TEST" },
            ])
          })
        })
      })

      describe("when promotion is for shipping_method and allocation is each", () => {
        describe("when application type is fixed", () => {
          it("should compute the correct shipping_method amendments", async () => {
            await createDefaultPromotion(service, {
              rules: [
                {
                  attribute: "customer.customer_group.id",
                  operator: "in",
                  values: ["VIP", "top100"],
                },
              ],
              application_method: {
                type: "fixed",
                target_type: "shipping_methods",
                allocation: "each",
                value: 200,
                max_quantity: 2,
                target_rules: [
                  {
                    attribute: "shipping_option.id",
                    operator: "in",
                    values: ["express", "standard"],
                  },
                ],
              } as any,
            })

            const result = await service.computeActions(["PROMOTION_TEST"], {
              currency_code: "usd",
              customer: {
                customer_group: {
                  id: "VIP",
                },
              },
              shipping_methods: [
                {
                  id: "shipping_method_express",
                  subtotal: 250,
                  shipping_option: {
                    id: "express",
                  },
                },
                {
                  id: "shipping_method_standard",
                  subtotal: 150,
                  shipping_option: {
                    id: "standard",
                  },
                },
                {
                  id: "shipping_method_snail",
                  subtotal: 200,
                  shipping_option: {
                    id: "snail",
                  },
                },
              ],
            })

            expect(JSON.parse(JSON.stringify(result))).toEqual([
              {
                action: "addShippingMethodAdjustment",
                shipping_method_id: "shipping_method_express",
                amount: 200,
                code: "PROMOTION_TEST",
              },
              {
                action: "addShippingMethodAdjustment",
                shipping_method_id: "shipping_method_standard",
                amount: 150,
                code: "PROMOTION_TEST",
              },
            ])
          })

          it("should compute the correct shipping_method amendments when promotion is automatic", async () => {
            await createDefaultPromotion(service, {
              rules: [
                {
                  attribute: "customer.customer_group.id",
                  operator: "in",
                  values: ["VIP", "top100"],
                },
              ],
              is_automatic: true,
              application_method: {
                type: "fixed",
                target_type: "shipping_methods",
                allocation: "each",
                value: 200,
                max_quantity: 2,
                target_rules: [
                  {
                    attribute: "shipping_option.id",
                    operator: "in",
                    values: ["express", "standard"],
                  },
                ],
              } as any,
            })

            const result = await service.computeActions([], {
              currency_code: "usd",
              customer: {
                customer_group: {
                  id: "VIP",
                },
              },
              shipping_methods: [
                {
                  id: "shipping_method_express",
                  subtotal: 250,
                  shipping_option: {
                    id: "express",
                  },
                },
                {
                  id: "shipping_method_standard",
                  subtotal: 150,
                  shipping_option: {
                    id: "standard",
                  },
                },
                {
                  id: "shipping_method_snail",
                  subtotal: 200,
                  shipping_option: {
                    id: "snail",
                  },
                },
              ],
            })

            expect(JSON.parse(JSON.stringify(result))).toEqual([
              {
                action: "addShippingMethodAdjustment",
                shipping_method_id: "shipping_method_express",
                amount: 200,
                code: "PROMOTION_TEST",
              },
              {
                action: "addShippingMethodAdjustment",
                shipping_method_id: "shipping_method_standard",
                amount: 150,
                code: "PROMOTION_TEST",
              },
            ])
          })

          it("should compute the correct shipping_method amendments when promotion is automatic and prevent_auto_promotions is false", async () => {
            await createDefaultPromotion(service, {
              rules: [
                {
                  attribute: "customer.customer_group.id",
                  operator: "in",
                  values: ["VIP", "top100"],
                },
              ],
              is_automatic: true,
              application_method: {
                type: "fixed",
                target_type: "shipping_methods",
                allocation: "each",
                value: 200,
                max_quantity: 2,
                target_rules: [
                  {
                    attribute: "shipping_option.id",
                    operator: "in",
                    values: ["express", "standard"],
                  },
                ],
              } as any,
            })

            const result = await service.computeActions(
              [],
              {
                currency_code: "usd",
                customer: {
                  customer_group: {
                    id: "VIP",
                  },
                },
                shipping_methods: [
                  {
                    id: "shipping_method_express",
                    subtotal: 250,
                    shipping_option: {
                      id: "express",
                    },
                  },
                  {
                    id: "shipping_method_standard",
                    subtotal: 150,
                    shipping_option: {
                      id: "standard",
                    },
                  },
                  {
                    id: "shipping_method_snail",
                    subtotal: 200,
                    shipping_option: {
                      id: "snail",
                    },
                  },
                ],
              },
              { prevent_auto_promotions: true }
            )

            expect(JSON.parse(JSON.stringify(result))).toEqual([])
          })

          it("should compute the correct item amendments when there are multiple promotions to apply", async () => {
            await createDefaultPromotion(service, {
              rules: [
                {
                  attribute: "customer.customer_group.id",
                  operator: "in",
                  values: ["VIP", "top100"],
                },
              ],
              application_method: {
                type: "fixed",
                target_type: "shipping_methods",
                allocation: "each",
                value: 200,
                max_quantity: 2,
                target_rules: [
                  {
                    attribute: "shipping_option.id",
                    operator: "in",
                    values: ["express", "standard"],
                  },
                ],
              } as any,
            })

            await createDefaultPromotion(service, {
              code: "PROMOTION_TEST_2",
              rules: [
                {
                  attribute: "customer.customer_group.id",
                  operator: "in",
                  values: ["VIP", "top100"],
                },
              ],
              application_method: {
                type: "fixed",
                target_type: "shipping_methods",
                allocation: "each",
                value: 200,
                max_quantity: 2,
                target_rules: [
                  {
                    attribute: "shipping_option.id",
                    operator: "in",
                    values: ["express", "standard"],
                  },
                ],
              } as any,
            })

            const result = await service.computeActions(
              ["PROMOTION_TEST", "PROMOTION_TEST_2"],
              {
                currency_code: "usd",
                customer: {
                  customer_group: {
                    id: "VIP",
                  },
                },
                shipping_methods: [
                  {
                    id: "shipping_method_express",
                    subtotal: 250,
                    shipping_option: {
                      id: "express",
                    },
                  },
                  {
                    id: "shipping_method_standard",
                    subtotal: 150,
                    shipping_option: {
                      id: "standard",
                    },
                  },
                  {
                    id: "shipping_method_snail",
                    subtotal: 200,
                    shipping_option: {
                      id: "snail",
                    },
                  },
                ],
              }
            )

            expect(JSON.parse(JSON.stringify(result))).toEqual([
              {
                action: "addShippingMethodAdjustment",
                shipping_method_id: "shipping_method_express",
                amount: 200,
                code: "PROMOTION_TEST",
              },
              {
                action: "addShippingMethodAdjustment",
                shipping_method_id: "shipping_method_standard",
                amount: 150,
                code: "PROMOTION_TEST",
              },
              {
                action: "addShippingMethodAdjustment",
                shipping_method_id: "shipping_method_express",
                amount: 50,
                code: "PROMOTION_TEST_2",
              },
            ])
          })

          it("should not compute actions when applicable total is 0", async () => {
            await createDefaultPromotion(service, {
              rules: [
                {
                  attribute: "customer.customer_group.id",
                  operator: "in",
                  values: ["VIP", "top100"],
                },
              ],
              application_method: {
                type: "fixed",
                target_type: "shipping_methods",
                allocation: "each",
                value: 500,
                max_quantity: 2,
                target_rules: [
                  {
                    attribute: "shipping_option.id",
                    operator: "in",
                    values: ["express", "standard"],
                  },
                ],
              } as any,
            })

            await createDefaultPromotion(service, {
              code: "PROMOTION_TEST_2",
              rules: [
                {
                  attribute: "customer.customer_group.id",
                  operator: "in",
                  values: ["VIP", "top100"],
                },
              ],
              application_method: {
                type: "fixed",
                target_type: "shipping_methods",
                allocation: "each",
                value: 200,
                max_quantity: 2,
                target_rules: [
                  {
                    attribute: "shipping_option.id",
                    operator: "in",
                    values: ["express", "standard"],
                  },
                ],
              } as any,
            })

            const result = await service.computeActions(
              ["PROMOTION_TEST", "PROMOTION_TEST_2"],
              {
                currency_code: "usd",
                customer: {
                  customer_group: {
                    id: "VIP",
                  },
                },
                shipping_methods: [
                  {
                    id: "shipping_method_express",
                    subtotal: 250,
                    shipping_option: {
                      id: "express",
                    },
                  },
                  {
                    id: "shipping_method_standard",
                    subtotal: 150,
                    shipping_option: {
                      id: "standard",
                    },
                  },
                  {
                    id: "shipping_method_snail",
                    subtotal: 200,
                    shipping_option: {
                      id: "snail",
                    },
                  },
                ],
              }
            )

            expect(JSON.parse(JSON.stringify(result))).toEqual([
              {
                action: "addShippingMethodAdjustment",
                shipping_method_id: "shipping_method_express",
                amount: 250,
                code: "PROMOTION_TEST",
              },
              {
                action: "addShippingMethodAdjustment",
                shipping_method_id: "shipping_method_standard",
                amount: 150,
                code: "PROMOTION_TEST",
              },
            ])
          })

          it("should compute budget exceeded action when applicable total exceeds campaign budget for type spend", async () => {
            await createDefaultPromotion(service, {
              rules: [
                {
                  attribute: "customer.customer_group.id",
                  operator: "in",
                  values: ["VIP", "top100"],
                },
              ],
              application_method: {
                type: "fixed",
                target_type: "shipping_methods",
                allocation: "each",
                value: 1200,
                max_quantity: 2,
                target_rules: [
                  {
                    attribute: "shipping_option.id",
                    operator: "in",
                    values: ["express", "standard"],
                  },
                ],
              } as any,
            })

            const result = await service.computeActions(["PROMOTION_TEST"], {
              currency_code: "usd",
              customer: {
                customer_group: {
                  id: "VIP",
                },
              },
              shipping_methods: [
                {
                  id: "shipping_method_express",
                  subtotal: 1200,
                  shipping_option: {
                    id: "express",
                  },
                },
              ],
            })

            expect(JSON.parse(JSON.stringify(result))).toEqual([
              { action: "campaignBudgetExceeded", code: "PROMOTION_TEST" },
            ])
          })

          it("should compute budget exceeded action when applicable total exceeds campaign budget for type usage", async () => {
            await createDefaultPromotion(service, {
              rules: [
                {
                  attribute: "customer.customer_group.id",
                  operator: "in",
                  values: ["VIP", "top100"],
                },
              ],
              campaign_id: "campaign-id-2",
              application_method: {
                type: "fixed",
                target_type: "shipping_methods",
                allocation: "each",
                value: 1200,
                max_quantity: 2,
                target_rules: [
                  {
                    attribute: "shipping_option.id",
                    operator: "in",
                    values: ["express", "standard"],
                  },
                ],
              } as any,
            })

            await service.updateCampaigns({
              id: "campaign-id-2",
              budget: { used: 1000 },
            })

            const result = await service.computeActions(["PROMOTION_TEST"], {
              currency_code: "usd",
              customer: {
                customer_group: {
                  id: "VIP",
                },
              },
              shipping_methods: [
                {
                  id: "shipping_method_express",
                  subtotal: 1200,
                  shipping_option: {
                    id: "express",
                  },
                },
              ],
            })

            expect(JSON.parse(JSON.stringify(result))).toEqual([
              { action: "campaignBudgetExceeded", code: "PROMOTION_TEST" },
            ])
          })
        })

        describe("when application type is percentage", () => {
          it("should compute the correct shipping_method amendments", async () => {
            await createDefaultPromotion(service, {
              rules: [
                {
                  attribute: "customer.customer_group.id",
                  operator: "in",
                  values: ["VIP", "top100"],
                },
              ],
              application_method: {
                type: ApplicationMethodType.PERCENTAGE,
                target_type: "shipping_methods",
                allocation: "each",
                value: 10,
                max_quantity: 2,
                target_rules: [
                  {
                    attribute: "shipping_option.id",
                    operator: "in",
                    values: ["express", "standard"],
                  },
                ],
              } as any,
            })

            const result = await service.computeActions(["PROMOTION_TEST"], {
              currency_code: "usd",
              customer: {
                customer_group: {
                  id: "VIP",
                },
              },
              shipping_methods: [
                {
                  id: "shipping_method_express",
                  subtotal: 250,
                  shipping_option: {
                    id: "express",
                  },
                },
                {
                  id: "shipping_method_standard",
                  subtotal: 150,
                  shipping_option: {
                    id: "standard",
                  },
                },
                {
                  id: "shipping_method_snail",
                  subtotal: 200,
                  shipping_option: {
                    id: "snail",
                  },
                },
              ],
            })

            expect(JSON.parse(JSON.stringify(result))).toEqual([
              {
                action: "addShippingMethodAdjustment",
                shipping_method_id: "shipping_method_express",
                amount: 25,
                code: "PROMOTION_TEST",
              },
              {
                action: "addShippingMethodAdjustment",
                shipping_method_id: "shipping_method_standard",
                amount: 15,
                code: "PROMOTION_TEST",
              },
            ])
          })

          it("should compute the correct shipping_method amendments when promotion is automatic", async () => {
            await createDefaultPromotion(service, {
              rules: [
                {
                  attribute: "customer.customer_group.id",
                  operator: "in",
                  values: ["VIP", "top100"],
                },
              ],
              is_automatic: true,
              application_method: {
                type: ApplicationMethodType.PERCENTAGE,
                target_type: "shipping_methods",
                allocation: "each",
                value: 10,
                max_quantity: 2,
                target_rules: [
                  {
                    attribute: "shipping_option.id",
                    operator: "in",
                    values: ["express", "standard"],
                  },
                ],
              } as any,
            })

            const result = await service.computeActions([], {
              currency_code: "usd",
              customer: {
                customer_group: {
                  id: "VIP",
                },
              },
              shipping_methods: [
                {
                  id: "shipping_method_express",
                  subtotal: 250,
                  shipping_option: {
                    id: "express",
                  },
                },
                {
                  id: "shipping_method_standard",
                  subtotal: 150,
                  shipping_option: {
                    id: "standard",
                  },
                },
                {
                  id: "shipping_method_snail",
                  subtotal: 200,
                  shipping_option: {
                    id: "snail",
                  },
                },
              ],
            })

            expect(JSON.parse(JSON.stringify(result))).toEqual([
              {
                action: "addShippingMethodAdjustment",
                shipping_method_id: "shipping_method_express",
                amount: 25,
                code: "PROMOTION_TEST",
              },
              {
                action: "addShippingMethodAdjustment",
                shipping_method_id: "shipping_method_standard",
                amount: 15,
                code: "PROMOTION_TEST",
              },
            ])
          })

          it("should compute the correct shipping_method amendments when promotion is automatic and prevent_auto_promotions is false", async () => {
            await createDefaultPromotion(service, {
              rules: [
                {
                  attribute: "customer.customer_group.id",
                  operator: "in",
                  values: ["VIP", "top100"],
                },
              ],
              is_automatic: true,
              application_method: {
                type: ApplicationMethodType.PERCENTAGE,
                target_type: "shipping_methods",
                allocation: "each",
                value: 10,
                max_quantity: 2,
                target_rules: [
                  {
                    attribute: "shipping_option.id",
                    operator: "in",
                    values: ["express", "standard"],
                  },
                ],
              } as any,
            })

            const result = await service.computeActions(
              [],
              {
                currency_code: "usd",
                customer: {
                  customer_group: {
                    id: "VIP",
                  },
                },
                shipping_methods: [
                  {
                    id: "shipping_method_express",
                    subtotal: 250,
                    shipping_option: {
                      id: "express",
                    },
                  },
                  {
                    id: "shipping_method_standard",
                    subtotal: 150,
                    shipping_option: {
                      id: "standard",
                    },
                  },
                  {
                    id: "shipping_method_snail",
                    subtotal: 200,
                    shipping_option: {
                      id: "snail",
                    },
                  },
                ],
              },
              { prevent_auto_promotions: true }
            )

            expect(JSON.parse(JSON.stringify(result))).toEqual([])
          })

          it("should compute the correct item amendments when there are multiple promotions to apply", async () => {
            await createDefaultPromotion(service, {
              rules: [
                {
                  attribute: "customer.customer_group.id",
                  operator: "in",
                  values: ["VIP", "top100"],
                },
              ],
              application_method: {
                type: ApplicationMethodType.PERCENTAGE,
                target_type: "shipping_methods",
                allocation: "each",
                value: 10,
                max_quantity: 2,
                target_rules: [
                  {
                    attribute: "shipping_option.id",
                    operator: "in",
                    values: ["express", "standard"],
                  },
                ],
              } as any,
            })

            await createDefaultPromotion(service, {
              code: "PROMOTION_TEST_2",
              rules: [
                {
                  attribute: "customer.customer_group.id",
                  operator: "in",
                  values: ["VIP", "top100"],
                },
              ],
              is_automatic: true,
              application_method: {
                type: ApplicationMethodType.PERCENTAGE,
                target_type: "shipping_methods",
                allocation: "each",
                value: 10,
                max_quantity: 2,
                target_rules: [
                  {
                    attribute: "shipping_option.id",
                    operator: "in",
                    values: ["express", "standard"],
                  },
                ],
              } as any,
            })

            const result = await service.computeActions(
              ["PROMOTION_TEST", "PROMOTION_TEST_2"],
              {
                currency_code: "usd",
                customer: {
                  customer_group: {
                    id: "VIP",
                  },
                },
                shipping_methods: [
                  {
                    id: "shipping_method_express",
                    subtotal: 250,
                    shipping_option: {
                      id: "express",
                    },
                  },
                  {
                    id: "shipping_method_standard",
                    subtotal: 150,
                    shipping_option: {
                      id: "standard",
                    },
                  },
                  {
                    id: "shipping_method_snail",
                    subtotal: 200,
                    shipping_option: {
                      id: "snail",
                    },
                  },
                ],
              }
            )

            expect(JSON.parse(JSON.stringify(result))).toEqual([
              {
                action: "addShippingMethodAdjustment",
                shipping_method_id: "shipping_method_express",
                amount: 25,
                code: "PROMOTION_TEST",
              },
              {
                action: "addShippingMethodAdjustment",
                shipping_method_id: "shipping_method_standard",
                amount: 15,
                code: "PROMOTION_TEST",
              },
              {
                action: "addShippingMethodAdjustment",
                shipping_method_id: "shipping_method_express",
                amount: 22.5,
                code: "PROMOTION_TEST_2",
              },
              {
                action: "addShippingMethodAdjustment",
                shipping_method_id: "shipping_method_standard",
                amount: 13.5,
                code: "PROMOTION_TEST_2",
              },
            ])
          })

          it("should not compute actions when applicable total is 0", async () => {
            await createDefaultPromotion(service, {
              rules: [
                {
                  attribute: "customer.customer_group.id",
                  operator: "in",
                  values: ["VIP", "top100"],
                },
              ],
              application_method: {
                type: ApplicationMethodType.PERCENTAGE,
                target_type: "shipping_methods",
                allocation: "each",
                value: 10,
                max_quantity: 2,
                target_rules: [
                  {
                    attribute: "shipping_option.id",
                    operator: "in",
                    values: ["express", "standard"],
                  },
                ],
              } as any,
            })

            await createDefaultPromotion(service, {
              code: "PROMOTION_TEST_2",
              rules: [
                {
                  attribute: "customer.customer_group.id",
                  operator: "in",
                  values: ["VIP", "top100"],
                },
              ],
              application_method: {
                type: ApplicationMethodType.PERCENTAGE,
                target_type: "shipping_methods",
                allocation: "each",
                value: 10,
                max_quantity: 2,
                target_rules: [
                  {
                    attribute: "shipping_option.id",
                    operator: "in",
                    values: ["express", "standard"],
                  },
                ],
              } as any,
            })

            const result = await service.computeActions(
              ["PROMOTION_TEST", "PROMOTION_TEST_2"],
              {
                currency_code: "usd",
                customer: {
                  customer_group: {
                    id: "VIP",
                  },
                },
                shipping_methods: [
                  {
                    id: "shipping_method_express",
                    subtotal: 250,
                    shipping_option: {
                      id: "express",
                    },
                  },
                  {
                    id: "shipping_method_standard",
                    subtotal: 150,
                    shipping_option: {
                      id: "standard",
                    },
                  },
                  {
                    id: "shipping_method_snail",
                    subtotal: 200,
                    shipping_option: {
                      id: "snail",
                    },
                  },
                ],
              }
            )

            expect(JSON.parse(JSON.stringify(result))).toEqual([
              {
                action: "addShippingMethodAdjustment",
                shipping_method_id: "shipping_method_express",
                amount: 25,
                code: "PROMOTION_TEST",
              },
              {
                action: "addShippingMethodAdjustment",
                shipping_method_id: "shipping_method_standard",
                amount: 15,
                code: "PROMOTION_TEST",
              },
              {
                action: "addShippingMethodAdjustment",
                shipping_method_id: "shipping_method_express",
                amount: 22.5,
                code: "PROMOTION_TEST_2",
              },
              {
                action: "addShippingMethodAdjustment",
                shipping_method_id: "shipping_method_standard",
                amount: 13.5,
                code: "PROMOTION_TEST_2",
              },
            ])
          })

          it("should compute budget exceeded action when applicable total exceeds campaign budget for type spend", async () => {
            await createDefaultPromotion(service, {
              rules: [
                {
                  attribute: "customer.customer_group.id",
                  operator: "in",
                  values: ["VIP", "top100"],
                },
              ],
              application_method: {
                type: ApplicationMethodType.PERCENTAGE,
                target_type: "shipping_methods",
                allocation: "each",
                value: 100,
                max_quantity: 2,
                target_rules: [
                  {
                    attribute: "shipping_option.id",
                    operator: "in",
                    values: ["express", "standard"],
                  },
                ],
              } as any,
            })

            const result = await service.computeActions(["PROMOTION_TEST"], {
              currency_code: "usd",
              customer: {
                customer_group: {
                  id: "VIP",
                },
              },
              shipping_methods: [
                {
                  id: "shipping_method_express",
                  subtotal: 1200,
                  shipping_option: {
                    id: "express",
                  },
                },
              ],
            })

            expect(JSON.parse(JSON.stringify(result))).toEqual([
              { action: "campaignBudgetExceeded", code: "PROMOTION_TEST" },
            ])
          })

          it("should compute budget exceeded action when applicable total exceeds campaign budget for type usage", async () => {
            await createDefaultPromotion(service, {
              rules: [
                {
                  attribute: "customer.customer_group.id",
                  operator: "in",
                  values: ["VIP", "top100"],
                },
              ],
              campaign_id: "campaign-id-2",
              application_method: {
                type: ApplicationMethodType.PERCENTAGE,
                target_type: "shipping_methods",
                allocation: "each",
                value: 10,
                max_quantity: 2,
                target_rules: [
                  {
                    attribute: "shipping_option.id",
                    operator: "in",
                    values: ["express", "standard"],
                  },
                ],
              } as any,
            })

            await service.updateCampaigns({
              id: "campaign-id-2",
              budget: { used: 1000 },
            })

            const result = await service.computeActions(["PROMOTION_TEST"], {
              currency_code: "usd",
              customer: {
                customer_group: {
                  id: "VIP",
                },
              },
              shipping_methods: [
                {
                  id: "shipping_method_express",
                  subtotal: 1200,
                  shipping_option: {
                    id: "express",
                  },
                },
              ],
            })

            expect(JSON.parse(JSON.stringify(result))).toEqual([
              { action: "campaignBudgetExceeded", code: "PROMOTION_TEST" },
            ])
          })
        })
      })

      describe("when promotion is for shipping_method and allocation is across", () => {
        describe("when application type is fixed", () => {
          it("should compute the correct shipping_method amendments", async () => {
            await createDefaultPromotion(service, {
              rules: [
                {
                  attribute: "customer.customer_group.id",
                  operator: "in",
                  values: ["VIP", "top100"],
                },
              ],
              application_method: {
                type: ApplicationMethodType.FIXED,
                target_type: "shipping_methods",
                allocation: "across",
                value: 200,
                target_rules: [
                  {
                    attribute: "shipping_option.id",
                    operator: "in",
                    values: ["express", "standard"],
                  },
                ],
              } as any,
            })

            const result = await service.computeActions(["PROMOTION_TEST"], {
              currency_code: "usd",
              customer: {
                customer_group: {
                  id: "VIP",
                },
              },
              shipping_methods: [
                {
                  id: "shipping_method_express",
                  subtotal: 500,
                  shipping_option: {
                    id: "express",
                  },
                },
                {
                  id: "shipping_method_standard",
                  subtotal: 100,
                  shipping_option: {
                    id: "standard",
                  },
                },
                {
                  id: "shipping_method_snail",
                  subtotal: 200,
                  shipping_option: {
                    id: "snail",
                  },
                },
              ],
            })

            expect(JSON.parse(JSON.stringify(result))).toEqual([
              {
                action: "addShippingMethodAdjustment",
                shipping_method_id: "shipping_method_express",
                amount: 166.66666666666666,
                code: "PROMOTION_TEST",
              },
              {
                action: "addShippingMethodAdjustment",
                shipping_method_id: "shipping_method_standard",
                amount: 33.333333333333336,
                code: "PROMOTION_TEST",
              },
            ])
          })

          it("should compute the correct shipping_method amendments when promotion is automatic", async () => {
            await createDefaultPromotion(service, {
              rules: [
                {
                  attribute: "customer.customer_group.id",
                  operator: "in",
                  values: ["VIP", "top100"],
                },
              ],
              is_automatic: true,
              application_method: {
                type: ApplicationMethodType.FIXED,
                target_type: "shipping_methods",
                allocation: "across",
                value: 200,
                target_rules: [
                  {
                    attribute: "shipping_option.id",
                    operator: "in",
                    values: ["express", "standard"],
                  },
                ],
              } as any,
            })

            const result = await service.computeActions([], {
              currency_code: "usd",
              customer: {
                customer_group: {
                  id: "VIP",
                },
              },
              shipping_methods: [
                {
                  id: "shipping_method_express",
                  subtotal: 500,
                  shipping_option: {
                    id: "express",
                  },
                },
                {
                  id: "shipping_method_standard",
                  subtotal: 100,
                  shipping_option: {
                    id: "standard",
                  },
                },
                {
                  id: "shipping_method_snail",
                  subtotal: 200,
                  shipping_option: {
                    id: "snail",
                  },
                },
              ],
            })

            expect(JSON.parse(JSON.stringify(result))).toEqual([
              {
                action: "addShippingMethodAdjustment",
                shipping_method_id: "shipping_method_express",
                amount: 166.66666666666666,
                code: "PROMOTION_TEST",
              },
              {
                action: "addShippingMethodAdjustment",
                shipping_method_id: "shipping_method_standard",
                amount: 33.333333333333336,
                code: "PROMOTION_TEST",
              },
            ])
          })

          it("should compute the correct item amendments when there are multiple promotions to apply", async () => {
            await createDefaultPromotion(service, {
              rules: [
                {
                  attribute: "customer.customer_group.id",
                  operator: "in",
                  values: ["VIP", "top100"],
                },
              ],
              application_method: {
                type: ApplicationMethodType.FIXED,
                target_type: "shipping_methods",
                allocation: "across",
                value: 200,
                target_rules: [
                  {
                    attribute: "shipping_option.id",
                    operator: "in",
                    values: ["express", "standard"],
                  },
                ],
              } as any,
            })

            await createDefaultPromotion(service, {
              code: "PROMOTION_TEST_2",
              rules: [
                {
                  attribute: "customer.customer_group.id",
                  operator: "in",
                  values: ["VIP", "top100"],
                },
              ],
              application_method: {
                type: ApplicationMethodType.FIXED,
                target_type: "shipping_methods",
                allocation: "across",
                value: 200,
                target_rules: [
                  {
                    attribute: "shipping_option.id",
                    operator: "in",
                    values: ["express", "standard"],
                  },
                ],
              } as any,
            })

            const result = await service.computeActions(
              ["PROMOTION_TEST", "PROMOTION_TEST_2"],
              {
                currency_code: "usd",
                customer: {
                  customer_group: {
                    id: "VIP",
                  },
                },
                shipping_methods: [
                  {
                    id: "shipping_method_express",
                    subtotal: 500,
                    shipping_option: {
                      id: "express",
                    },
                  },
                  {
                    id: "shipping_method_standard",
                    subtotal: 100,
                    shipping_option: {
                      id: "standard",
                    },
                  },
                  {
                    id: "shipping_method_snail",
                    subtotal: 200,
                    shipping_option: {
                      id: "snail",
                    },
                  },
                ],
              }
            )

            expect(JSON.parse(JSON.stringify(result))).toEqual([
              {
                action: "addShippingMethodAdjustment",
                shipping_method_id: "shipping_method_express",
                amount: 166.66666666666666,
                code: "PROMOTION_TEST",
              },
              {
                action: "addShippingMethodAdjustment",
                shipping_method_id: "shipping_method_standard",
                amount: 33.333333333333336,
                code: "PROMOTION_TEST",
              },
              {
                action: "addShippingMethodAdjustment",
                shipping_method_id: "shipping_method_express",
                amount: 166.66666666666666,
                code: "PROMOTION_TEST_2",
              },
              {
                action: "addShippingMethodAdjustment",
                shipping_method_id: "shipping_method_standard",
                amount: 33.333333333333336,
                code: "PROMOTION_TEST_2",
              },
            ])
          })

          it("should not compute actions when applicable total is 0", async () => {
            await createDefaultPromotion(service, {
              rules: [
                {
                  attribute: "customer.customer_group.id",
                  operator: "in",
                  values: ["VIP", "top100"],
                },
              ],
              application_method: {
                type: ApplicationMethodType.FIXED,
                target_type: "shipping_methods",
                allocation: "across",
                value: 1000,
                target_rules: [
                  {
                    attribute: "shipping_option.id",
                    operator: "in",
                    values: ["express", "standard"],
                  },
                ],
              } as any,
            })

            await createDefaultPromotion(service, {
              code: "PROMOTION_TEST_2",
              rules: [
                {
                  attribute: "customer.customer_group.id",
                  operator: "in",
                  values: ["VIP", "top100"],
                },
              ],
              application_method: {
                type: ApplicationMethodType.FIXED,
                target_type: "shipping_methods",
                allocation: "across",
                value: 200,
                target_rules: [
                  {
                    attribute: "shipping_option.id",
                    operator: "in",
                    values: ["express", "standard"],
                  },
                ],
              } as any,
            })

            const result = await service.computeActions(
              ["PROMOTION_TEST", "PROMOTION_TEST_2"],
              {
                currency_code: "usd",
                customer: {
                  customer_group: {
                    id: "VIP",
                  },
                },
                shipping_methods: [
                  {
                    id: "shipping_method_express",
                    subtotal: 500,
                    shipping_option: {
                      id: "express",
                    },
                  },
                  {
                    id: "shipping_method_standard",
                    subtotal: 100,
                    shipping_option: {
                      id: "standard",
                    },
                  },
                  {
                    id: "shipping_method_snail",
                    subtotal: 200,
                    shipping_option: {
                      id: "snail",
                    },
                  },
                ],
              }
            )

            expect(JSON.parse(JSON.stringify(result))).toEqual([
              {
                action: "addShippingMethodAdjustment",
                shipping_method_id: "shipping_method_express",
                amount: 500,
                code: "PROMOTION_TEST",
              },
              {
                action: "addShippingMethodAdjustment",
                shipping_method_id: "shipping_method_standard",
                amount: 100,
                code: "PROMOTION_TEST",
              },
            ])
          })

          it("should compute budget exceeded action when applicable total exceeds campaign budget for type spend", async () => {
            await createDefaultPromotion(service, {
              rules: [
                {
                  attribute: "customer.customer_group.id",
                  operator: "in",
                  values: ["VIP", "top100"],
                },
              ],
              application_method: {
                type: ApplicationMethodType.FIXED,
                target_type: "shipping_methods",
                allocation: "across",
                value: 1200,
                target_rules: [
                  {
                    attribute: "shipping_option.id",
                    operator: "in",
                    values: ["express", "standard"],
                  },
                ],
              } as any,
            })

            const result = await service.computeActions(["PROMOTION_TEST"], {
              currency_code: "usd",
              customer: {
                customer_group: {
                  id: "VIP",
                },
              },
              shipping_methods: [
                {
                  id: "shipping_method_express",
                  subtotal: 1200,
                  shipping_option: {
                    id: "express",
                  },
                },
              ],
            })

            expect(JSON.parse(JSON.stringify(result))).toEqual([
              { action: "campaignBudgetExceeded", code: "PROMOTION_TEST" },
            ])
          })

          it("should compute budget exceeded action when applicable total exceeds campaign budget for type usage", async () => {
            await createDefaultPromotion(service, {
              rules: [
                {
                  attribute: "customer.customer_group.id",
                  operator: "in",
                  values: ["VIP", "top100"],
                },
              ],
              campaign_id: "campaign-id-2",
              application_method: {
                type: ApplicationMethodType.FIXED,
                target_type: "shipping_methods",
                allocation: "across",
                value: 1200,
                target_rules: [
                  {
                    attribute: "shipping_option.id",
                    operator: "in",
                    values: ["express", "standard"],
                  },
                ],
              } as any,
            })

            await service.updateCampaigns({
              id: "campaign-id-2",
              budget: { used: 1000 },
            })

            const result = await service.computeActions(["PROMOTION_TEST"], {
              currency_code: "usd",
              customer: {
                customer_group: {
                  id: "VIP",
                },
              },
              shipping_methods: [
                {
                  id: "shipping_method_express",
                  subtotal: 1200,
                  shipping_option: {
                    id: "express",
                  },
                },
              ],
            })

            expect(JSON.parse(JSON.stringify(result))).toEqual([
              { action: "campaignBudgetExceeded", code: "PROMOTION_TEST" },
            ])
          })
        })

        describe("when application type is percentage", () => {
          it("should compute the correct shipping_method amendments", async () => {
            await createDefaultPromotion(service, {
              rules: [
                {
                  attribute: "customer.customer_group.id",
                  operator: "in",
                  values: ["VIP", "top100"],
                },
              ],
              application_method: {
                type: ApplicationMethodType.PERCENTAGE,
                target_type: "shipping_methods",
                allocation: "across",
                value: 10,
                target_rules: [
                  {
                    attribute: "shipping_option.id",
                    operator: "in",
                    values: ["express", "standard"],
                  },
                ],
              } as any,
            })

            const result = await service.computeActions(["PROMOTION_TEST"], {
              currency_code: "usd",
              customer: {
                customer_group: {
                  id: "VIP",
                },
              },
              shipping_methods: [
                {
                  id: "shipping_method_express",
                  subtotal: 500,
                  shipping_option: {
                    id: "express",
                  },
                },
                {
                  id: "shipping_method_standard",
                  subtotal: 100,
                  shipping_option: {
                    id: "standard",
                  },
                },
                {
                  id: "shipping_method_snail",
                  subtotal: 200,
                  shipping_option: {
                    id: "snail",
                  },
                },
              ],
            })

            expect(JSON.parse(JSON.stringify(result))).toEqual([
              {
                action: "addShippingMethodAdjustment",
                shipping_method_id: "shipping_method_express",
                amount: 50,
                code: "PROMOTION_TEST",
              },
              {
                action: "addShippingMethodAdjustment",
                shipping_method_id: "shipping_method_standard",
                amount: 10,
                code: "PROMOTION_TEST",
              },
            ])
          })

          it("should compute the correct shipping_method amendments when promotion is automatic", async () => {
            await createDefaultPromotion(service, {
              rules: [
                {
                  attribute: "customer.customer_group.id",
                  operator: "in",
                  values: ["VIP", "top100"],
                },
              ],
              is_automatic: true,
              application_method: {
                type: ApplicationMethodType.PERCENTAGE,
                target_type: "shipping_methods",
                allocation: "across",
                value: 10,
                target_rules: [
                  {
                    attribute: "shipping_option.id",
                    operator: "in",
                    values: ["express", "standard"],
                  },
                ],
              } as any,
            })

            const result = await service.computeActions([], {
              currency_code: "usd",
              customer: {
                customer_group: {
                  id: "VIP",
                },
              },
              shipping_methods: [
                {
                  id: "shipping_method_express",
                  subtotal: 500,
                  shipping_option: {
                    id: "express",
                  },
                },
                {
                  id: "shipping_method_standard",
                  subtotal: 100,
                  shipping_option: {
                    id: "standard",
                  },
                },
                {
                  id: "shipping_method_snail",
                  subtotal: 200,
                  shipping_option: {
                    id: "snail",
                  },
                },
              ],
            })

            expect(JSON.parse(JSON.stringify(result))).toEqual([
              {
                action: "addShippingMethodAdjustment",
                shipping_method_id: "shipping_method_express",
                amount: 50,
                code: "PROMOTION_TEST",
              },
              {
                action: "addShippingMethodAdjustment",
                shipping_method_id: "shipping_method_standard",
                amount: 10,
                code: "PROMOTION_TEST",
              },
            ])
          })

          it("should compute the correct item amendments when there are multiple promotions to apply", async () => {
            await createDefaultPromotion(service, {
              rules: [
                {
                  attribute: "customer.customer_group.id",
                  operator: "in",
                  values: ["VIP", "top100"],
                },
              ],
              application_method: {
                type: ApplicationMethodType.PERCENTAGE,
                target_type: "shipping_methods",
                allocation: "across",
                value: 10,
                target_rules: [
                  {
                    attribute: "shipping_option.id",
                    operator: "in",
                    values: ["express", "standard"],
                  },
                ],
              } as any,
            })

            await createDefaultPromotion(service, {
              code: "PROMOTION_TEST_2",
              rules: [
                {
                  attribute: "customer.customer_group.id",
                  operator: "in",
                  values: ["VIP", "top100"],
                },
              ],
              application_method: {
                type: ApplicationMethodType.PERCENTAGE,
                target_type: "shipping_methods",
                allocation: "across",
                value: 10,
                target_rules: [
                  {
                    attribute: "shipping_option.id",
                    operator: "in",
                    values: ["express", "standard"],
                  },
                ],
              } as any,
            })

            const result = await service.computeActions(
              ["PROMOTION_TEST", "PROMOTION_TEST_2"],
              {
                currency_code: "usd",
                customer: {
                  customer_group: {
                    id: "VIP",
                  },
                },
                shipping_methods: [
                  {
                    id: "shipping_method_express",
                    subtotal: 500,
                    shipping_option: {
                      id: "express",
                    },
                  },
                  {
                    id: "shipping_method_standard",
                    subtotal: 100,
                    shipping_option: {
                      id: "standard",
                    },
                  },
                  {
                    id: "shipping_method_snail",
                    subtotal: 200,
                    shipping_option: {
                      id: "snail",
                    },
                  },
                ],
              }
            )

            expect(JSON.parse(JSON.stringify(result))).toEqual([
              {
                action: "addShippingMethodAdjustment",
                shipping_method_id: "shipping_method_express",
                amount: 50,
                code: "PROMOTION_TEST",
              },
              {
                action: "addShippingMethodAdjustment",
                shipping_method_id: "shipping_method_standard",
                amount: 10,
                code: "PROMOTION_TEST",
              },
              {
                action: "addShippingMethodAdjustment",
                shipping_method_id: "shipping_method_express",
                amount: 45,
                code: "PROMOTION_TEST_2",
              },
              {
                action: "addShippingMethodAdjustment",
                shipping_method_id: "shipping_method_standard",
                amount: 9,
                code: "PROMOTION_TEST_2",
              },
            ])
          })

          it("should not compute actions when applicable total is 0", async () => {
            await createDefaultPromotion(service, {
              rules: [
                {
                  attribute: "customer.customer_group.id",
                  operator: "in",
                  values: ["VIP", "top100"],
                },
              ],
              application_method: {
                type: ApplicationMethodType.PERCENTAGE,
                target_type: "shipping_methods",
                allocation: "across",
                value: 100,
                target_rules: [
                  {
                    attribute: "shipping_option.id",
                    operator: "in",
                    values: ["express", "standard"],
                  },
                ],
              } as any,
            })

            await createDefaultPromotion(service, {
              code: "PROMOTION_TEST_2",
              rules: [
                {
                  attribute: "customer.customer_group.id",
                  operator: "in",
                  values: ["VIP", "top100"],
                },
              ],
              application_method: {
                type: ApplicationMethodType.PERCENTAGE,
                target_type: "shipping_methods",
                allocation: "across",
                value: 10,
                target_rules: [
                  {
                    attribute: "shipping_option.id",
                    operator: "in",
                    values: ["express", "standard"],
                  },
                ],
              } as any,
            })

            const result = await service.computeActions(
              ["PROMOTION_TEST", "PROMOTION_TEST_2"],
              {
                currency_code: "usd",
                customer: {
                  customer_group: {
                    id: "VIP",
                  },
                },
                shipping_methods: [
                  {
                    id: "shipping_method_express",
                    subtotal: 500,
                    shipping_option: {
                      id: "express",
                    },
                  },
                  {
                    id: "shipping_method_standard",
                    subtotal: 100,
                    shipping_option: {
                      id: "standard",
                    },
                  },
                  {
                    id: "shipping_method_snail",
                    subtotal: 200,
                    shipping_option: {
                      id: "snail",
                    },
                  },
                ],
              }
            )

            expect(JSON.parse(JSON.stringify(result))).toEqual([
              {
                action: "addShippingMethodAdjustment",
                shipping_method_id: "shipping_method_express",
                amount: 500,
                code: "PROMOTION_TEST",
              },
              {
                action: "addShippingMethodAdjustment",
                shipping_method_id: "shipping_method_standard",
                amount: 100,
                code: "PROMOTION_TEST",
              },
            ])
          })

          it("should compute budget exceeded action when applicable total exceeds campaign budget for type spend", async () => {
            await createDefaultPromotion(service, {
              rules: [
                {
                  attribute: "customer.customer_group.id",
                  operator: "in",
                  values: ["VIP", "top100"],
                },
              ],
              campaign_id: "campaign-id-2",
              application_method: {
                type: ApplicationMethodType.PERCENTAGE,
                target_type: "shipping_methods",
                allocation: "across",
                value: 100,
                target_rules: [
                  {
                    attribute: "shipping_option.id",
                    operator: "in",
                    values: ["express", "standard"],
                  },
                ],
              } as any,
            })

            await service.updateCampaigns({
              id: "campaign-id-2",
              budget: { used: 1000 },
            })

            const result = await service.computeActions(["PROMOTION_TEST"], {
              currency_code: "usd",
              customer: {
                customer_group: {
                  id: "VIP",
                },
              },
              shipping_methods: [
                {
                  id: "shipping_method_express",
                  subtotal: 1200,
                  shipping_option: {
                    id: "express",
                  },
                },
              ],
            })

            expect(JSON.parse(JSON.stringify(result))).toEqual([
              { action: "campaignBudgetExceeded", code: "PROMOTION_TEST" },
            ])
          })

          it("should compute budget exceeded action when applicable total exceeds campaign budget for type usage", async () => {
            await createDefaultPromotion(service, {
              rules: [
                {
                  attribute: "customer.customer_group.id",
                  operator: "in",
                  values: ["VIP", "top100"],
                },
              ],
              campaign_id: "campaign-id-2",
              application_method: {
                type: ApplicationMethodType.PERCENTAGE,
                target_type: "shipping_methods",
                allocation: "across",
                value: 100,
                target_rules: [
                  {
                    attribute: "shipping_option.id",
                    operator: "in",
                    values: ["express", "standard"],
                  },
                ],
              } as any,
            })

            await service.updateCampaigns({
              id: "campaign-id-2",
              budget: { used: 1000 },
            })

            const result = await service.computeActions(["PROMOTION_TEST"], {
              currency_code: "usd",
              customer: {
                customer_group: {
                  id: "VIP",
                },
              },
              shipping_methods: [
                {
                  id: "shipping_method_express",
                  subtotal: 1200,
                  shipping_option: {
                    id: "express",
                  },
                },
              ],
            })

            expect(JSON.parse(JSON.stringify(result))).toEqual([
              { action: "campaignBudgetExceeded", code: "PROMOTION_TEST" },
            ])
          })
        })
      })

      describe("when promotion is for the entire order", () => {
        it("should compute the correct item amendments", async () => {
          await createDefaultPromotion(service, {
            rules: [
              {
                attribute: "customer.customer_group.id",
                operator: "in",
                values: ["VIP", "top100"],
              },
            ],
            application_method: {
              type: "fixed",
              target_type: "order",
              value: 200,
              max_quantity: 2,
              allocation: undefined,
            } as any,
          })

          const result = await service.computeActions(["PROMOTION_TEST"], {
            currency_code: "usd",
            customer: {
              customer_group: {
                id: "VIP",
              },
            },
            items: [
              {
                id: "item_cotton_tshirt",
                quantity: 1,
                subtotal: 100,
                product_category: {
                  id: "catg_cotton",
                },
                product: {
                  id: "prod_tshirt",
                },
              },
              {
                id: "item_cotton_sweater",
                quantity: 2,
                subtotal: 300,
                product_category: {
                  id: "catg_cotton",
                },
                product: {
                  id: "prod_sweater",
                },
              },
            ],
          } as any)

          expect(JSON.parse(JSON.stringify(result))).toEqual([
            {
              action: "addItemAdjustment",
              item_id: "item_cotton_tshirt",
              amount: 50,
              code: "PROMOTION_TEST",
              is_tax_inclusive: false,
            },
            {
              action: "addItemAdjustment",
              item_id: "item_cotton_sweater",
              amount: 150,
              code: "PROMOTION_TEST",
              is_tax_inclusive: false,
            },
          ])
        })

        it("should compute the correct item amendments when promotion is automatic", async () => {
          await createDefaultPromotion(service, {
            rules: [
              {
                attribute: "customer.customer_group.id",
                operator: "in",
                values: ["VIP", "top100"],
              },
            ],
            is_automatic: true,
            application_method: {
              type: "fixed",
              target_type: "order",
              value: 200,
              max_quantity: 2,
              allocation: undefined,
            } as any,
          })

          const result = await service.computeActions([], {
            currency_code: "usd",
            customer: {
              customer_group: {
                id: "VIP",
              },
            },
            items: [
              {
                id: "item_cotton_tshirt",
                is_discountable: true,
                quantity: 1,
                subtotal: 100,
                product_category: {
                  id: "catg_cotton",
                },
                product: {
                  id: "prod_tshirt",
                },
              },
              {
                id: "item_cotton_sweater",
                is_discountable: true,
                quantity: 2,
                subtotal: 300,
                product_category: {
                  id: "catg_cotton",
                },
                product: {
                  id: "prod_sweater",
                },
              },
            ],
          })

          expect(JSON.parse(JSON.stringify(result))).toEqual([
            {
              action: "addItemAdjustment",
              item_id: "item_cotton_tshirt",
              amount: 50,
              code: "PROMOTION_TEST",
              is_tax_inclusive: false,
            },
            {
              action: "addItemAdjustment",
              item_id: "item_cotton_sweater",
              amount: 150,
              code: "PROMOTION_TEST",
              is_tax_inclusive: false,
            },
          ])
        })

        it("should compute the correct item amendments when there are multiple promotions to apply", async () => {
          await createDefaultPromotion(service, {
            rules: [
              {
                attribute: "customer.customer_group.id",
                operator: "in",
                values: ["VIP", "top100"],
              },
            ],
            application_method: {
              type: "fixed",
              target_type: "order",
              value: 30,
              max_quantity: 2,
              allocation: undefined,
            } as any,
          })

          await createDefaultPromotion(service, {
            code: "PROMOTION_TEST_2",
            rules: [
              {
                attribute: "customer.customer_group.id",
                operator: "in",
                values: ["VIP", "top100"],
              },
            ],
            application_method: {
              type: "fixed",
              target_type: "order",
              value: 50,
              max_quantity: 1,
              allocation: undefined,
            } as any,
          })

          const result = await service.computeActions(
            ["PROMOTION_TEST", "PROMOTION_TEST_2"],
            {
              currency_code: "usd",
              customer: {
                customer_group: {
                  id: "VIP",
                },
              },
              items: [
                {
                  id: "item_cotton_tshirt",
                  quantity: 1,
                  subtotal: 50,
                  is_discountable: true,
                  product_category: {
                    id: "catg_cotton",
                  },
                  product: {
                    id: "prod_tshirt",
                  },
                },
                {
                  id: "item_cotton_sweater",
                  quantity: 1,
                  subtotal: 150,
                  is_discountable: true,
                  product_category: {
                    id: "catg_cotton",
                  },
                  product: {
                    id: "prod_sweater",
                  },
                },
              ],
            }
          )

          expect(JSON.parse(JSON.stringify(result))).toEqual([
            {
              action: "addItemAdjustment",
              item_id: "item_cotton_tshirt",
              amount: 12.5,
              code: "PROMOTION_TEST_2",
              is_tax_inclusive: false,
            },
            {
              action: "addItemAdjustment",
              item_id: "item_cotton_sweater",
              amount: 37.5,
              code: "PROMOTION_TEST_2",
              is_tax_inclusive: false,
            },
            {
              action: "addItemAdjustment",
              item_id: "item_cotton_tshirt",
              amount: 7.5,
              code: "PROMOTION_TEST",
              is_tax_inclusive: false,
            },
            {
              action: "addItemAdjustment",
              item_id: "item_cotton_sweater",
              amount: 22.5,
              code: "PROMOTION_TEST",
              is_tax_inclusive: false,
            },
          ])
        })

        it("should not compute actions when applicable total is 0", async () => {
          await createDefaultPromotion(service, {
            rules: [
              {
                attribute: "customer.customer_group.id",
                operator: "in",
                values: ["VIP", "top100"],
              },
            ],
            application_method: {
              type: "fixed",
              target_type: "order",
              value: 500,
              max_quantity: 2,
              allocation: undefined,
            } as any,
          })

          await createDefaultPromotion(service, {
            code: "PROMOTION_TEST_2",
            rules: [
              {
                attribute: "customer.customer_group.id",
                operator: "in",
                values: ["VIP", "top100"],
              },
            ],
            application_method: {
              type: "fixed",
              target_type: "order",
              value: 50,
              max_quantity: 1,
              allocation: undefined,
            } as any,
          })

          const result = await service.computeActions(
            ["PROMOTION_TEST", "PROMOTION_TEST_2"],
            {
              currency_code: "usd",
              customer: {
                customer_group: {
                  id: "VIP",
                },
              },
              items: [
                {
                  id: "item_cotton_tshirt",
                  quantity: 1,
                  subtotal: 50,
                  product_category: {
                    id: "catg_cotton",
                  },
                  product: {
                    id: "prod_tshirt",
                  },
                  is_discountable: true,
                },
                {
                  id: "item_cotton_sweater",
                  quantity: 1,
                  subtotal: 150,
                  product_category: {
                    id: "catg_cotton",
                  },
                  product: {
                    id: "prod_sweater",
                  },
                  is_discountable: true,
                },
              ],
            }
          )

          expect(JSON.parse(JSON.stringify(result))).toEqual([
            {
              action: "addItemAdjustment",
              item_id: "item_cotton_tshirt",
              amount: 50,
              code: "PROMOTION_TEST",
              is_tax_inclusive: false,
            },
            {
              action: "addItemAdjustment",
              item_id: "item_cotton_sweater",
              amount: 150,
              code: "PROMOTION_TEST",
              is_tax_inclusive: false,
            },
          ])
        })
      })

      describe("when adjustments are present in the context", () => {
        it("should compute the correct item amendments along with removal of applied item adjustment", async () => {
          await createDefaultPromotion(service, {
            code: "ADJUSTMENT_CODE",
          })

          await createDefaultPromotion(service, {
            rules: [
              {
                attribute: "customer.customer_group.id",
                operator: "in",
                values: ["VIP", "top100"],
              },
            ],
            application_method: {
              type: "fixed",
              target_type: "items",
              allocation: "each",
              value: 200,
              max_quantity: 1,
              target_rules: [
                {
                  attribute: "product_category.id",
                  operator: "eq",
                  values: ["catg_cotton"],
                },
              ],
            } as any,
          })

          const result = await service.computeActions(["PROMOTION_TEST"], {
            currency_code: "usd",
            customer: {
              customer_group: {
                id: "VIP",
              },
            },
            items: [
              {
                id: "item_cotton_tshirt",
                quantity: 1,
                subtotal: 100,
                is_discountable: true,
                product_category: {
                  id: "catg_cotton",
                },
                product: {
                  id: "prod_tshirt",
                },
                adjustments: [
                  {
                    id: "test-adjustment",
                    code: "ADJUSTMENT_CODE",
                  },
                ],
              },
              {
                id: "item_cotton_sweater",
                quantity: 5,
                subtotal: 750,
                is_discountable: true,
                product_category: {
                  id: "catg_cotton",
                },
                product: {
                  id: "prod_sweater",
                },
              },
            ],
          })

          expect(JSON.parse(JSON.stringify(result))).toEqual([
            {
              action: "removeItemAdjustment",
              adjustment_id: "test-adjustment",
              code: "ADJUSTMENT_CODE",
            },
            {
              action: "addItemAdjustment",
              item_id: "item_cotton_tshirt",
              amount: 100,
              code: "PROMOTION_TEST",
              is_tax_inclusive: false,
            },
            {
              action: "addItemAdjustment",
              item_id: "item_cotton_sweater",
              amount: 150,
              code: "PROMOTION_TEST",
              is_tax_inclusive: false,
            },
          ])
        })

        it("should compute the correct item amendments along with removal of applied shipping adjustment", async () => {
          await createDefaultPromotion(service, {
            code: "ADJUSTMENT_CODE",
          })

          await createDefaultPromotion(service, {
            rules: [
              {
                attribute: "customer.customer_group.id",
                operator: "in",
                values: ["VIP", "top100"],
              },
            ],
            application_method: {
              type: "fixed",
              target_type: "shipping_methods",
              allocation: "across",
              value: 200,
              max_quantity: undefined,
              target_rules: [
                {
                  attribute: "shipping_option.id",
                  operator: "in",
                  values: ["express", "standard"],
                },
              ],
            } as any,
          })

          const result = await service.computeActions(["PROMOTION_TEST"], {
            currency_code: "usd",
            customer: {
              customer_group: {
                id: "VIP",
              },
            },
            shipping_methods: [
              {
                id: "shipping_method_express",
                subtotal: 500,
                shipping_option: {
                  id: "express",
                },
                adjustments: [
                  {
                    id: "test-adjustment",
                    code: "ADJUSTMENT_CODE",
                  },
                ],
              },
              {
                id: "shipping_method_standard",
                subtotal: 100,
                shipping_option: {
                  id: "standard",
                },
              },
              {
                id: "shipping_method_snail",
                subtotal: 200,
                shipping_option: {
                  id: "snail",
                },
              },
            ],
          })

          expect(JSON.parse(JSON.stringify(result))).toEqual([
            {
              action: "removeShippingMethodAdjustment",
              adjustment_id: "test-adjustment",
              code: "ADJUSTMENT_CODE",
            },
            {
              action: "addShippingMethodAdjustment",
              shipping_method_id: "shipping_method_express",
              amount: 166.66666666666666,
              code: "PROMOTION_TEST",
            },
            {
              action: "addShippingMethodAdjustment",
              shipping_method_id: "shipping_method_standard",
              amount: 33.333333333333336,
              code: "PROMOTION_TEST",
            },
          ])
        })
      })

      describe("when promotion of type buyget", () => {
        it("should compute adjustment when target and buy rules match", async () => {
          const context = {
            currency_code: "usd",
            customer: {
              customer_group: {
                id: "VIP",
              },
            },
            items: [
              {
                id: "item_cotton_tshirt",
                quantity: 2,
                subtotal: 1000,
                product_category: {
                  id: "catg_tshirt",
                },
                product: {
                  id: "prod_tshirt_1",
                },
              },
              {
                id: "item_cotton_tshirt2",
                quantity: 2,
                subtotal: 2000,
                product_category: {
                  id: "catg_tshirt",
                },
                product: {
                  id: "prod_tshirt_2",
                },
              },
              {
                id: "item_cotton_sweater",
                quantity: 2,
                subtotal: 2000,
                product_category: {
                  id: "catg_sweater",
                },
                product: {
                  id: "prod_sweater_1",
                },
              },
            ],
          }

          await createDefaultPromotion(service, {
            type: PromotionType.BUYGET,
            rules: [
              {
                attribute: "customer.customer_group.id",
                operator: "in",
                values: ["VIP", "top100"],
              },
            ],
            application_method: {
              type: "percentage",
              target_type: "items",
              value: 100,
              allocation: "each",
              max_quantity: 100,
              apply_to_quantity: 1,
              buy_rules_min_quantity: 1,
              target_rules: [
                {
                  attribute: "product_category.id",
                  operator: "eq",
                  values: ["catg_tshirt"],
                },
              ],
              buy_rules: [
                {
                  attribute: "product_category.id",
                  operator: "eq",
                  values: ["catg_sweater"],
                },
              ],
            } as any,
          })

          const result = await service.computeActions(
            ["PROMOTION_TEST"],
            context
          )

          expect(JSON.parse(JSON.stringify(result))).toEqual([
            {
              action: "addItemAdjustment",
              item_id: "item_cotton_tshirt2",
              amount: 2000,
              code: "PROMOTION_TEST",
            },
          ])
        })

        it("should return empty array when conditions for minimum qty aren't met", async () => {
          const context = {
            currency_code: "usd",
            customer: {
              customer_group: {
                id: "VIP",
              },
            },
            items: [
              {
                id: "item_cotton_tshirt",
                quantity: 2,
                subtotal: 1000,
                product_category: {
                  id: "catg_tshirt",
                },
                product: {
                  id: "prod_tshirt_1",
                },
              },
              {
                id: "item_cotton_tshirt2",
                quantity: 2,
                subtotal: 2000,
                product_category: {
                  id: "catg_tshirt",
                },
                product: {
                  id: "prod_tshirt_2",
                },
              },
              {
                id: "item_cotton_sweater",
                quantity: 2,
                subtotal: 2000,
                product_category: {
                  id: "catg_sweater",
                },
                product: {
                  id: "prod_sweater_1",
                },
              },
            ],
          }

          await createDefaultPromotion(service, {
            type: PromotionType.BUYGET,
            rules: [
              {
                attribute: "customer.customer_group.id",
                operator: "in",
                values: ["VIP", "top100"],
              },
            ],
            application_method: {
              type: "fixed",
              target_type: "items",
              value: 1000,
              allocation: "each",
              max_quantity: 1,
              apply_to_quantity: 1,
              buy_rules_min_quantity: 4,
              target_rules: [
                {
                  attribute: "product_category.id",
                  operator: "eq",
                  values: ["catg_tshirt"],
                },
              ],
              buy_rules: [
                {
                  attribute: "product_category.id",
                  operator: "eq",
                  values: ["catg_sweater"],
                },
              ],
            } as any,
          })

          const result = await service.computeActions(
            ["PROMOTION_TEST"],
            context
          )

          expect(JSON.parse(JSON.stringify(result))).toEqual([])
        })

        it("should compute actions for multiple items when conditions for target qty exceed one item", async () => {
          const context = {
            currency_code: "usd",
            customer: {
              customer_group: {
                id: "VIP",
              },
            },
            items: [
              {
                id: "item_cotton_tshirt",
                quantity: 2,
                subtotal: 1000,
                product_category: {
                  id: "catg_tshirt",
                },
                product: {
                  id: "prod_tshirt_1",
                },
              },
              {
                id: "item_cotton_tshirt2",
                quantity: 2,
                subtotal: 2000,
                product_category: {
                  id: "catg_tshirt",
                },
                product: {
                  id: "prod_tshirt_2",
                },
              },
              {
                id: "item_cotton_sweater",
                quantity: 2,
                subtotal: 2000,
                product_category: {
                  id: "catg_sweater",
                },
                product: {
                  id: "prod_sweater_1",
                },
              },
            ],
          }

          await createDefaultPromotion(service, {
            type: PromotionType.BUYGET,
            rules: [
              {
                attribute: "customer.customer_group.id",
                operator: "in",
                values: ["VIP", "top100"],
              },
            ],
            campaign_id: undefined,
            application_method: {
              type: "percentage",
              target_type: "items",
              allocation: "each",
              max_quantity: 100,
              value: 100,
              apply_to_quantity: 4,
              buy_rules_min_quantity: 1,
              target_rules: [
                {
                  attribute: "product_category.id",
                  operator: "eq",
                  values: ["catg_tshirt"],
                },
              ],
              buy_rules: [
                {
                  attribute: "product_category.id",
                  operator: "eq",
                  values: ["catg_sweater"],
                },
              ],
            } as any,
          })

          const result = await service.computeActions(
            ["PROMOTION_TEST"],
            context
          )

          expect(JSON.parse(JSON.stringify(result))).toEqual([
            {
              action: "addItemAdjustment",
              item_id: "item_cotton_tshirt2",
              amount: 2000,
              code: "PROMOTION_TEST",
            },
            {
              action: "addItemAdjustment",
              item_id: "item_cotton_tshirt",
              amount: 1000,
              code: "PROMOTION_TEST",
            },
          ])
        })

        it("should return empty array when target rules arent met with context", async () => {
          const context = {
            currency_code: "usd",
            customer: {
              customer_group: {
                id: "VIP",
              },
            },
            items: [
              {
                id: "item_cotton_tshirt",
                quantity: 2,
                subtotal: 1000,
                product_category: {
                  id: "catg_tshirt",
                },
                product: {
                  id: "prod_tshirt_1",
                },
              },
              {
                id: "item_cotton_tshirt2",
                quantity: 2,
                subtotal: 2000,
                product_category: {
                  id: "catg_tshirt",
                },
                product: {
                  id: "prod_tshirt_2",
                },
              },
              {
                id: "item_cotton_sweater",
                quantity: 2,
                subtotal: 2000,
                product_category: {
                  id: "catg_sweater",
                },
                product: {
                  id: "prod_sweater_1",
                },
              },
            ],
          }

          await createDefaultPromotion(service, {
            type: PromotionType.BUYGET,
            rules: [
              {
                attribute: "customer.customer_group.id",
                operator: "in",
                values: ["VIP", "top100"],
              },
            ],
            campaign_id: undefined,
            application_method: {
              type: "fixed",
              target_type: "items",
              allocation: "each",
              value: 1000,
              max_quantity: 4,
              apply_to_quantity: 4,
              buy_rules_min_quantity: 1,
              target_rules: [
                {
                  attribute: "product_category.id",
                  operator: "eq",
                  values: ["catg_not-found"],
                },
              ],
              buy_rules: [
                {
                  attribute: "product_category.id",
                  operator: "eq",
                  values: ["catg_sweater"],
                },
              ],
            } as any,
          })

          const result = await service.computeActions(
            ["PROMOTION_TEST"],
            context
          )

          expect(JSON.parse(JSON.stringify(result))).toEqual([])
        })

        describe("when scenario is buy x get x", () => {
          let buyXGetXPromotion
          let product1 = "prod_tshirt_1"
          let product2 = "prod_tshirt_2"

          beforeEach(async () => {
            buyXGetXPromotion = await createDefaultPromotion(service, {
              type: PromotionType.BUYGET,
              application_method: {
                type: "percentage",
                target_type: "items",
                value: 100,
                allocation: "each",
                max_quantity: 2,
                apply_to_quantity: 2,
                buy_rules_min_quantity: 2,
                target_rules: [
                  {
                    attribute: "product.id",
                    operator: "eq",
                    values: [product1],
                  },
                ],
                buy_rules: [
                  {
                    attribute: "product.id",
                    operator: "eq",
                    values: [product1],
                  },
                ],
              } as any,
            })
          })

          it("should compute adjustment accurately for a single item", async () => {
            const context = {
              currency_code: "usd",
              items: [
                {
                  id: "item_cotton_tshirt",
                  quantity: 4,
                  subtotal: 1000,
                  product: { id: product1 },
                },
                {
                  id: "item_cotton_tshirt2",
                  quantity: 2,
                  subtotal: 2000,
                  product: { id: product2 },
                },
              ],
            }

            const result = await service.computeActions(
              [buyXGetXPromotion.code!],
              context
            )

            expect(JSON.parse(JSON.stringify(result))).toEqual([
              {
                action: "addItemAdjustment",
                item_id: "item_cotton_tshirt",
                amount: 500,
                code: "PROMOTION_TEST",
              },
            ])
          })

          it("should handle 2+1 free promotion correctly for same product", async () => {
            const twoGetOneFreePromotion = await createDefaultPromotion(
              service,
              {
                code: "2PLUS1FREE",
                type: PromotionType.BUYGET,
                application_method: {
                  type: "percentage",
                  target_type: "items",
                  value: 100,
                  allocation: "each",
                  max_quantity: 10, // Allow multiple applications
                  apply_to_quantity: 1,
                  buy_rules_min_quantity: 2,
                  target_rules: [
                    {
                      attribute: "product.id",
                      operator: "eq",
                      values: [product1],
                    },
                  ],
                  buy_rules: [
                    {
                      attribute: "product.id",
                      operator: "eq",
                      values: [product1],
                    },
                  ],
                } as any,
              }
            )

            // Test with 2 items - should get no promotion (need at least 3 for 2+1)
            let context = {
              currency_code: "usd",
              items: [
                {
                  id: "item_1",
                  quantity: 2,
                  subtotal: 1000,
                  product: { id: product1 },
                },
              ],
            }

            let result = await service.computeActions(
              [twoGetOneFreePromotion.code!],
              context
            )

            expect(JSON.parse(JSON.stringify(result))).toEqual([])

            // Test with 3 items - should get 1 free
            context = {
              currency_code: "usd",
              items: [
                {
                  id: "item_1",
                  quantity: 3,
                  subtotal: 1500,
                  product: { id: product1 },
                },
              ],
            }

            result = await service.computeActions(
              [twoGetOneFreePromotion.code!],
              context
            )

            expect(JSON.parse(JSON.stringify(result))).toEqual([
              {
                action: "addItemAdjustment",
                item_id: "item_1",
                amount: 500, // 1 item * (1500/3) = 500
                code: "2PLUS1FREE",
              },
            ])

            // Test with 5 items - should get 1 free (not 2, as you need 6 for 2 free)
            context = {
              currency_code: "usd",
              items: [
                {
                  id: "item_1",
                  quantity: 5,
                  subtotal: 2500,
                  product: { id: product1 },
                },
              ],
            }

            result = await service.computeActions(
              [twoGetOneFreePromotion.code!],
              context
            )

            expect(JSON.parse(JSON.stringify(result))).toEqual([
              {
                action: "addItemAdjustment",
                item_id: "item_1",
                amount: 500, // 1 item * (2500/5) = 500
                code: "2PLUS1FREE",
              },
            ])

            // Test with 6 items - should get 2 free
            context = {
              currency_code: "usd",
              items: [
                {
                  id: "item_1",
                  quantity: 6,
                  subtotal: 3000,
                  product: { id: product1 },
                },
              ],
            }

            result = await service.computeActions(
              [twoGetOneFreePromotion.code!],
              context
            )

            expect(JSON.parse(JSON.stringify(result))).toEqual([
              {
                action: "addItemAdjustment",
                item_id: "item_1",
                amount: 1000, // 2 items * (3000/6) = 1000
                code: "2PLUS1FREE",
              },
            ])
          })

          it("should handle multiple 2+1 free promotions correctly for same product", async () => {
            // Apply 2+1 free promotion on the same product to a maximum of 2 items
            const firstTwoGetOneFreePromotion = await createDefaultPromotion(
              service,
              {
                code: "FIRST2PLUS1FREE",
                type: PromotionType.BUYGET,
                application_method: {
                  type: "percentage",
                  target_type: "items",
                  value: 100,
                  allocation: "each",
                  max_quantity: 2,
                  apply_to_quantity: 1,
                  buy_rules_min_quantity: 2,
                  target_rules: [
                    {
                      attribute: "product.id",
                      operator: "eq",
                      values: [product1],
                    },
                  ],
                  buy_rules: [
                    {
                      attribute: "product.id",
                      operator: "eq",
                      values: [product1],
                    },
                  ],
                } as any,
              }
            )

            // Apply 2+1 free promotion on the same product to a maximum of 1 item
            const secondTwoGetOneFreePromotion = await createDefaultPromotion(
              service,
              {
                code: "SECOND2PLUS1FREE",
                type: PromotionType.BUYGET,
                application_method: {
                  type: "percentage",
                  target_type: "items",
                  value: 100,
                  allocation: "each",
                  max_quantity: 1,
                  apply_to_quantity: 1,
                  buy_rules_min_quantity: 2,
                  target_rules: [
                    {
                      attribute: "product.id",
                      operator: "eq",
                      values: [product1],
                    },
                  ],
                  buy_rules: [
                    {
                      attribute: "product.id",
                      operator: "eq",
                      values: [product1],
                    },
                  ],
                } as any,
              }
            )

            // Test with 3 items - should get 1 free from first promotion (2 buy + 1 target)
            let context = {
              currency_code: "usd",
              items: [
                {
                  id: "item_1",
                  quantity: 3,
                  subtotal: 1500,
                  product: { id: product1 },
                },
              ],
            }

            let result = await service.computeActions(
              [
                firstTwoGetOneFreePromotion.code!,
                secondTwoGetOneFreePromotion.code!,
              ],
              context
            )

            // Only first promotion should apply (3 items: 2 buy + 1 target = 3, no items left for second)
            expect(JSON.parse(JSON.stringify(result))).toEqual([
              {
                action: "addItemAdjustment",
                item_id: "item_1",
                amount: 500, // 1 item * (1500/3) = 500
                code: "FIRST2PLUS1FREE",
              },
            ])

            // Test with 6 items - should get 2 free total (2 from first promotion and 1 from second promotion)
            context = {
              currency_code: "usd",
              items: [
                {
                  id: "item_1",
                  quantity: 6,
                  subtotal: 3000,
                  product: { id: product1 },
                },
              ],
            }

            result = await service.computeActions(
              [
                firstTwoGetOneFreePromotion.code!,
                secondTwoGetOneFreePromotion.code!,
              ],
              context
            )

            // Both promotions should apply: 6 items allows for 2 applications from first promotion and 1 from second promotion
            expect(JSON.parse(JSON.stringify(result))).toEqual([
              {
                action: "addItemAdjustment",
                item_id: "item_1",
                amount: 1000, // 2 item * (3000/6) = 1000
                code: "FIRST2PLUS1FREE",
              },
              {
                action: "addItemAdjustment",
                item_id: "item_1",
                amount: 500, // 1 item * (3000/6) = 500
                code: "SECOND2PLUS1FREE",
              },
            ])

            // Test with 7 items - should still get 2 free total (not 3) (2 from first promotion and 1 from second promotion)
            context = {
              currency_code: "usd",
              items: [
                {
                  id: "item_1",
                  quantity: 7,
                  subtotal: 3500,
                  product: { id: product1 },
                },
              ],
            }

            result = await service.computeActions(
              [
                firstTwoGetOneFreePromotion.code!,
                secondTwoGetOneFreePromotion.code!,
              ],
              context
            )

            // 7 items: first promotion uses 3 (2+1), second uses 3 (2+1), 1 item left over (2 from first promotion and 1 from second promotion)
            expect(JSON.parse(JSON.stringify(result))).toEqual([
              {
                action: "addItemAdjustment",
                item_id: "item_1",
                amount: 1000, // 2 item * (3500/7) = 1000
                code: "FIRST2PLUS1FREE",
              },
              {
                action: "addItemAdjustment",
                item_id: "item_1",
                amount: 500, // 1 item * (3500/7) = 500
                code: "SECOND2PLUS1FREE",
              },
            ])

            // Test with 9 items - should get 3 free total (2 from first promotion and 1 from second promotion)
            context = {
              currency_code: "usd",
              items: [
                {
                  id: "item_1",
                  quantity: 9,
                  subtotal: 4500,
                  product: { id: product1 },
                },
              ],
            }

            result = await service.computeActions(
              [
                firstTwoGetOneFreePromotion.code!,
                secondTwoGetOneFreePromotion.code!,
              ],
              context
            )

            // 9 items: first promotion can apply twice (6 items), second once (3 items) (2 from first promotion and 1 from second promotion)
            expect(JSON.parse(JSON.stringify(result))).toEqual([
              {
                action: "addItemAdjustment",
                item_id: "item_1",
                amount: 1000, // 2 items * (4500/9) = 1000
                code: "FIRST2PLUS1FREE",
              },
              {
                action: "addItemAdjustment",
                item_id: "item_1",
                amount: 500, // 1 item * (4500/9) = 500
                code: "SECOND2PLUS1FREE",
              },
            ])

            context = {
              currency_code: "usd",
              items: [
                {
                  id: "item_1",
                  quantity: 1000,
                  subtotal: 500000,
                  product: { id: product1 },
                },
              ],
            }

            result = await service.computeActions(
              [
                firstTwoGetOneFreePromotion.code!,
                secondTwoGetOneFreePromotion.code!,
              ],
              context
            )

            // 1000 items: first promotion can apply twice (6 items), second once (3 items) (2 from first promotion and 1 from second promotion)
            expect(JSON.parse(JSON.stringify(result))).toEqual([
              {
                action: "addItemAdjustment",
                item_id: "item_1",
                amount: 1000, // 2 items * (4500/9) = 1000
                code: "FIRST2PLUS1FREE",
              },
              {
                action: "addItemAdjustment",
                item_id: "item_1",
                amount: 500, // 1 item * (4500/9) = 500
                code: "SECOND2PLUS1FREE",
              },
            ])
          })

          it("should compute adjustment accurately for a single item when multiple buyget promos are applied", async () => {
            const buyXGetXPromotionBulk1 = await createDefaultPromotion(
              service,
              {
                code: "BUY50GET1000",
                type: PromotionType.BUYGET,
                campaign_id: null,
                application_method: {
                  type: "percentage",
                  target_type: "items",
                  value: 100,
                  allocation: "each",
                  max_quantity: 1000,
                  apply_to_quantity: 1000,
                  buy_rules_min_quantity: 50,
                  target_rules: [
                    {
                      attribute: "product.id",
                      operator: "eq",
                      values: [product1],
                    },
                  ],
                  buy_rules: [
                    {
                      attribute: "product.id",
                      operator: "eq",
                      values: [product1],
                    },
                  ],
                } as any,
              }
            )

            const buyXGetXPromotionBulk2 = await createDefaultPromotion(
              service,
              {
                code: "BUY10GET200",
                type: PromotionType.BUYGET,
                campaign_id: null,
                application_method: {
                  type: "percentage",
                  target_type: "items",
                  value: 20,
                  allocation: "each",
                  max_quantity: 20,
                  apply_to_quantity: 20,
                  buy_rules_min_quantity: 10,
                  target_rules: [
                    {
                      attribute: "product.id",
                      operator: "eq",
                      values: [product1],
                    },
                  ],
                  buy_rules: [
                    {
                      attribute: "product.id",
                      operator: "eq",
                      values: [product1],
                    },
                  ],
                } as any,
              }
            )

            const context = {
              currency_code: "usd",
              items: [
                {
                  id: "item_cotton_tshirt",
                  quantity: 1080,
                  subtotal: 2700,
                  product: { id: product1 },
                },
              ],
            }

            const result = await service.computeActions(
              [buyXGetXPromotionBulk1.code!, buyXGetXPromotionBulk2.code!],
              context
            )

            expect(JSON.parse(JSON.stringify(result))).toEqual([
              {
                action: "addItemAdjustment",
                item_id: "item_cotton_tshirt",
                amount: 2500,
                code: "BUY50GET1000",
              },
              {
                action: "addItemAdjustment",
                amount: 10,
                code: "BUY10GET200",
                item_id: "item_cotton_tshirt",
              },
            ])
          })

          it("should compute adjustment accurately for multiple items when multiple buyget promos are applied", async () => {
            const buyXGetXPromotionBulk1 = await createDefaultPromotion(
              service,
              {
                code: "BUY50GET1000",
                type: PromotionType.BUYGET,
                campaign_id: null,
                application_method: {
                  type: "percentage",
                  target_type: "items",
                  value: 100,
                  allocation: "each",
                  max_quantity: 1000,
                  apply_to_quantity: 1000,
                  buy_rules_min_quantity: 50,
                  target_rules: [
                    {
                      attribute: "product.id",
                      operator: "eq",
                      values: [product1],
                    },
                  ],
                  buy_rules: [
                    {
                      attribute: "product.id",
                      operator: "eq",
                      values: [product1],
                    },
                  ],
                } as any,
              }
            )

            const buyXGetXPromotionBulk2 = await createDefaultPromotion(
              service,
              {
                code: "BUY10GET200",
                type: PromotionType.BUYGET,
                campaign_id: null,
                application_method: {
                  type: "percentage",
                  target_type: "items",
                  value: 20,
                  allocation: "each",
                  max_quantity: 20,
                  apply_to_quantity: 20,
                  buy_rules_min_quantity: 10,
                  target_rules: [
                    {
                      attribute: "product.id",
                      operator: "eq",
                      values: [product1],
                    },
                  ],
                  buy_rules: [
                    {
                      attribute: "product.id",
                      operator: "eq",
                      values: [product1],
                    },
                  ],
                } as any,
              }
            )

            const context = {
              currency_code: "usd",
              items: [
                {
                  id: "item_cotton_tshirt",
                  quantity: 540,
                  subtotal: 1350,
                  product: { id: product1 },
                },
                {
                  id: "item_cotton_tshirt2",
                  quantity: 540,
                  subtotal: 1350,
                  product: { id: product1 },
                },
              ],
            }

            const result = await service.computeActions(
              [buyXGetXPromotionBulk1.code!, buyXGetXPromotionBulk2.code!],
              context
            )

            const serializedResult = JSON.parse(JSON.stringify(result))

            expect(serializedResult).toHaveLength(3)
            expect(serializedResult).toEqual(
              expect.arrayContaining([
                {
                  action: "addItemAdjustment",
                  item_id: "item_cotton_tshirt2",
                  amount: 1225,
                  code: "BUY50GET1000",
                },
                {
                  action: "addItemAdjustment",
                  item_id: "item_cotton_tshirt",
                  amount: 1275,
                  code: "BUY50GET1000",
                },
                {
                  action: "addItemAdjustment",
                  item_id: "item_cotton_tshirt2",
                  amount: 10,
                  code: "BUY10GET200",
                },
              ])
            )
          })

          it("should apply buyget promotion multiple times until eligible quantity is exhausted", async () => {
            const buyProductId = "item_cotton_tshirt"
            const getProductId = "item_cotton_tshirt2"

            const buyXGetXPromotion = await createDefaultPromotion(service, {
              code: "TEST_BUYGET_PROMOTION",
              type: PromotionType.BUYGET,
              status: PromotionStatus.ACTIVE,
              is_tax_inclusive: false,
              is_automatic: false,
              application_method: {
                allocation: "each",
                value: 100,
                max_quantity: 100,
                type: "percentage",
                target_type: "items",
                apply_to_quantity: 1,
                buy_rules_min_quantity: 2,
                target_rules: [
                  {
                    operator: "eq",
                    attribute: "items.product.id",
                    values: [getProductId],
                  },
                ],
                buy_rules: [
                  {
                    operator: "eq",
                    attribute: "items.product.id",
                    values: [buyProductId],
                  },
                ],
              },
            })

            const buyXGetXPromotion2 = await createDefaultPromotion(service, {
              code: "TEST_BUYGET_PROMOTION_2",
              type: PromotionType.BUYGET,
              status: PromotionStatus.ACTIVE,
              is_tax_inclusive: false,
              is_automatic: false,
              application_method: {
                allocation: "each",
                value: 100,
                type: "percentage",
                target_type: "items",
                apply_to_quantity: 1,
                max_quantity: 100,
                buy_rules_min_quantity: 1,
                target_rules: [
                  {
                    operator: "eq",
                    attribute: "items.product.id",
                    values: [getProductId],
                  },
                ],
                buy_rules: [
                  {
                    operator: "eq",
                    attribute: "items.product.id",
                    values: [buyProductId],
                  },
                ],
              },
            })

            const context = {
              currency_code: "usd",
              items: [
                {
                  id: getProductId,
                  quantity: 11,
                  subtotal: 2750,
                  original_total: 2750,
                  is_discountable: true,
                  product: { id: getProductId },
                },
                {
                  id: buyProductId,
                  quantity: 11,
                  subtotal: 2750,
                  original_total: 2750,
                  is_discountable: true,
                  product: { id: buyProductId },
                },
              ],
            }

            const result = await service.computeActions(
              [buyXGetXPromotion.code!, buyXGetXPromotion2.code!],
              context
            )

            const serializedResult = JSON.parse(JSON.stringify(result))

            // The first promotion should apply until eligible quantities are exhausted (buy 2 get 1)
            // The second promotion should apply to the remaining quantity (buy 1 get 1)
            expect(serializedResult).toHaveLength(2)
            expect(serializedResult).toEqual(
              expect.arrayContaining([
                {
                  action: "addItemAdjustment",
                  item_id: getProductId,
                  amount: 1250,
                  code: buyXGetXPromotion.code!,
                },
                {
                  action: "addItemAdjustment",
                  item_id: "item_cotton_tshirt2",
                  amount: 250,
                  code: "TEST_BUYGET_PROMOTION_2",
                },
              ])
            )
          })

          it("should apply buyget promotion multiple times until max quantity is reached", async () => {
            const buyProductId = "item_cotton_tshirt"
            const getProductId = "item_cotton_tshirt2"

            const buyXGetXPromotion = await createDefaultPromotion(service, {
              code: "TEST_BUYGET_PROMOTION",
              type: PromotionType.BUYGET,
              status: PromotionStatus.ACTIVE,
              is_tax_inclusive: false,
              is_automatic: false,
              application_method: {
                allocation: "each",
                value: 100,
                type: "percentage",
                target_type: "items",
                apply_to_quantity: 1,
                max_quantity: 2,
                buy_rules_min_quantity: 2,
                target_rules: [
                  {
                    operator: "eq",
                    attribute: "items.product.id",
                    values: [getProductId],
                  },
                ],
                buy_rules: [
                  {
                    operator: "eq",
                    attribute: "items.product.id",
                    values: [buyProductId],
                  },
                ],
              },
            })

            const buyXGetXPromotion2 = await createDefaultPromotion(service, {
              code: "TEST_BUYGET_PROMOTION_2",
              type: PromotionType.BUYGET,
              status: PromotionStatus.ACTIVE,
              is_tax_inclusive: false,
              is_automatic: false,
              application_method: {
                allocation: "each",
                value: 100,
                type: "percentage",
                target_type: "items",
                apply_to_quantity: 1,
                max_quantity: 1,
                buy_rules_min_quantity: 1,
                target_rules: [
                  {
                    operator: "eq",
                    attribute: "items.product.id",
                    values: [getProductId],
                  },
                ],
                buy_rules: [
                  {
                    operator: "eq",
                    attribute: "items.product.id",
                    values: [buyProductId],
                  },
                ],
              },
            })

            const context = {
              currency_code: "usd",
              items: [
                {
                  id: getProductId,
                  quantity: 11,
                  subtotal: 2750,
                  original_total: 2750,
                  is_discountable: true,
                  product: { id: getProductId },
                },
                {
                  id: buyProductId,
                  quantity: 11,
                  subtotal: 2750,
                  original_total: 2750,
                  is_discountable: true,
                  product: { id: buyProductId },
                },
              ],
            }

            const result = await service.computeActions(
              [buyXGetXPromotion.code!, buyXGetXPromotion2.code!],
              context
            )

            const serializedResult = JSON.parse(JSON.stringify(result))

            expect(serializedResult).toHaveLength(2)
            expect(serializedResult).toEqual(
              expect.arrayContaining([
                {
                  action: "addItemAdjustment",
                  item_id: getProductId,
                  amount: 500,
                  code: buyXGetXPromotion.code!,
                },
                {
                  action: "addItemAdjustment",
                  item_id: getProductId,
                  amount: 250,
                  code: "TEST_BUYGET_PROMOTION_2",
                },
              ])
            )
          })

          it("should apply buyget promotion multiple times until eligible quantity is exhausted on a single item", async () => {
            const buyAndGetProductId = "item_cotton_tshirt"

            const buyXGetXPromotion = await createDefaultPromotion(service, {
              code: "TEST_BUYGET_PROMOTION",
              type: PromotionType.BUYGET,
              status: PromotionStatus.ACTIVE,
              is_tax_inclusive: false,
              is_automatic: false,
              application_method: {
                allocation: "each",
                value: 100,
                max_quantity: 100,
                type: "percentage",
                target_type: "items",
                apply_to_quantity: 1,
                buy_rules_min_quantity: 2,
                target_rules: [
                  {
                    operator: "eq",
                    attribute: "items.product.id",
                    values: [buyAndGetProductId],
                  },
                ],
                buy_rules: [
                  {
                    operator: "eq",
                    attribute: "items.product.id",
                    values: [buyAndGetProductId],
                  },
                ],
              },
            })

            const context = {
              currency_code: "usd",
              items: [
                {
                  id: buyAndGetProductId,
                  quantity: 10,
                  subtotal: 2500,
                  original_total: 2500,
                  is_discountable: true,
                  product: { id: buyAndGetProductId },
                },
              ],
            }

            const result = await service.computeActions(
              [buyXGetXPromotion.code!],
              context
            )

            const serializedResult = JSON.parse(JSON.stringify(result))

            expect(serializedResult).toHaveLength(1)
            // Should apply buy get promotion 3 times to the same item
            // Total eligible quantity is 10
            // After first application, (10 - 3 [2 buy + 1 get]) = 7 (eligible) - 250
            // After second application, (7 - 3 [2 buy + 1 get]) = 4 (eligible) - 250
            // After third application, (4 - 3 [2 buy + 1 get]) = 1 (eligible) - 250
            // Fourth application, not eligible as it requires atleast 2 eligible items to buy and 1 eligible item to get
            expect(serializedResult).toEqual(
              expect.arrayContaining([
                {
                  action: "addItemAdjustment",
                  item_id: buyAndGetProductId,
                  amount: 750,
                  code: buyXGetXPromotion.code!,
                },
              ])
            )
          })

          it("should apply buyget promotion multiple times until max quantity is reached on a single item", async () => {
            const buyAndGetProductId = "item_cotton_tshirt"

            const buyXGetXPromotion = await createDefaultPromotion(service, {
              code: "TEST_BUYGET_PROMOTION",
              type: PromotionType.BUYGET,
              status: PromotionStatus.ACTIVE,
              is_tax_inclusive: false,
              is_automatic: false,
              application_method: {
                allocation: "each",
                value: 100,
                max_quantity: 2,
                type: "percentage",
                target_type: "items",
                apply_to_quantity: 1,
                buy_rules_min_quantity: 2,
                target_rules: [
                  {
                    operator: "eq",
                    attribute: "items.product.id",
                    values: [buyAndGetProductId],
                  },
                ],
                buy_rules: [
                  {
                    operator: "eq",
                    attribute: "items.product.id",
                    values: [buyAndGetProductId],
                  },
                ],
              },
            })

            const context = {
              currency_code: "usd",
              items: [
                {
                  id: buyAndGetProductId,
                  quantity: 10,
                  subtotal: 2500,
                  original_total: 2500,
                  is_discountable: true,
                  product: { id: buyAndGetProductId },
                },
              ],
            }

            const result = await service.computeActions(
              [buyXGetXPromotion.code!],
              context
            )

            const serializedResult = JSON.parse(JSON.stringify(result))
            expect(serializedResult).toHaveLength(1)
            // Should apply buy get promotion 2 times (max quantity) to the same item
            // Total eligible quantity is 10
            // After first application, (10 - 2 [2 buy + 1 get]) = 8 (eligible) - 250
            // After second application, (8 - 2 [2 buy + 1 get]) = 6 (eligible) - 250
            // Third application, not eligible it exceeds max quantity
            expect(serializedResult).toEqual(
              expect.arrayContaining([
                {
                  action: "addItemAdjustment",
                  item_id: buyAndGetProductId,
                  amount: 500,
                  code: buyXGetXPromotion.code!,
                },
              ])
            )
          })

          it("should compute adjustment accurately across items", async () => {
            const context = {
              currency_code: "usd",
              items: [
                {
                  id: "item_cotton_tshirt",
                  quantity: 1,
                  subtotal: 500,
                  product: { id: product1 },
                  is_discountable: true,
                },
                {
                  id: "item_cotton_tshirt1",
                  quantity: 1,
                  subtotal: 500,
                  product: { id: product1 },
                  is_discountable: true,
                },
                {
                  id: "item_cotton_tshirt2",
                  quantity: 1,
                  subtotal: 1000,
                  product: { id: product1 },
                  is_discountable: true,
                },
                {
                  id: "item_cotton_tshirt3",
                  quantity: 1,
                  subtotal: 1000,
                  product: { id: product1 },
                  is_discountable: true,
                },
              ],
            }

            const result = await service.computeActions(
              [buyXGetXPromotion.code!],
              context
            )

            expect(JSON.parse(JSON.stringify(result))).toEqual([
              {
                action: "addItemAdjustment",
                item_id: "item_cotton_tshirt1",
                amount: 500,
                code: "PROMOTION_TEST",
              },
              {
                action: "addItemAdjustment",
                item_id: "item_cotton_tshirt",
                amount: 500,
                code: "PROMOTION_TEST",
              },
            ])
          })

          it("should not compute adjustment when required quantity for target isn't met", async () => {
            const context = {
              currency_code: "usd",
              items: [
                {
                  id: "item_cotton_tshirt",
                  quantity: 3,
                  subtotal: 1000,
                  product: { id: product1 },
                  is_discountable: true,
                },
              ],
            }

            const result = await service.computeActions(
              [buyXGetXPromotion.code!],
              context
            )

            expect(JSON.parse(JSON.stringify(result))).toEqual([])
          })

          it("should not compute adjustment when required quantity for target isn't met across items", async () => {
            const context = {
              currency_code: "usd",
              items: [
                {
                  id: "item_cotton_tshirt",
                  quantity: 1,
                  subtotal: 1000,
                  product: { id: product1 },
                  is_discountable: true,
                },
                {
                  id: "item_cotton_tshirt1",
                  quantity: 1,
                  subtotal: 1000,
                  product: { id: product1 },
                  is_discountable: true,
                },
                {
                  id: "item_cotton_tshirt2",
                  quantity: 1,
                  subtotal: 1000,
                  product: { id: product1 },
                  is_discountable: true,
                },
              ],
            }

            const result = await service.computeActions(
              [buyXGetXPromotion.code!],
              context
            )

            expect(JSON.parse(JSON.stringify(result))).toEqual([])
          })
        })
      })
    })
  },
})
