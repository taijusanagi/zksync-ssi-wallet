import { loadIssuer } from "../../../lib/did";

export async function GET(request: Request) {
  const issuerDid = await loadIssuer();
  return Response.json({
    issuer: issuerDid.did,
    authorization_endpoint: `${process.env.NEXT_PUBLIC_APP_URI}/authorize`,
    token_endpoint: `${process.env.NEXT_PUBLIC_APP_URI}/token`,
    credential_issuer: `${process.env.NEXT_PUBLIC_APP_URI}`,
    credential_endpoint: `${process.env.NEXT_PUBLIC_APP_URI}/credential`
  });
}
