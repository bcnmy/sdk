import { addTwo } from "@biconomy/account";
import { expect, test } from "vitest";

test("adds 1 + 2 to equal 3", () => {
  expect(addTwo(1, 2)).toBe(3);
});
