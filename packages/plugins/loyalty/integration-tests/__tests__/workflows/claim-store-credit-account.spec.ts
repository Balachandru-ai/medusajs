import { medusaIntegrationTestRunner } from "@medusajs/test-utils";
import { createCustomersWorkflow } from "@medusajs/medusa/core-flows";

import { claimStoreCreditAccountWorkflow } from "../../../src/workflows/store-credit/workflows/claim-store-credit-account";
import {
  adminHeaders,
  createAdminUser,
  createStoreUser,
} from "../../utils/admin";
import {
  generatePublishableKey,
  generateStoreHeaders,
} from "../../utils/store";
import { createStoreCreditAccountsWorkflow } from "../../../src/workflows/store-credit/workflows/create-store-credit-accounts";

async function createAccount(input, container) {
  const {
    result: [storeCreditAccount],
  } = await createStoreCreditAccountsWorkflow.run({
    input: [input],
    container,
  });

  return storeCreditAccount;
}

jest.setTimeout(60 * 1000);

medusaIntegrationTestRunner({
  testSuite: ({ api, getContainer }) => {
    let customer, storeHeaders;

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

    describe("claimStoreCreditAccountWorkflow", () => {
      it("should fail to claim a store credit account if code is not provided", async () => {
        const { errors } = await claimStoreCreditAccountWorkflow.run({
          input: {
            customer_id: customer.id,
          },
          container: getContainer(),
          throwOnError: false,
        });

        const error = errors[0];

        expect(error.error.message).toEqual(
          "Code is required to claim a store credit account"
        );
      });

      it("should fail to claim a store credit account if customer id is not provided", async () => {
        const storeCreditAccount = await createAccount(
          {
            currency_code: "usd",
          },
          getContainer()
        );

        const { errors } = await claimStoreCreditAccountWorkflow.run({
          input: {
            code: storeCreditAccount.code,
          },
          container: getContainer(),
          throwOnError: false,
        });

        const error = errors[0];

        expect(error.error.message).toEqual(
          "Customer Id is required to claim a store credit account"
        );
      });

      it("should fail to claim a store credit account if customer does not have an account", async () => {
        const {
          result: [customer],
        } = await createCustomersWorkflow.run({
          input: {
            customersData: [
              {
                first_name: "John",
                last_name: "Doe",
                email: "john.doe@example.com",
              },
            ],
          },
          container: getContainer(),
        });

        const storeCreditAccount = await createAccount(
          {
            currency_code: "usd",
          },
          getContainer()
        );

        const { errors } = await claimStoreCreditAccountWorkflow.run({
          input: {
            code: storeCreditAccount.code,
            customer_id: customer.id,
          },
          container: getContainer(),
          throwOnError: false,
        });

        const error = errors[0];

        expect(error.error.message).toEqual(
          "Only customers with an account can claim a store credit account"
        );
      });

      it("should fail to claim a store credit account if source account belongs to a customer", async () => {
        const sourceCreditAccount = await createAccount(
          {
            currency_code: "usd",
            customer_id: customer.id,
          },
          getContainer()
        );

        const { errors } = await claimStoreCreditAccountWorkflow.run({
          input: {
            code: sourceCreditAccount.code,
            customer_id: customer.id,
          },
          container: getContainer(),
          throwOnError: false,
        });

        const error = errors[0];

        expect(error.error.message).toEqual(
          "Customer already owns the store credit account"
        );
      });

      it("should fail to claim a store credit account if source account has no balance", async () => {
        const sourceCreditAccount = await createAccount(
          {
            currency_code: "usd",
          },
          getContainer()
        );

        const { errors } = await claimStoreCreditAccountWorkflow.run({
          input: {
            code: sourceCreditAccount.code,
            customer_id: customer.id,
          },
          container: getContainer(),
          throwOnError: false,
        });

        const error = errors[0];

        expect(error.error.message).toEqual(
          "Cannot claim a store credit account with no balance"
        );
      });
    });
  },
});
