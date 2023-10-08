"use client";

import { PAYMASTER_ADDRESS, SAMPLE_ADDRESS } from "@/lib/web3/deployed";
import SampleJson from "@/lib/web3/artifacts/Sample.json";

import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useRouter } from "next/navigation";
import { useSearchParams } from "next/navigation";
import { useEffect } from "react";

import { Contract, Web3Provider, utils } from "zksync-web3";

export default function Wallet() {
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
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ code }),
      }).then((res) => res.json());
      console.log("access_token", access_token);
      if (!access_token) {
        return;
      }
      const { credential } = await fetch("http://localhost:3000/credential", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ access_token }),
      }).then((res) => res.json());
      console.log("credential", credential);
    })();
  }, [code]);

  return (
    <main>
      <ConnectButton />
      <button
        onClick={async () => {
          const provider = new Web3Provider((window as any).ethereum);
          const signer = await provider.getSigner();
          const contract = new Contract(SAMPLE_ADDRESS, SampleJson.abi, signer);
          const paymasterParams = utils.getPaymasterParams(PAYMASTER_ADDRESS, {
            type: "General",
            innerInput: new Uint8Array(),
          });
          const tx = await contract.test("message", {
            customData: {
              gasPerPubdata: utils.DEFAULT_GAS_PER_PUBDATA_LIMIT,
              paymasterParams: paymasterParams,
            },
          });
          console.log(tx.hash);
          await tx.wait();
        }}
      >
        Tx
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
