"use client";

import { useRouter } from "next/navigation";

import { useWalletLogin, useWalletLogout, useActiveProfile } from "@lens-protocol/react-web";
import { useAccount, useConnect, useDisconnect } from "wagmi";
import { InjectedConnector } from "wagmi/connectors/injected";
import { useEffect } from "react";

//TODO: integrate Lens
export default function AuthorizePage() {
  const router = useRouter();
  const { execute: login } = useWalletLogin();
  const { execute: logout } = useWalletLogout();
  // const { data: wallet, loading } = useActiveProfile();
  const { isConnected } = useAccount();
  const { disconnectAsync } = useDisconnect();
  const { connectAsync } = useConnect({
    connector: new InjectedConnector()
  });

  // useEffect(() => {
  //   console.log(wallet);
  // }, [wallet]);

  return (
    <main>
      <button
        onClick={async () => {
          if (isConnected) {
            await disconnectAsync();
          }

          await logout()
            .then(() => {
              console.log("Signed out for better process");
            })
            .catch(() => {
              console.log("Not signed in");
            });

          const { connector } = await connectAsync();

          if (connector instanceof InjectedConnector) {
            const walletClient = await connector.getWalletClient();

            const data = (await login({
              address: walletClient.account.address
            })) as any;
            if (!data.value) {
              console.log("no profile detected");
            } else {
              console.log(data);
              // sign with handle, delegate did, then post to approve
            }
          }

          // const redirect_uri = "http://localhost:3000/wallet";
          // router.push(`/approve?redirect_uri=${redirect_uri}`);
        }}
      >
        Authorize
      </button>
    </main>
  );
}
