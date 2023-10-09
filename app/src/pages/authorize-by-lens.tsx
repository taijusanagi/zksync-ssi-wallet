"use client";

import { useRouter } from "next/navigation";
import { useWalletClient } from "wagmi";
import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { useIsConnected } from "@/hooks/useIsConnected";
import { useConnectModal } from "@rainbow-me/rainbowkit";

export default function AuthorizePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: walletClient } = useWalletClient();
  const { openConnectModal } = useConnectModal();
  const { isConnected } = useIsConnected();
  const [handle, setHandle] = useState("");

  return (
    <main>
      <label>Lens Handle</label>
      <input value={handle} onChange={e => setHandle(e.target.value)} />
      {!isConnected && <button onClick={openConnectModal}>Connect</button>}
      {isConnected && (
        <button
          onClick={async () => {
            if (!walletClient) {
              return;
            }
            const state = searchParams?.get("state");
            const nonce = searchParams?.get("nonce");
            const signature = await walletClient.signMessage({ message: JSON.stringify({ state, nonce, handle }) });
            const { code } = await fetch("/authorize-by-lens-process", {
              method: "POST",
              headers: {
                "Content-Type": "application/json"
              },
              body: JSON.stringify({
                handle,
                signature
              })
            }).then(res => res.json());
            const redirect_uri = searchParams?.get("redirect_uri");
            router.push(`${redirect_uri}?state=${state}&nonce=${nonce}&code=${code}`);
          }}
        >
          Sign by holder account
        </button>
      )}
    </main>
  );
}
