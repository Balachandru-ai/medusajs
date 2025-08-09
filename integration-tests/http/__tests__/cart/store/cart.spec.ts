import { createCartCreditLinesWorkflow } from "@medusajs/core-flows"
import { medusaIntegrationTestRunner } from "@medusajs/test-utils"
import {
  Modules,
  PriceListStatus,
  PriceListType,
  PromotionRuleOperator,
  PromotionStatus,
  PromotionType,
} from "@medusajs/utils"
import {
  createAdminUser,
  generatePublishableKey,
  generateStoreHeaders,
} from "../../../../helpers/create-admin-user"
import { setupTaxStructure } from "../../../../modules/__tests__/fixtures"
import { createAuthenticatedCustomer } from "../../../../modules/helpers/create-authenticated-customer"
import { medusaTshirtProduct } from "../../../__fixtures__/product"

jest.setTimeout(100000)

const env = { MEDUSA_FF_MEDUSA_V2: true }
const adminHeaders = { headers: { "x-medusa-access-token": "test_token" } }

const shippingAddressData = {
  address_1: "test address 1",
  address_2: "test address 2",
  city: "SF",
  country_code: "US",
  province: "CA",
  postal_code: "94016",
}

medusaIntegrationTestRunner({
  env,
  testSuite: ({ dbConnection, getContainer, api }) => {
    describe("Store Carts API", () => {
      let appContainer
      let storeHeaders
      let storeHeadersWithCustomer
      let region,
        noAutomaticRegion,
        product,
        salesChannel,
        cart,
        customer,
        promotion,
        shippingProfile

      beforeAll(async () => {
        appContainer = getContainer()
      })

      beforeEach(async () => {
        try {
          await createAdminUser(dbConnection, adminHeaders, appContainer)
          const publishableKey = await generatePublishableKey(appContainer)
          storeHeaders = generateStoreHeaders({ publishableKey })

          const result = await createAuthenticatedCustomer(api, storeHeaders, {
            first_name: "tony",
            last_name: "stark",
            email: "tony@stark-industries.com",
          })

          customer = result.customer
          storeHeadersWithCustomer = {
            headers: {
              ...storeHeaders.headers,
              authorization: `Bearer ${result.jwt}`,
            },
          }

          shippingProfile = (
            await api.post(
              `/admin/shipping-profiles`,
              { name: "default", type: "default" },
              adminHeaders
            )
          ).data.shipping_profile

          await setupTaxStructure(appContainer.resolve(Modules.TAX))

          region = (
            await api.post(
              "/admin/regions",
              { name: "US", currency_code: "usd", countries: ["us"] },
              adminHeaders
            )
          ).data.region

          noAutomaticRegion = (
            await api.post(
              "/admin/regions",
              { name: "EUR", currency_code: "eur", automatic_taxes: false },
              adminHeaders
            )
          ).data.region

          product = (
            await api.post(
              "/admin/products",
              { ...medusaTshirtProduct, shipping_profile_id: shippingProfile.id },
              adminHeaders
            )
          ).data.product

          salesChannel = (
            await api.post(
              "/admin/sales-channels",
              { name: "Webshop", description: "channel" },
              adminHeaders
            )
          ).data.sales_channel

          await api.post(
            "/admin/price-preferences",
            {
              attribute: "currency_code",
              value: "usd",
              is_tax_inclusive: true,
            },
            adminHeaders
          )

          promotion = (
            await api.post(
              `/admin/promotions`,
              {
                code: "PROMOTION_APPLIED",
                type: PromotionType.STANDARD,
                status: PromotionStatus.ACTIVE,
                application_method: {
                  type: "fixed",
                  target_type: "items",
                  allocation: "each",
                  value: 100,
                  max_quantity: 1,
                  currency_code: "usd",
                  target_rules: [
                    {
                      attribute: "product_id",
                      operator: "in",
                      values: [product.id],
                    },
                  ],
                },
              },
              adminHeaders
            )
          ).data.promotion
        } catch(e:any) {
          console.log(e);
          console.log(e.response);
          throw e;
        }
      })

      describe("POST /store/carts/:id/shipping-methods", () => {
        let shippingOption

        beforeEach(async () => {
          try {
            const stockLocation = (
              await api.post(
                `/admin/stock-locations`,
                { name: "test location" },
                adminHeaders
              )
            ).data.stock_location

            await api.post(
              `/admin/stock-locations/${stockLocation.id}/sales-channels`,
              { add: [salesChannel.id] },
              adminHeaders
            )

            const shippingProfile = (
              await api.post(
                `/admin/shipping-profiles`,
                { name: `test-${stockLocation.id}`, type: "default" },
                adminHeaders
              )
            ).data.shipping_profile

            const fulfillmentSets = (
              await api.post(
                `/admin/stock-locations/${stockLocation.id}/fulfillment-sets?fields=*fulfillment_sets`,
                {
                  name: `Test-${shippingProfile.id}`,
                  type: "test-type",
                },
                adminHeaders
              )
            ).data.stock_location.fulfillment_sets

            const fulfillmentSet = (
              await api.post(
                `/admin/fulfillment-sets/${fulfillmentSets[0].id}/service-zones`,
                {
                  name: `Test-${shippingProfile.id}`,
                  geo_zones: [
                    { type: "country", country_code: "it" },
                    { type: "country", country_code: "us" },
                  ],
                },
                adminHeaders
              )
            ).data.fulfillment_set

            await api.post(
              `/admin/stock-locations/${stockLocation.id}/fulfillment-providers`,
              { add: ["manual_test-provider"] },
              adminHeaders
            )

            shippingOption = (
              await api.post(
                `/admin/shipping-options`,
                {
                  name: `Test shipping option ${fulfillmentSet.id}`,
                  service_zone_id: fulfillmentSet.service_zones[0].id,
                  shipping_profile_id: shippingProfile.id,
                  provider_id: "manual_test-provider",
                  price_type: "flat",
                  type: {
                    label: "Test type",
                    description: "Test description",
                    code: "test-code",
                  },
                  prices: [
                    { currency_code: "usd", amount: 1000 },
                    {
                      currency_code: "usd",
                      amount: 500,
                      rules: [
                        {
                          attribute: "item_total",
                          operator: "gt",
                          value: 3000,
                        },
                      ],
                    },
                  ],
                  rules: [
                    {
                      attribute: "enabled_in_store",
                      value: "true",
                      operator: "eq",
                    },
                    {
                      attribute: "is_return",
                      value: "false",
                      operator: "eq",
                    },
                  ],
                },
                adminHeaders
              )
            ).data.shipping_option

            cart = (
              await api.post(
                `/store/carts?fields=+total`,
                {
                  currency_code: "usd",
                  sales_channel_id: salesChannel.id,
                  region_id: region.id,
                  items: [{ variant_id: product.variants[0].id, quantity: 1 }],
                },
                storeHeadersWithCustomer
              )
            ).data.cart
          } catch(e:any) {
            console.log(e);
            console.log(e.response);
            throw e;
          }
        })

        it.only("should add shipping method to cart", async () => {
          try {

            let response = await api.post(
              `/store/carts/${cart.id}/shipping-methods`,
              { option_id: shippingOption.id },
              storeHeaders
            )

            expect(response.status).toEqual(200)
            expect(response.data.cart).toEqual(
              expect.objectContaining({
                id: cart.id,
                shipping_methods: expect.arrayContaining([
                  expect.objectContaining({
                    shipping_option_id: shippingOption.id,
                    amount: 1000,
                    is_tax_inclusive: true,
                  }),
                ]),
              })
            )

            // Total is over the amount 3000 to enable the second pricing rule
            const cart2 = (
              await api.post(
                `/store/carts?fields=+total`,
                {
                  currency_code: "usd",
                  sales_channel_id: salesChannel.id,
                  region_id: region.id,
                  items: [{ variant_id: product.variants[0].id, quantity: 5 }],
                },
                storeHeadersWithCustomer
              )
            ).data.cart

            response = await api.post(
              `/store/carts/${cart2.id}/shipping-methods`,
              { option_id: shippingOption.id },
              storeHeaders
            )

            expect(response.data.cart).toEqual(
              expect.objectContaining({
                id: cart2.id,
                shipping_methods: expect.arrayContaining([
                  expect.objectContaining({
                    shipping_option_id: shippingOption.id,
                    amount: 500,
                    is_tax_inclusive: true,
                  }),
                ]),
              })
            )
          } catch(e:any) {

            console.log(e);
            console.log(e.response);
            throw e;
          }
        })
      })
    })
  },
})
