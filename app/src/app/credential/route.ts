import { verifyJWT, loadJWK } from "@/lib/jose";
import { NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  const { id_token } = await request.json();
  const jwk = await loadJWK();
  const { handle } = await verifyJWT(jwk, id_token);
  console.log(handle);
  const credential = "credential";
  return Response.json({ credential });
}
