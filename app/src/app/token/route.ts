import { NextRequest } from "next/server";

//TODO: integrate OIDC
export async function POST(request: NextRequest) {
  const { code } = await request.json();
  const access_token = "access_token";
  return Response.json({ access_token });
}
