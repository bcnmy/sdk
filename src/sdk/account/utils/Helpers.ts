import type { AnyData } from "../../modules/utils/Types"

export const isDebugging = () =>
  process.env.BICONOMY_SDK_DEBUG === "true" ||
  process.env.REACT_APP_BICONOMY_SDK_DEBUG === "true" ||
  process.env.NEXT_PUBLIC_BICONOMY_SDK_DEBUG === "true"

export const bigIntReplacer = (_: string, value: AnyData): AnyData => {
  if (typeof value === "bigint") {
    return `${value.toString()}n`
  }
  return value
}
