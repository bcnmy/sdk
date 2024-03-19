import type { MaybePromise } from "viem/types/utils"

/**
 * Extracts the chain ID from a bundler URL.
 * @param url - The bundler URL.
 * @returns The extracted chain ID.
 * @throws Error if the chain ID cannot be extracted or is invalid.
 */
export const extractChainIdFromBundlerUrl = (url: string): number => {
  try {
    const regex = /\/api\/v2\/(\d+)\/[a-zA-Z0-9.-]+$/
    const match = regex.exec(url)
    if (!match) {
      throw new Error("No match")
    }
    return Number.parseInt(match[1])
  } catch (error) {
    throw new Error("Invalid chain id")
  }
}

export const transactionReceiptStatus = {
  "0x0": "reverted",
  "0x1": "success"
} as const

// biome-ignore lint/suspicious/noExplicitAny: it's a recursive function, so it's hard to type
type Callback = ((...args: any[]) => any) | undefined
type Callbacks = Record<string, Callback>

export const listenersCache = /*#__PURE__*/ new Map<
  string,
  { id: number; fns: Callbacks }[]
>()
export const cleanupCache = /*#__PURE__*/ new Map<string, () => void>()

type EmitFunction<TCallbacks extends Callbacks> = (
  emit: TCallbacks
  // biome-ignore lint/suspicious/noConfusingVoidType: <explanation>
) => MaybePromise<void | (() => void)>

let callbackCount = 0

/**
 * @description Sets up an observer for a given function. If another function
 * is set up under the same observer id, the function will only be called once
 * for both instances of the observer.
 */
export function observe<TCallbacks extends Callbacks>(
  observerId: string,
  callbacks: TCallbacks,
  fn: EmitFunction<TCallbacks>
) {
  const callbackId = ++callbackCount

  const getListeners = () => listenersCache.get(observerId) || []

  const unsubscribe = () => {
    const listeners = getListeners()
    listenersCache.set(
      observerId,
      // biome-ignore lint/suspicious/noExplicitAny: it's a recursive function, so it's hard to type
      listeners.filter((cb: any) => cb.id !== callbackId)
    )
  }

  const unwatch = () => {
    const cleanup = cleanupCache.get(observerId)
    if (getListeners().length === 1 && cleanup) cleanup()
    unsubscribe()
  }

  const listeners = getListeners()
  listenersCache.set(observerId, [
    ...listeners,
    { id: callbackId, fns: callbacks }
  ])

  if (listeners && listeners.length > 0) return unwatch

  const emit: TCallbacks = {} as TCallbacks
  for (const key in callbacks) {
    emit[key] = ((
      ...args: Parameters<NonNullable<TCallbacks[keyof TCallbacks]>>
    ) => {
      const listeners = getListeners()
      if (listeners.length === 0) return
      for (const listener of listeners) {
        listener.fns[key]?.(...args)
      }
    }) as TCallbacks[Extract<keyof TCallbacks, string>]
  }

  const cleanup = fn(emit)
  if (typeof cleanup === "function") cleanupCache.set(observerId, cleanup)

  return unwatch
}