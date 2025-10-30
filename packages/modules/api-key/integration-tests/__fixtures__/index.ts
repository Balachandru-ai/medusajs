import { CreateApiKeyDTO } from "#types/index"
import { ApiKeyType } from "@medusajs/framework/utils"

export const createSecretKeyFixture = {
  title: "Secret key",
  type: ApiKeyType.SECRET,
  created_by: "test",
} as CreateApiKeyDTO

export const createPublishableKeyFixture = {
  title: "Test API Key",
  type: ApiKeyType.PUBLISHABLE,
  created_by: "test",
} as CreateApiKeyDTO
