import { NextRequest } from "next/server";

import { LensClient, production } from "@lens-protocol/client";
import { ethers } from "ethers";
import { session } from "@/lib/session";
import crypto from "crypto";

const lensClient = new LensClient({
  environment: production
});

export async function POST(request: NextRequest) {
  const { handle, signature } = await request.json();
  const state = await session().get("state");
  const nonce = await session().get("nonce");
  const data = await lensClient.profile.fetch({ handle });
  const recoveredAddress = ethers.utils.verifyMessage(JSON.stringify({ state, nonce, handle }), signature);
  if (data?.ownedBy !== recoveredAddress) {
    throw new Error("Signature invalid");
  }
  const code = crypto.randomBytes(32).toString("hex");
  await session().set(code, handle);
  return Response.json({ code });
}
