import { loadJWK } from "../../../lib/jose";

export async function GET(request: Request) {
  const jwk = await loadJWK();
  return Response.json([jwk.toJSON()]);
}
