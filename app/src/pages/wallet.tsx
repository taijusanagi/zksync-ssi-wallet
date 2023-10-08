"use client";

import { PAYMASTER_ADDRESS, SAMPLE_ADDRESS } from "@/lib/web3/deployed";
import SampleJson from "@/lib/web3/artifacts/Sample.json";

import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useRouter } from "next/navigation";
import { useSearchParams } from "next/navigation";
import { useEffect } from "react";

import { Contract, utils, Provider, Wallet } from "zksync-web3";
import { EthrDIDMethod } from "@jpmorganchase/onyx-ssi-sdk";

export default function WalletPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const code = searchParams?.get("code");

  useEffect(() => {
    (async () => {
      if (!code) {
        return;
      }
      const { access_token } = await fetch("http://localhost:3000/token", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ code })
      }).then(res => res.json());
      console.log("access_token", access_token);
      if (!access_token) {
        return;
      }
      const { credential } = await fetch("http://localhost:3000/credential", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ access_token })
      }).then(res => res.json());
      console.log("credential", credential);
    })();
  }, [code]);

  return (
    <main>
      <ConnectButton />

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
            router.push("/authorize");
          }}
        >
          Authorize with Lens
        </button>
      )}
    </main>
  );
}
