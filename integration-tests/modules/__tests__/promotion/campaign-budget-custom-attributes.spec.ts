import { medusaIntegrationTestRunner } from "@medusajs/test-utils"
import {
  ICartModuleService,
  IPromotionModuleService,
  IRegionModuleService,
  ISalesChannelModuleService,
  IProductModuleService,
  IInventoryService,
  IStockLocationService,
  ITaxModuleService,
} from "@medusajs/types"
import {
  ContainerRegistrationKeys,
  Modules,
  ProductStatus,
  PromotionStatus,
  PromotionType,
  CampaignBudgetType,
  PromotionActions,
} from "@medusajs/utils"
import {
  updateCartPromotionsWorkflow,
  completeCartWorkflow,
} from "@medusajs/core-flows"
import {
  adminHeaders,
  createAdminUser,
} from "../../../helpers/create-admin-user"
import { setupTaxStructure } from "../fixtures"
import { StepResponse } from "@medusajs/workflows-sdk"

jest.setTimeout(200000)

medusaIntegrationTestRunner({
  testSuite: ({ dbConnection, getContainer, api }) => {
    let appContainer
    let cartModuleService: ICartModuleService
    let promotionModuleService: IPromotionModuleService
    let regionModuleService: IRegionModuleService
    let scModuleService: ISalesChannelModuleService
    let productModule: IProductModuleService
    let inventoryModule: IInventoryService
    let stockLocationModule: IStockLocationService
    let taxModule: ITaxModuleService
    let remoteLink

    beforeAll(async () => {
      appContainer = getContainer()
      cartModuleService = appContainer.resolve(Modules.CART)
      promotionModuleService = appContainer.resolve(Modules.PROMOTION)
      regionModuleService = appContainer.resolve(Modules.REGION)
      scModuleService = appContainer.resolve(Modules.SALES_CHANNEL)
      productModule = appContainer.resolve(Modules.PRODUCT)
      inventoryModule = appContainer.resolve(Modules.INVENTORY)
      stockLocationModule = appContainer.resolve(Modules.STOCK_LOCATION)
      taxModule = appContainer.resolve(Modules.TAX)
      remoteLink = appContainer.resolve(ContainerRegistrationKeys.REMOTE_LINK)

      // Setup workflow hooks for custom attributes
      updateCartPromotionsWorkflow.hooks.getCustomCampaignBudgetAttributes(
        async ({ cart }) => {
          return new StepResponse({
            account_id: cart.metadata?.account_id || null,
          })
        }
      )

      completeCartWorkflow.hooks.getCustomCampaignBudgetAttributesForRegistration(
        ({ cart }) => {
          return new StepResponse({
            account_id: cart.metadata?.account_id || null,
          })
        }
      )
    })

    beforeEach(async () => {
      await createAdminUser(dbConnection, adminHeaders, appContainer)
      await setupTaxStructure(taxModule)
    })

    describe("Campaign Budget Custom Attributes", () => {
      it("should track budget usage per custom attribute value", async () => {
        // Create test data
        const region = await regionModuleService.createRegions({
          name: "US",
          currency_code: "usd",
        })

        const salesChannel = await scModuleService.createSalesChannels({
          name: "Webshop",
        })

        const location = await stockLocationModule.createStockLocations({
          name: "Warehouse",
        })

        const [product] = await productModule.createProducts([
          {
            title: "Test product",
            status: ProductStatus.PUBLISHED,
            variants: [
              {
                title: "Test variant",
                manage_inventory: false,
              },
            ],
          },
        ])

        const inventoryItem = await inventoryModule.createInventoryItems({
          sku: "inv-1234",
        })

        await inventoryModule.createInventoryLevels([
          {
            inventory_item_id: inventoryItem.id,
            location_id: location.id,
            stocked_quantity: 100,
          },
        ])

        await remoteLink.create({
          [Modules.PRODUCT]: { variant_id: product.variants[0].id },
          [Modules.INVENTORY]: { inventory_item_id: inventoryItem.id },
        })

        // Create campaign with custom attribute budget
        const [campaign] = await promotionModuleService.createCampaigns([
          {
            name: "Test Campaign",
            campaign_identifier: "test-campaign",
            budget: {
              type: CampaignBudgetType.USE_BY_ATTRIBUTE,
              limit: 2, // Allow 2 uses per account_id
              attribute: "account_id",
            },
          },
        ])

        // Create promotion
        const [promotion] = await promotionModuleService.createPromotions([
          {
            code: "TEST_PROMO",
            type: PromotionType.STANDARD,
            status: PromotionStatus.ACTIVE,
            campaign_id: campaign.id,
            application_method: {
              type: "fixed",
              target_type: "items",
              allocation: "across",
              value: 100,
              currency_code: "usd",
            },
          },
        ])

        // Create two carts with different account_ids
        const cart1 = await cartModuleService.createCarts({
          currency_code: "usd",
          region_id: region.id,
          sales_channel_id: salesChannel.id,
          metadata: { account_id: "account_123" },
          items: [
            {
              unit_price: 1000,
              quantity: 1,
              title: "Test item",
              product_id: product.id,
              variant_id: product.variants[0].id,
            } as any,
          ],
        })

        const cart2 = await cartModuleService.createCarts({
          currency_code: "usd",
          region_id: region.id,
          sales_channel_id: salesChannel.id,
          metadata: { account_id: "account_456" },
          items: [
            {
              unit_price: 1000,
              quantity: 1,
              title: "Test item",
              product_id: product.id,
              variant_id: product.variants[0].id,
            } as any,
          ],
        })

        // Apply promotion to both carts using workflow
        await updateCartPromotionsWorkflow(appContainer).run({
          input: {
            cart_id: cart1.id,
            promo_codes: [promotion.code!],
            action: PromotionActions.ADD,
          },
        })

        await updateCartPromotionsWorkflow(appContainer).run({
          input: {
            cart_id: cart2.id,
            promo_codes: [promotion.code!],
            action: PromotionActions.ADD,
          },
        })

        // verify both carts have the promotion applied
        const updatedCart1 = await cartModuleService.retrieveCart(cart1.id, {
          relations: ["items", "items.adjustments"],
        })
        const updatedCart2 = await cartModuleService.retrieveCart(cart2.id, {
          relations: ["items", "items.adjustments"],
        })

        expect(updatedCart1.items?.[0]?.adjustments).toHaveLength(1)
        expect(updatedCart2.items?.[0]?.adjustments).toHaveLength(1)

        // complete both carts to register usage
        await completeCartWorkflow(appContainer).run({
          input: { id: cart1.id },
        })

        await completeCartWorkflow(appContainer).run({
          input: { id: cart2.id },
        })

        // verify budget usage is tracked per account_id
        const campaignWithBudget =
          await promotionModuleService.retrieveCampaign(campaign.id, {
            relations: ["budget", "budget.usages"],
          })
        const budget = campaignWithBudget.budget!

        expect(budget?.usages).toHaveLength(2)
        expect(budget?.usages).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              attribute_value: "account_123",
              used: 1,
            }),
            expect.objectContaining({
              attribute_value: "account_456",
              used: 1,
            }),
          ])
        )
      })

      it("should enforce budget limit per custom attribute", async () => {
        const region = await regionModuleService.createRegions({
          name: "US",
          currency_code: "usd",
        })

        const salesChannel = await scModuleService.createSalesChannels({
          name: "Webshop",
        })

        const location = await stockLocationModule.createStockLocations({
          name: "Warehouse",
        })

        const [product] = await productModule.createProducts([
          {
            title: "Test product",
            status: ProductStatus.PUBLISHED,
            variants: [
              {
                title: "Test variant",
                manage_inventory: false,
              },
            ],
          },
        ])

        const inventoryItem = await inventoryModule.createInventoryItems({
          sku: "inv-1234",
        })

        await inventoryModule.createInventoryLevels([
          {
            inventory_item_id: inventoryItem.id,
            location_id: location.id,
            stocked_quantity: 100,
          },
        ])

        await remoteLink.create({
          [Modules.PRODUCT]: { variant_id: product.variants[0].id },
          [Modules.INVENTORY]: { inventory_item_id: inventoryItem.id },
        })

        // create campaign with strict budget limit
        const [campaign] = await promotionModuleService.createCampaigns([
          {
            name: "Limited Campaign",
            campaign_identifier: "limited-campaign",
            budget: {
              type: CampaignBudgetType.USE_BY_ATTRIBUTE,
              limit: 1, // Allow only 1 use per account_id
              attribute: "account_id",
            },
          },
        ])

        // create promotion
        const [promotion] = await promotionModuleService.createPromotions([
          {
            code: "LIMITED_PROMO",
            type: PromotionType.STANDARD,
            status: PromotionStatus.ACTIVE,
            campaign_id: campaign.id,
            application_method: {
              type: "fixed",
              target_type: "items",
              allocation: "across",
              value: 100,
              currency_code: "usd",
            },
          },
        ])

        const cart1 = await cartModuleService.createCarts({
          currency_code: "usd",
          region_id: region.id,
          sales_channel_id: salesChannel.id,
          metadata: { account_id: "account_123" },
          items: [
            {
              unit_price: 1000,
              quantity: 1,
              title: "Test item",
              product_id: product.id,
              variant_id: product.variants[0].id,
            } as any,
          ],
        })

        await updateCartPromotionsWorkflow(appContainer).run({
          input: {
            cart_id: cart1.id,
            promo_codes: [promotion.code!],
            action: PromotionActions.ADD,
          },
        })
        await completeCartWorkflow(appContainer).run({
          input: { id: cart1.id },
        })

        const cart2 = await cartModuleService.createCarts({
          currency_code: "usd",
          region_id: region.id,
          sales_channel_id: salesChannel.id,
          metadata: { account_id: "account_123" }, // same account_id
          items: [
            {
              unit_price: 1000,
              quantity: 1,
              title: "Test item",
              product_id: product.id,
              variant_id: product.variants[0].id,
            } as any,
          ],
        })

        await updateCartPromotionsWorkflow(appContainer).run({
          input: {
            cart_id: cart2.id,
            promo_codes: [promotion.code!],
            action: PromotionActions.ADD,
          },
        })

        const campaignWithBudget =
          await promotionModuleService.retrieveCampaign(campaign.id, {
            relations: ["budget", "budget.usages"],
          })
        const budget = campaignWithBudget.budget!

        expect(budget?.usages).toHaveLength(1)
        expect(budget?.usages?.[0]).toEqual(
          expect.objectContaining({
            attribute_value: "account_123",
            used: 1,
          })
        )
      })

      it.todo("should revert usage when workflow fails")

      it("should handle multiple custom attributes correctly", async () => {
        const region = await regionModuleService.createRegions({
          name: "US",
          currency_code: "usd",
        })

        const salesChannel = await scModuleService.createSalesChannels({
          name: "Webshop",
        })

        const location = await stockLocationModule.createStockLocations({
          name: "Warehouse",
        })

        const [product] = await productModule.createProducts([
          {
            title: "Test product",
            status: ProductStatus.PUBLISHED,
            variants: [
              {
                title: "Test variant",
                manage_inventory: false,
              },
            ],
          },
        ])

        const inventoryItem = await inventoryModule.createInventoryItems({
          sku: "inv-1234",
        })

        await inventoryModule.createInventoryLevels([
          {
            inventory_item_id: inventoryItem.id,
            location_id: location.id,
            stocked_quantity: 100,
          },
        ])

        await remoteLink.create({
          [Modules.PRODUCT]: { variant_id: product.variants[0].id },
          [Modules.INVENTORY]: { inventory_item_id: inventoryItem.id },
        })

        const [campaign] = await promotionModuleService.createCampaigns([
          {
            name: "Multi-Attribute Campaign",
            campaign_identifier: "multi-attribute-campaign",
            budget: {
              type: CampaignBudgetType.USE_BY_ATTRIBUTE,
              limit: 2,
              attribute: "account_id",
            },
          },
        ])

        const [promotion] = await promotionModuleService.createPromotions([
          {
            code: "MULTI_PROMO",
            type: PromotionType.STANDARD,
            status: PromotionStatus.ACTIVE,
            campaign_id: campaign.id,
            application_method: {
              type: "fixed",
              target_type: "items",
              allocation: "across",
              value: 100,
              currency_code: "usd",
            },
          },
        ])

        const cart1 = await cartModuleService.createCarts({
          currency_code: "usd",
          region_id: region.id,
          sales_channel_id: salesChannel.id,
          metadata: {
            account_id: "account_123",
            department: "sales",
            region: "us-west",
          },
          items: [
            {
              unit_price: 1000,
              quantity: 1,
              title: "Test item",
              product_id: product.id,
              variant_id: product.variants[0].id,
            } as any,
          ],
        })

        const cart2 = await cartModuleService.createCarts({
          currency_code: "usd",
          region_id: region.id,
          sales_channel_id: salesChannel.id,
          metadata: {
            account_id: "account_456",
            department: "marketing",
            region: "us-east",
          },
          items: [
            {
              unit_price: 1000,
              quantity: 1,
              title: "Test item",
              product_id: product.id,
              variant_id: product.variants[0].id,
            } as any,
          ],
        })

        await updateCartPromotionsWorkflow(appContainer).run({
          input: {
            cart_id: cart1.id,
            promo_codes: [promotion.code!],
            action: PromotionActions.ADD,
          },
        })

        await updateCartPromotionsWorkflow(appContainer).run({
          input: {
            cart_id: cart2.id,
            promo_codes: [promotion.code!],
            action: PromotionActions.ADD,
          },
        })

        await completeCartWorkflow(appContainer).run({
          input: { id: cart1.id },
        })

        await completeCartWorkflow(appContainer).run({
          input: { id: cart2.id },
        })

        const campaignWithBudget =
          await promotionModuleService.retrieveCampaign(campaign.id, {
            relations: ["budget", "budget.usages"],
          })
        const budget = campaignWithBudget.budget!

        expect(budget?.usages).toHaveLength(2)
        expect(budget?.usages).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              attribute_value: "account_123",
              used: 1,
            }),
            expect.objectContaining({
              attribute_value: "account_456",
              used: 1,
            }),
          ])
        )

        const account123Usage = budget?.usages?.find(
          (u) => u.attribute_value === "account_123"
        )
        const account456Usage = budget?.usages?.find(
          (u) => u.attribute_value === "account_456"
        )

        expect(account123Usage).toBeDefined()
        expect(account456Usage).toBeDefined()
        expect(account123Usage?.used).toBe(1)
        expect(account456Usage?.used).toBe(1)
      })
    })
  },
})
