"use client";

import { PAYMASTER_ADDRESS, SAMPLE_ADDRESS } from "@/lib/web3/deployed";
import SampleJson from "@/lib/web3/artifacts/Sample.json";

import { useRouter } from "next/navigation";
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
import { Core } from "@walletconnect/core";
import { Web3Wallet } from "@walletconnect/web3wallet";

const SESSION_REQUEST_SEND_TRANSACTION = "eth_sendTransaction";
const SESSION_REQUEST_ETH_SIGN = "eth_sign";
const SESSION_REQUEST_PERSONAL_SIGN = "personal_sign";
const SESSION_REQUEST_ETH_SIGN_V4 = "eth_signTypedData_v4";

export default function WalletPage() {
  const router = useRouter();
  const [holder, setHolder] = useState<DIDWithKeys>();
  const [balance, setBalance] = useState("0");
  const [vc, setVc] = useState("");
  const [decodedVc, setDecodedVc] = useState<any>();
  const [isLensHolder, setIsLensHolder] = useState(false);
  const [isVcModalOpen, setIsVcModalOpen] = useState(false);
  const [walletConnectURL, setWalletConnectURL] = useState("");
  const [web3Wallet, setWeb3Wallet] = useState<any>();
  const [isConnected, setIsConnected] = useState(false);
  const [topic, setTopic] = useState("");
  const [isTxPreviewModalOpen, setIsTxPreviewModalOpen] = useState(false);

  const [id, setId] = useState(0);
  const [to, setTo] = useState("");
  const [data, setData] = useState("");
  const [value, setValue] = useState("");
  const [hash, setHash] = useState("");

  const sendTx = async () => {
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
  };

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
      const metadata = {
        name: "zkSync SSI Wallet",
        description: "Empower your crypto journey with credentials.",
        url: "http://localhost:3000",
        icons: []
      };
      const core = new Core({
        projectId: "cffe9608a02c00c7947b9afd9dacbc70"
      });
      const web3Wallet = await Web3Wallet.init({
        core,
        metadata
      });
      web3Wallet.on("session_proposal", async proposal => {
        const session = await web3Wallet.approveSession({
          id: proposal.id,
          namespaces: {
            eip155: {
              chains: ["eip155:5", "eip155:280"],
              methods: [
                SESSION_REQUEST_SEND_TRANSACTION,
                SESSION_REQUEST_ETH_SIGN,
                SESSION_REQUEST_PERSONAL_SIGN,
                SESSION_REQUEST_ETH_SIGN_V4
              ],
              events: ["chainChanged", "accountsChanged"],
              accounts: [`eip155:280:${address}`]
            }
          }
        });
        setIsConnected(true);
        setTopic(session.topic);
      });
      web3Wallet.on("session_request", async request => {
        if (request.params.request.method === "eth_sendTransaction") {
          console.log("eth_sendTransaction");
          const id = request.id;
          const to = request.params.request.params[0].to;
          const data = request.params.request.params[0].data;
          const value = request.params.request.params[0].value;
          setId(id);
          setTo(to);
          setData(data);
          setValue(value);
          setHash("");
          setIsTxPreviewModalOpen(true);
        }
      });
      setWeb3Wallet(web3Wallet);
      const sessions = await web3Wallet.getActiveSessions();
      const isConnected = Object.keys(sessions).length > 0;
      setIsConnected(isConnected);
      if (isConnected) {
        const topic = Object.keys(sessions)[0];
        setTopic(topic);
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
              {!isConnected && (
                <>
                  <input
                    type="text"
                    value={walletConnectURL}
                    onChange={e => setWalletConnectURL(e.target.value)}
                    className="py-3 px-2 mb-4 w-full border rounded-lg text-xs"
                    placeholder="wc:"
                  />
                  <button
                    className="bg-cyan-500 disabled:opacity-50 text-white py-2 px-4 rounded-lg hover:enabled:bg-cyan-600 w-full"
                    disabled={isConnected}
                    onClick={async () => {
                      if (!web3Wallet) {
                        return;
                      }
                      await web3Wallet.core.pairing.pair({
                        uri: walletConnectURL
                      });
                    }}
                  >
                    Connect dApps with Wallet Connect
                  </button>
                </>
              )}
              {isConnected && (
                <>
                  <button
                    className="bg-cyan-500 disabled:opacity-50 text-white py-2 px-4 rounded-lg hover:enabled:bg-cyan-600 w-full mb-2"
                    disabled={!isConnected}
                    onClick={async () => {
                      if (!web3Wallet) {
                        return;
                      }
                      await web3Wallet.disconnectSession({ topic });
                      setIsConnected(false);
                    }}
                  >
                    Disconnect
                  </button>
                  <p className="text-xs mb-2 text-green-600 text-right">Already connected with dApp</p>
                  {isTxPreviewModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-2">
                      <div
                        className="absolute inset-0 bg-black opacity-50"
                        onClick={() => setIsTxPreviewModalOpen(false)}
                      ></div>
                      <div className="relative z-10 bg-white py-4 px-6 rounded-xl shadow-lg max-w-xl w-full mx-4">
                        <header className="flex justify-between items-center mb-2">
                          <h2 className="text-sm font-bold text-gray-700">Tx Preview</h2>
                          <button
                            onClick={() => setIsTxPreviewModalOpen(false)}
                            className="text-2xl text-gray-400 hover:text-gray-500"
                          >
                            &times;
                          </button>
                        </header>
                        <pre
                          className="p-2 rounded border border-gray-200 bg-gray-50 overflow-x-auto overflow-y-auto max-h-80 mb-4"
                          style={{ fontSize: "10px" }}
                        >
                          <div className="mb-4">
                            <label className="form-label block text-gray-700 font-bold mb-2">From</label>
                            <p className="text-xs">{holder?.did.split(":")[3]}</p>
                          </div>
                          <div className="mb-4">
                            <label className="form-label block text-gray-700 font-bold mb-2">To</label>
                            <p className="text-xs">{to}</p>
                          </div>
                          <div className="mb-4">
                            <label className="form-label block text-gray-700 font-bold mb-2">Data</label>
                            <p className="text-xs">{data}</p>
                          </div>
                          <div className="mb-4">
                            <label className="form-label block text-gray-700 font-bold mb-2">Value</label>
                            <p className="text-xs">{value}</p>
                          </div>
                          <div className="mb-4">
                            <label className="form-label block text-gray-700 font-bold mb-2">Is Sponsored</label>
                            <p className="text-xs">{isLensHolder.toString()}</p>
                          </div>
                        </pre>
                        <button
                          className="bg-cyan-500 disabled:opacity-50 text-white py-2 px-4 rounded-lg hover:enabled:bg-cyan-600 w-full mb-4"
                          disabled={!!hash}
                          onClick={async () => {
                            if (!holder) {
                              throw new Error("holder not defined");
                            }
                            const signer = new Wallet(holder.keyPair.privateKey).connect(provider);
                            const paymasterParams = utils.getPaymasterParams(PAYMASTER_ADDRESS, {
                              type: "General",
                              innerInput: new Uint8Array()
                            });
                            signer.sendTransaction({
                              to,
                              value,
                              data,
                              customData: {
                                gasPerPubdata: utils.DEFAULT_GAS_PER_PUBDATA_LIMIT,
                                paymasterParams: paymasterParams
                              }
                            });
                            const tx = await signer.sendTransaction({
                              to,
                              value,
                              data,
                              customData: {
                                gasPerPubdata: utils.DEFAULT_GAS_PER_PUBDATA_LIMIT,
                                paymasterParams: paymasterParams
                              }
                            });
                            console.log(tx.hash);
                            setHash(tx.hash);

                            const response = { id, result: tx.hash, jsonrpc: "2.0" };
                            console.log(response);
                            await web3Wallet.respondSessionRequest({ topic, response });
                            await tx.wait();
                          }}
                        >
                          Send Tx
                        </button>
                        {hash && (
                          <>
                            <label className="form-label block text-gray-700 font-bold mb-2">Tx Hash</label>
                            <p className="text-xs mb-2 text-blue-600">
                              <a href={`https://goerli.explorer.zksync.io/tx/${hash}`}>{hash}</a>
                            </p>
                          </>
                        )}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
