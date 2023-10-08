import { type NextRequest } from "next/server";
import { redirect } from "next/navigation";

import { LensClient, production } from "@lens-protocol/client";

const lensClient = new LensClient({
  environment: production
});

//TODO: integrate OIDC
export async function GET(request: NextRequest) {
  const data = await lensClient.profile.fetch({  handle: 'taijusanagi.lens'})
  console.log(data)
  const code = "code";
  const searchParams = request.nextUrl.searchParams;
  const redirect_uri = searchParams.get("redirect_uri");
  redirect(`${redirect_uri}?code=${code}`);
}
