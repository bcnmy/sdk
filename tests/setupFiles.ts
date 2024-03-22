import { test } from "vitest"

export const testForBaseSopelia =
  Number(process.env.CHAIN_ID || 0) === 84532 ? test : test.skip
