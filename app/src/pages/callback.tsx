"use client";

import { useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { EthrDIDMethod } from "@jpmorganchase/onyx-ssi-sdk";
import { ethrProvider } from "@/lib/did";
import { useRouter } from "next/navigation";

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
      router.push("/");
    })();
  }, [code, state, router]);

  return <main>Callback</main>;
}
