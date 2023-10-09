import { NextRequest } from "next/server";
import { redirect } from "next/navigation";

import { LensClient, production } from "@lens-protocol/client";
import { ethers } from "ethers";

const lensClient = new LensClient({
  environment: production
});

//TODO: integrate OIDC
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const handle = searchParams.get("handle") as string;
  const signature = searchParams.get("signature") as string;
  const data = await lensClient.profile.fetch({ handle });
  const recoveredAddress = ethers.utils.verifyMessage(handle, signature);
  if (data?.ownedBy !== recoveredAddress) {
    throw new Error("Signature invalid");
  }
  const code = "code";
  const redirect_uri = searchParams.get("redirect_uri");
  redirect(`${redirect_uri}?code=${code}`);
}
