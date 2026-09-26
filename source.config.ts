import { defineCollections } from 'fumadocs-mdx/config'
import { z } from 'zod'

export const changelog = defineCollections({
  type: 'doc',
  dir: 'src/content/changelog',
  schema: z.object({
    title: z.string(),
    description: z.string().optional(),
    date: z.string(),
    version: z.string(),
    published: z.boolean().default(true),
  }),
})
