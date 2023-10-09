import { verifyJWT, loadJWK } from "@/lib/jose";
import { loadIssuer } from "@/lib/did";
import { NextRequest } from "next/server";
import { createCredential, JWTService } from "@jpmorganchase/onyx-ssi-sdk";

export async function POST(request: NextRequest) {
  const issuer = await loadIssuer();
  const { id_token, holderDid } = await request.json();
  const jwk = await loadJWK();
  const { handle } = await verifyJWT(jwk, id_token);
  const credentialSubject = {
    handle
  };
  const credentialPayload = await createCredential(issuer.did, holderDid, credentialSubject, ["LensHandle"]);
  const jwtService = new JWTService();
  const vc = await jwtService.signVC(issuer, credentialPayload);
  return Response.json({ vc });
}
