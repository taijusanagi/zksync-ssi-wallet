import { NextRequest } from "next/server";
import { session } from "@/lib/session";
import { loadJWK, createJWT } from "@/lib/jose";

export async function POST(request: NextRequest) {
  const { code } = await request.json();
  const handle = await session().get(code);
  const nonce = await session().get("nonce");
  const jwk = await loadJWK();
  const id_token = await createJWT(jwk, { nonce, handle });
  return Response.json({ id_token });
}
