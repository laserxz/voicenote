import type { Config } from 'prisma'

// Load environment variables from .env
import { config } from 'dotenv'
config()

export default {
  datasource: {
    url: process.env.DATABASE_URL,
  },
} satisfies Config
