"use client";

import { useRouter } from "next/navigation";
import { useWalletClient } from "wagmi";
import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { useIsConnected } from "@/hooks/useIsConnected";
import { useConnectModal } from "@rainbow-me/rainbowkit";

import { Inter } from "next/font/google";
const inter = Inter({ subsets: ["latin"] });

export default function AuthorizePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: walletClient } = useWalletClient();
  const { openConnectModal } = useConnectModal();
  const { isConnected } = useIsConnected();
  const [handle, setHandle] = useState("");

  return (
    <main
      className={`min-h-screen bg-gradient-to-r from-green-200 to-cyan-200 flex flex-col break-all ${inter.className} `}
    >
      <div className="main-content flex-grow flex items-center justify-center p-2">
        <div id="formSection" className="w-full max-w-lg">
          <img src="lens.png" alt="Logo" className="mb-2 w-12 h-12 mx-auto" />
          <h2 className="text-md font-semibold mb-8 text-gray-600 text-center">Authorize by Lens account</h2>
          <div className="centered-form bg-white p-4 rounded-lg shadow-md">
            <label className="form-label block text-gray-700 font-bold mb-2">Lens Handle</label>
            <input
              className="py-3 px-2 mb-4 w-full border rounded-lg text-xs"
              placeholder=".lens"
              value={handle}
              onChange={e => setHandle(e.target.value)}
            />
            {!isConnected && (
              <button
                className="bg-cyan-500 disabled:opacity-50 text-white py-2 px-4 rounded-lg hover:enabled:bg-cyan-600 w-full"
                onClick={openConnectModal}
              >
                Connect Wallet
              </button>
            )}
            {isConnected && (
              <button
                className="bg-cyan-500 disabled:opacity-50 text-white py-2 px-4 rounded-lg hover:enabled:bg-cyan-600 w-full"
                onClick={async () => {
                  if (!walletClient) {
                    return;
                  }
                  const state = searchParams?.get("state");
                  const nonce = searchParams?.get("nonce");
                  const signature = await walletClient.signMessage({
                    message: JSON.stringify({ state, nonce, handle })
                  });
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
                Sign In with Lens holder wallet
              </button>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
