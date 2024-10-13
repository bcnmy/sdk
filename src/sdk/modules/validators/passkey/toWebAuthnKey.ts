import { startAuthentication, startRegistration } from "@simplewebauthn/browser"
import type {
  PublicKeyCredentialCreationOptionsJSON,
  RegistrationResponseJSON
} from "@simplewebauthn/typescript-types"
import { type Hex, concatHex, keccak256, pad, toHex } from "viem"
import { b64ToBytes, uint8ArrayToHexString } from "./utils"

export enum WebAuthnMode {
  Register = "register",
  Login = "login"
}

export type WebAuthnKey = {
  pubX: bigint
  pubY: bigint
  authenticatorId: string
  authenticatorIdHash: Hex
}
type RequestCredentials = "include" | "omit" | "same-origin"
export type WebAuthnAccountParams = {
  passkeyName: string
  passkeyServerUrl: string
  rpID?: string
  webAuthnKey?: WebAuthnKey
  mode?: WebAuthnMode
  credentials?: RequestCredentials
  passkeyServerHeaders: Record<string, string>
}

export const encodeWebAuthnPubKey = (pubKey: WebAuthnKey) => {
  return concatHex([
    toHex(pubKey.pubX, { size: 32 }),
    toHex(pubKey.pubY, { size: 32 }),
    pad(pubKey.authenticatorIdHash, { size: 32 })
  ])
}

export const toWebAuthnKey = async ({
  passkeyName,
  passkeyServerUrl,
  rpID,
  webAuthnKey,
  mode = WebAuthnMode.Register,
  credentials = "include",
  passkeyServerHeaders = {}
}: WebAuthnAccountParams): Promise<WebAuthnKey> => {
  if (webAuthnKey) {
    return webAuthnKey
  }
  let pubKey: string | undefined
  let authenticatorId: string | undefined
  if (mode === WebAuthnMode.Login) {
    // Get login options
    const loginOptionsResponse = await fetch(
      `${passkeyServerUrl}/login/options`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...passkeyServerHeaders
        },
        body: JSON.stringify({ rpID }),
        credentials
      }
    )
    const loginOptions = await loginOptionsResponse.json()

    // @ts-ignore
    const loginCred = await startAuthentication(loginOptions)

    authenticatorId = loginCred.id

    // Verify authentication
    const loginVerifyResponse = await fetch(
      `${passkeyServerUrl}/login/verify`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...passkeyServerHeaders
        },
        body: JSON.stringify({ cred: loginCred, rpID }),
        credentials
      }
    )

    const loginVerifyResult = await loginVerifyResponse.json()

    // @ts-ignore
    if (!loginVerifyResult.verification.verified) {
      throw new Error("Login not verified")
    }
    // Import the key
    // @ts-ignore
    pubKey = loginVerifyResult.pubkey // Uint8Array pubkey
  } else {
    // Get registration options
    const registerOptionsResponse = (await fetch(
      `${passkeyServerUrl}/register/options`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...passkeyServerHeaders
        },
        body: JSON.stringify({ username: passkeyName, rpID }),
        credentials
      }
    )) as Response

    const registerOptions = (await registerOptionsResponse.json()) as {
      options: PublicKeyCredentialCreationOptionsJSON
      userId: string
    }
    console.log("registerOptions", registerOptions)

    const registerCred: RegistrationResponseJSON = await startRegistration(
      registerOptions.options
    )

    authenticatorId = registerCred.id

    // Verify registration
    const registerVerifyResponse = await fetch(
      `${passkeyServerUrl}/register/verify`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...passkeyServerHeaders
        },
        body: JSON.stringify({
          // @ts-ignore
          userId: registerOptions.userId,
          username: passkeyName,
          cred: registerCred,
          rpID
        }),
        credentials
      }
    )

    // @ts-ignore
    const registerVerifyResult = await registerVerifyResponse.json()
    // @ts-ignore
    if (!registerVerifyResult.verified) {
      throw new Error("Registration not verified")
    }

    // Import the key
    pubKey = registerCred.response.publicKey
  }

  if (!pubKey) {
    throw new Error("No public key returned from registration credential")
  }
  if (!authenticatorId) {
    throw new Error("No authenticator id returned from registration credential")
  }

  const authenticatorIdHash = keccak256(
    uint8ArrayToHexString(b64ToBytes(authenticatorId))
  )
  const spkiDer = Buffer.from(pubKey, "base64")
  const key = await crypto.subtle.importKey(
    "spki",
    spkiDer,
    {
      name: "ECDSA",
      namedCurve: "P-256"
    },
    true,
    ["verify"]
  )

  // Export the key to the raw format
  const rawKey = await crypto.subtle.exportKey("raw", key)
  const rawKeyBuffer = Buffer.from(rawKey)

  // The first byte is 0x04 (uncompressed), followed by x and y coordinates (32 bytes each for P-256)
  const pubKeyX = rawKeyBuffer.subarray(1, 33).toString("hex")
  const pubKeyY = rawKeyBuffer.subarray(33).toString("hex")

  return {
    pubX: BigInt(`0x${pubKeyX}`),
    pubY: BigInt(`0x${pubKeyY}`),
    authenticatorId,
    authenticatorIdHash
  }
}
