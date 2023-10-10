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

import { Inter } from "next/font/google";
import { provider } from "@/lib/web3/provider";
const inter = Inter({ subsets: ["latin"] });

import PaymasterJson from "@/lib/web3/artifacts/MyPaymaster.json";
import { ethers } from "ethers";

export default function WalletPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [holder, setHolder] = useState<DIDWithKeys>();
  const [balance, setBalance] = useState("0");
  const [vc, setVc] = useState("");
  const [isLensHolder, setIsLensHolder] = useState(false);

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
      const address = holder.did.split(":")[3];

      const balance = await provider.getBalance(address);
      setBalance(ethers.utils.formatEther(balance));

      const paymaster = new Contract(PAYMASTER_ADDRESS, PaymasterJson.abi, provider);
      const isLensHolder = await paymaster.isLensHolder(address);
      setIsLensHolder(isLensHolder);

      const vc = localStorage.getItem("vc");
      if (vc) {
        setVc(vc);
      }
    })();
  }, []);

  return (
    <main
      className={`min-h-screen bg-gradient-to-r from-blue-200 to-cyan-200 flex flex-col break-all ${inter.className} `}
    >
      <div className="main-content flex-grow flex items-center justify-center p-2">
        <div id="formSection" className="w-full max-w-lg">
          <img src="icon.png" alt="Logo" className="mb-4 w-24 h-24 mx-auto" />
          <h1 className="text-2xl font-bold mb-2 text-gray-600 text-center">zkSync SSI Wallet</h1>
          <h2 className="text-md font-semibold mb-8 text-gray-600 text-center">
            Empower your crypto journey with credentials.
          </h2>
          <div className="centered-form bg-white p-4 rounded-lg shadow-md">
            <div className="mb-4">
              <label className="form-label block text-gray-700 font-bold mb-2">DID</label>
              <p className="text-xs">{holder?.did}</p>
            </div>
            <div className="mb-4">
              <label className="form-label block text-gray-700 font-bold mb-2">Balance</label>
              <p className="text-xs">{balance} ETH</p>
            </div>
            <div className="mb-4">
              <label className="form-label block text-gray-700 font-bold mb-2">Available Credentials</label>
              <label className="text-sm form-label block text-gray-500 font-bold mb-2">Credential</label>
              {!vc && (
                <button
                  className="bg-cyan-500 disabled:opacity-50 text-white py-2 px-4 rounded-lg hover:enabled:bg-cyan-600 w-full mb-2"
                  disabled={!!vc}
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
              )}
              {vc && <div>VC</div>}
              <label className="text-sm form-label block text-gray-500 font-bold mb-2">Registered with Paymaster</label>
              {!isLensHolder && (
                <button
                  className="bg-cyan-500 disabled:opacity-50 text-white py-2 px-4 rounded-lg hover:enabled:bg-cyan-600 w-full"
                  disabled={!vc || isLensHolder}
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
                  Present Lens VC to Paymaster
                </button>
              )}
              {isLensHolder && <p className="text-xs mb-2 text-green-600">Registered</p>}
            </div>
            <div>
              <label className="form-label block text-gray-700 font-bold mb-2">Connect dApps</label>
              <button
                className="bg-cyan-500 disabled:opacity-50 text-white py-2 px-4 rounded-lg hover:enabled:bg-cyan-600 w-full"
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
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
