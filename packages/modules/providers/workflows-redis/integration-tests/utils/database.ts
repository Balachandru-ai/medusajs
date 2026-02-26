const Redis = require("ioredis")

const redisUrl = process.env.REDIS_URL || "redis://localhost:6379"
const redis = new Redis(redisUrl)

interface TestDatabase {
  clearTables(): Promise<void>
  disconnect(): Promise<void>
}

export const TestDatabase: TestDatabase = {
  clearTables: async () => {
    await cleanRedis()
  },
  disconnect: async () => {
    await redis.quit()
  },
}

async function deleteKeysByPattern(pattern: string) {
  const stream = redis.scanStream({
    match: pattern,
    count: 100,
  })

  const pipeline = redis.pipeline()
  for await (const keys of stream) {
    if (keys.length) {
      keys.forEach((key: string) => pipeline.unlink(key))
    }
  }
  await pipeline.exec()
}

async function cleanRedis() {
  await deleteKeysByPattern("bull:*")
  await deleteKeysByPattern("dtrx:*")
}
