import { verifyJWT } from "did-jwt";
import { NextRequest } from "next/server";
import { ethrProvider, loadIssuer } from "@/lib/did";
import { verifyPresentationJWT, getSupportedResolvers, EthrDIDMethod, KeyDIDMethod } from "@jpmorganchase/onyx-ssi-sdk";

import { Contract, Provider, utils, Wallet } from "zksync-web3";
import PaymasterJson from "@/lib/web3/artifacts/MyPaymaster.json";
import { PAYMASTER_ADDRESS } from "@/lib/web3/deployed";

export async function POST(request: NextRequest) {
  const issuer = await loadIssuer();

  const { vp } = await request.json();
  const didEthr = new EthrDIDMethod(ethrProvider);
  const didKey = new KeyDIDMethod();
  const resolver = getSupportedResolvers([didEthr, didKey]);
  const resultVp = await verifyPresentationJWT(vp, resolver);
  if (!resultVp) {
    throw new Error("vp is invalid");
  }
  const verifiedVp = await verifyJWT(vp, {
    resolver
  });
  console.log(verifiedVp);

  const verifiedVc = await verifyJWT(verifiedVp.payload.vp.verifiableCredential[0], {
    resolver
  });
  console.log(verifiedVc);
  if (verifiedVc.issuer !== issuer.did) {
    throw new Error("vc issuer invalid");
  }
  if (!verifiedVc.payload.vc.type.includes("LensHandle")) {
    throw new Error("vc type invalid");
  }

  const privateKey = process.env.PRIVATE_KEY;
  if (!privateKey) {
    return;
  }
  const provider = new Provider("https://zksync2-testnet.zksync.dev");
  const ownerWallet = new Wallet(privateKey).connect(provider);
  const paymaster = new Contract(PAYMASTER_ADDRESS, PaymasterJson.abi, ownerWallet);
  console.log(verifiedVp.issuer.split(":")[3]);
  const tx = await paymaster.setLensHolder(verifiedVp.issuer.split(":")[3], true);
  console.log("tx.hash", tx.hash);
  await tx.wait();
  return Response.json({ hash: tx.hash });
}
