"use client";

import { PAYMASTER_ADDRESS, SAMPLE_ADDRESS } from "@/lib/web3/deployed";
import SampleJson from "@/lib/web3/artifacts/Sample.json";

import { useRouter } from "next/navigation";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

import { Contract, utils, Provider, Wallet } from "zksync-web3";
import { DIDWithKeys, EthrDIDMethod, JWTService, createPresentation } from "@jpmorganchase/onyx-ssi-sdk";
import crypto from "crypto";
import { ethrProvider } from "@/lib/did";

export default function WalletPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [holder, setHolder] = useState<DIDWithKeys>();

  useEffect(() => {
    (async () => {
      const didEthr = new EthrDIDMethod(ethrProvider);
      let holder;
      if (localStorage.getItem("privateKey")) {
        const privateKey = localStorage.getItem("privateKey") as string;
        holder = await didEthr.generateFromPrivateKey(privateKey);
      } else {
        holder = await didEthr.create();
        localStorage.setItem("privateKey", holder.keyPair.privateKey);
      }
      setHolder(holder);
    })();
  }, []);

  return (
    <main>
      {holder && <p>{holder.did}</p>}
      <button
        onClick={async () => {
          if (!holder) {
            throw new Error("holder not defined");
          }
          const provider = new Provider("https://zksync2-testnet.zksync.dev");
          const signer = new Wallet(holder.keyPair.privateKey).connect(provider);
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
        Test Tx
      </button>

      <button
        onClick={() => {
          const state = crypto.randomBytes(8).toString("hex");
          const nonce = crypto.randomBytes(8).toString("hex");
          localStorage.setItem("state", state);
          localStorage.setItem("nonce", nonce);
          const redirect_uri = `${process.env.NEXT_PUBLIC_APP_URI}/callback`;
          router.push(`/authorize?redirect_uri=${redirect_uri}&state=${state}&nonce=${nonce}`);
        }}
      >
        Get Lens VC
      </button>
      <button
        onClick={async () => {
          if (!holder) {
            throw new Error("holder not defined");
          }
          const vc = localStorage.getItem("vc");
          if (!vc) {
            throw new Error("vc is not stored");
          }
          const jwtService = new JWTService();
          const presentationPayload = await createPresentation(holder.did, [vc]);
          const vp = await jwtService.signVP(holder, presentationPayload);
          console.log("vp", vp);
          const data = await fetch(`${process.env.NEXT_PUBLIC_APP_URI}/paymaster`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify({ vp })
          }).then(res => res.json());
          console.log(data);
        }}
      >
        Send VP to get gas sponsoring
      </button>
    </main>
  );
}
