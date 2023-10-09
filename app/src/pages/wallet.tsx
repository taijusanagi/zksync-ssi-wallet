"use client";

import { PAYMASTER_ADDRESS, SAMPLE_ADDRESS } from "@/lib/web3/deployed";
import SampleJson from "@/lib/web3/artifacts/Sample.json";

import { useRouter } from "next/navigation";
import { useSearchParams } from "next/navigation";
import { useEffect } from "react";

import { Contract, utils, Provider, Wallet } from "zksync-web3";
import { EthrDIDMethod } from "@jpmorganchase/onyx-ssi-sdk";
import crypto from "crypto";

export default function WalletPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const code = searchParams?.get("code");
  const state = searchParams?.get("state");

  useEffect(() => {
    (async () => {
      if (!code) {
        console.log("code not defined");
        return;
      }
      const savedState = localStorage.getItem("state");
      if (!state || state !== savedState) {
        console.log("state invalid");
        return;
      }
      const { id_token } = await fetch(`${process.env.NEXT_PUBLIC_APP_URI}/token`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ code })
      }).then(res => res.json());
      console.log("id_token", id_token);
      // skip nonce check
      if (!id_token) {
        return;
      }
      const { credential } = await fetch(`${process.env.NEXT_PUBLIC_APP_URI}/credential`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ id_token })
      }).then(res => res.json());
      console.log("credential", credential);
    })();
  }, [code, state]);

  return (
    <main>
      {/* <ConnectButton /> */}

      <button
        onClick={async () => {
          const ethrProvider = {
            name: "goerli",
            rpcUrl: "https://rpc.ankr.com/eth_goerli",
            registry: "0xdca7ef03e98e0dc2b855be647c39abe984fcf21b"
          };
          const didEthr = new EthrDIDMethod(ethrProvider);
          const holderDID = await didEthr.create();
          console.log(holderDID);
          const provider = new Provider("https://zksync2-testnet.zksync.dev");
          const signer = new Wallet(holderDID.keyPair.privateKey).connect(provider);
          const contract = new Contract(SAMPLE_ADDRESS, SampleJson.abi, signer);
          const paymasterParams = utils.getPaymasterParams(PAYMASTER_ADDRESS, {
            type: "General",
            innerInput: new Uint8Array()
          });
          const tx = await contract.test("message", {
            customData: {
              gasPerPubdata: utils.DEFAULT_GAS_PER_PUBDATA_LIMIT,
              paymasterParams: paymasterParams
            }
          });
          console.log(tx.hash);
          await tx.wait();
        }}
      >
        Test
      </button>
      {!code && (
        <button
          onClick={() => {
            const state = crypto.randomBytes(8).toString("hex");
            const nonce = crypto.randomBytes(8).toString("hex");
            localStorage.setItem("state", state);
            localStorage.setItem("nonce", nonce);
            const redirect_uri = `${process.env.NEXT_PUBLIC_APP_URI}/wallet`;
            router.push(`/authorize?redirect_uri=${redirect_uri}&state=${state}&nonce=${nonce}`);
          }}
        >
          Authorize with Lens
        </button>
      )}
    </main>
  );
}
