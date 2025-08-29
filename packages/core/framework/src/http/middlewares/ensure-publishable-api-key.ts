import {
  ApiKeyType,
  ContainerRegistrationKeys,
  isPresent,
  MedusaError,
  PUBLISHABLE_KEY_HEADER,
} from "@medusajs/utils"
import type {
  MedusaNextFunction,
  MedusaResponse,
  MedusaStoreRequest,
} from "../../http"

// Simple in-memory cache for publishable API keys
interface CacheEntry {
  key: string
  sales_channel_ids: string[]
  expires_at: number
}

const apiKeyCache = new Map<string, CacheEntry>()
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes
const NEGATIVE_CACHE_TTL = 30 * 1000 // 30 seconds for invalid keys

// Cleanup expired entries when cache gets large
function cleanupExpiredEntries() {
  const now = Date.now()
  for (const [key, value] of apiKeyCache.entries()) {
    if (value.expires_at <= now) {
      apiKeyCache.delete(key)
    }
  }
}

export async function ensurePublishableApiKeyMiddleware(
  req: MedusaStoreRequest,
  _: MedusaResponse,
  next: MedusaNextFunction
) {
  const publishableApiKey = (req as any).get(PUBLISHABLE_KEY_HEADER)

  if (!isPresent(publishableApiKey)) {
    const error = new MedusaError(
      MedusaError.Types.NOT_ALLOWED,
      `Publishable API key required in the request header: ${PUBLISHABLE_KEY_HEADER}. You can manage your keys in settings in the dashboard.`
    )
    return next(error)
  }

  // Periodic cleanup when cache gets large (every 100 requests)
  if (apiKeyCache.size > 100) {
    cleanupExpiredEntries()
  }

  // Check cache first
  const now = Date.now()
  const cachedEntry = apiKeyCache.get(publishableApiKey)
  
  if (cachedEntry && cachedEntry.expires_at > now) {
    // Cache hit - return immediately
    if (cachedEntry.key === "") {
      // Cached negative result
      const error = new MedusaError(
        MedusaError.Types.NOT_ALLOWED,
        `A valid publishable key is required to proceed with the request`
      )
      return next(error)
    }
    
    req.publishable_key_context = {
      key: cachedEntry.key,
      sales_channel_ids: cachedEntry.sales_channel_ids,
    }
    return next()
  }

  // Cache miss - query database
  let apiKey
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  try {
    const { data } = await query.graph({
      entity: "api_key",
      fields: ["id", "token", "sales_channels_link.sales_channel_id"],
      filters: {
        token: publishableApiKey,
        type: ApiKeyType.PUBLISHABLE,
        $or: [
          { revoked_at: { $eq: null } },
          { revoked_at: { $gt: new Date() } },
        ],
      },
    })

    apiKey = data[0]
  } catch (e) {
    return next(e)
  }

  if (!apiKey) {
    // Cache negative result for shorter time
    apiKeyCache.set(publishableApiKey, {
      key: "",
      sales_channel_ids: [],
      expires_at: now + NEGATIVE_CACHE_TTL
    })
    
    const error = new MedusaError(
      MedusaError.Types.NOT_ALLOWED,
      `A valid publishable key is required to proceed with the request`
    )
    return next(error)
  }

  // Cache positive result
  const sales_channel_ids = apiKey.sales_channels_link.map(
    (link) => link.sales_channel_id
  )
  
  apiKeyCache.set(publishableApiKey, {
    key: apiKey.token,
    sales_channel_ids,
    expires_at: now + CACHE_TTL
  })

  req.publishable_key_context = {
    key: apiKey.token,
    sales_channel_ids,
  }

  return next()
}
