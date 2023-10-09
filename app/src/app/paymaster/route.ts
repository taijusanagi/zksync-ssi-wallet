import { verifyJWT } from "did-jwt";
import { NextRequest } from "next/server";
import { ethrProvider, loadIssuer } from "@/lib/did";
import { verifyPresentationJWT, getSupportedResolvers, EthrDIDMethod, KeyDIDMethod } from "@jpmorganchase/onyx-ssi-sdk";
//TODO: integrate SSI SDK and signature
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

  // register
  console.log(verifiedVp.issuer);
  return Response.json({ signature: "ok" });
}
