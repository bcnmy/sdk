import { expect, test } from "vitest"
import { addTwo } from "../core"

test("adds 1 + 2 to equal 3", () => {
  expect(addTwo(1, 2)).toBe(3)
})
