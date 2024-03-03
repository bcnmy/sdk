import { beforeAll, describe, test } from "vitest";

import { http, WalletClient, createWalletClient } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { polygonMumbai } from "viem/chains";
import { createBiconomySmartAccount } from "~@bico/core/index.js";

describe("Account", () => {
  let smartAccount: Awaited<ReturnType<typeof createBiconomySmartAccount>>;
  let walletClient: WalletClient;

  beforeAll(async () => {
    console.log(process.env.PRIVATE_KEY);

    const wallet = privateKeyToAccount(`0x${process.env.PRIVATE_KEY}`);

    walletClient = createWalletClient({
      account: wallet,
      transport: http(polygonMumbai.rpcUrls.default.http[0]),
    });

    smartAccount = await createBiconomySmartAccount({
      walletClient: walletClient,
      bundlerUrl: "",
    });
  });

  test("Create account and get nonce", async () => {
    smartAccount = await createBiconomySmartAccount({
      walletClient: walletClient,
      bundlerUrl: "",
    });

    const address = await smartAccount.getAccountAddress();
    console.log("Smart Account Address: ", address);

    const nonce = await smartAccount.getNonce();
    console.log("Smart Account Nonce: ", nonce);
  });
});
