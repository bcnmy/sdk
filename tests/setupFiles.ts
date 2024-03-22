import { test } from "vitest"

export const testForBaseSopelia =
  Number(process.env.CHAIN_ID || 0) === 85432 ? test : test.skip
