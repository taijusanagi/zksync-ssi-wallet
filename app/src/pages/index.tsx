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
  const code = searchParams?.get("code");
  const state = searchParams?.get("state");
  const [holder, setHolder] = useState<DIDWithKeys>();

  useEffect(() => {
    (async () => {
      const didEthr = new EthrDIDMethod(ethrProvider);
      let privateKey;
      if (localStorage.getItem("privateKey")) {
        privateKey = localStorage.getItem("privateKey");
      } else {
        const holderDID = await didEthr.create();
        privateKey = Buffer.from(holderDID.keyPair.privateKey).toString("hex");
        localStorage.setItem("privateKey", privateKey);
      }
      const holder = await didEthr.generateFromPrivateKey(privateKey);
      setHolder(holder);
    })();
  }, []);

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
      // skip nonce check in id_token
      if (!id_token) {
        return;
      }

      const didEthr = new EthrDIDMethod(ethrProvider);
      const holder = await didEthr.create();
      const { vc } = await fetch(`${process.env.NEXT_PUBLIC_APP_URI}/credential`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        // the blow implmentations are skipped for the demo
        // should use header for id_token
        // should send holder proof
        body: JSON.stringify({ id_token, holderDid: holder.did })
      }).then(res => res.json());
      console.log("vc", vc);
      localStorage.setItem("vc", vc);
    })();
  }, [code, state]);

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
          const redirect_uri = `${process.env.NEXT_PUBLIC_APP_URI}`;
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
          console.log(vp);
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
