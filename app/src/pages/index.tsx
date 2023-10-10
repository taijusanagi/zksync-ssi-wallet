"use client";

import { PAYMASTER_ADDRESS, SAMPLE_ADDRESS } from "@/lib/web3/deployed";
import SampleJson from "@/lib/web3/artifacts/Sample.json";

import { useRouter } from "next/navigation";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

import { Contract, utils, Provider, Wallet } from "zksync-web3";
import {
  DIDWithKeys,
  EthrDIDMethod,
  JWTService,
  KeyDIDMethod,
  createPresentation,
  getSupportedResolvers
} from "@jpmorganchase/onyx-ssi-sdk";
import crypto from "crypto";
import { ethrProvider } from "@/lib/did";

import { Inter } from "next/font/google";
import { provider } from "@/lib/web3/provider";
const inter = Inter({ subsets: ["latin"] });

import PaymasterJson from "@/lib/web3/artifacts/MyPaymaster.json";
import { ethers } from "ethers";

import { verifyJWT } from "did-jwt";

export default function WalletPage() {
  const router = useRouter();
  const [holder, setHolder] = useState<DIDWithKeys>();
  const [balance, setBalance] = useState("0");
  const [vc, setVc] = useState("");
  const [decodedVc, setDecodedVc] = useState<any>();
  const [isLensHolder, setIsLensHolder] = useState(false);
  const [isVcModalOpen, setIsVcModalOpen] = useState(false);

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
        const didEthr = new EthrDIDMethod(ethrProvider);
        const didKey = new KeyDIDMethod();
        const resolver = getSupportedResolvers([didEthr, didKey]);
        const decoded = await verifyJWT(vc, { resolver });
        console.log(decoded.payload);
        console.log(holder.did);
        if (decoded.payload.sub === holder.did) {
          setVc(vc);
          setDecodedVc(decoded);
        }
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
              {vc && (
                <>
                  <div
                    className="relative h-40 bg-gradient-to-br from-purple-500 to-blue-500 text-white rounded-lg shadow-lg mb-2 cursor-pointer"
                    onClick={() => setIsVcModalOpen(true)}
                  >
                    <div className="absolute top-2 left-2">
                      <img src="lens.png" alt="Logo" className="mb-2 w-12 h-12 mx-auto" />
                    </div>
                    <div className="absolute bottom-2 right-2">Lens Handle</div>
                  </div>
                  {isVcModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-2">
                      <div
                        className="absolute inset-0 bg-black opacity-50"
                        onClick={() => setIsVcModalOpen(false)}
                      ></div>
                      <div className="relative z-10 bg-white py-4 px-6 rounded-xl shadow-lg max-w-xl w-full mx-4">
                        <header className="flex justify-between items-center mb-2">
                          <h2 className="text-sm font-bold text-gray-700">VC Detail</h2>
                          <button
                            onClick={() => setIsVcModalOpen(false)}
                            className="text-2xl text-gray-400 hover:text-gray-500"
                          >
                            &times;
                          </button>
                        </header>
                        <pre
                          className="p-2 rounded border border-gray-200 bg-gray-50 overflow-x-auto overflow-y-auto max-h-80"
                          style={{ fontSize: "10px" }}
                        >
                          <code className="break-all">{JSON.stringify(decodedVc, null, 2)}</code>
                        </pre>
                      </div>
                    </div>
                  )}
                </>
              )}

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
                    setIsLensHolder(true);
                  }}
                >
                  Present Lens VC to Paymaster
                </button>
              )}
              {isLensHolder && <p className="text-xs mb-2 text-green-600 text-right">Registered with Paymaster</p>}
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
