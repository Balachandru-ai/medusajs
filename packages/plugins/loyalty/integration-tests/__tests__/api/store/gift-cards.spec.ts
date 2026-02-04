import { medusaIntegrationTestRunner } from "@medusajs/test-utils";
import {
  adminHeaders,
  createAdminUser,
  createStoreUser,
} from "../../../utils/admin";
import {
  generatePublishableKey,
  generateStoreHeaders,
} from "../../../utils/store";

jest.setTimeout(60 * 1000);

const giftCardPayload = {
  currency_code: "usd",
  value: 1000,
  code: "TEST1",
  line_item_id: "lin_123",
};

medusaIntegrationTestRunner({
  testSuite: ({ api, getContainer }) => {
    let customer;
    let storeHeaders;

    beforeEach(async () => {
      const container = getContainer();
      await createAdminUser(adminHeaders, container);
      const publishableKey = await generatePublishableKey(container);
      storeHeaders = generateStoreHeaders({ publishableKey });

      const user = await createStoreUser({
        api,
        storeHeaders,
        email: "initial@customer.com",
      });

      storeHeaders.headers["Authorization"] = `Bearer ${user.token}`;

      customer = user.customer;
    });

    describe("POST /admin/gift-cards", () => {
      it("should create a gift card and an annonymous credit account for the card", async () => {
        const giftCard = (
          await api.post(
            `/admin/gift-cards?fields=*store_credit_account,*store_credit_account.transactions`,
            { ...giftCardPayload },
            adminHeaders
          )
        ).data.gift_card;

        expect(giftCard).toEqual(
          expect.objectContaining({
            status: "redeemed",
            value: 1000,
            currency_code: "usd",
            code: "TEST1",
            store_credit_account: expect.objectContaining({
              currency_code: "usd",
              balance: 1000,
              credits: 1000,
              debits: 0,
              transactions: expect.arrayContaining([
                expect.objectContaining({
                  amount: 1000,
                  type: "credit",
                  reference: "gift_card",
                  reference_id: giftCard.id,
                }),
              ]),
            }),
          })
        );
      });
    });

    describe("POST /admin/gift-cards/:id/claim", () => {
      it.todo("should claim a gift card");
    });
  },
});
