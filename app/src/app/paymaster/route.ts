import { NextRequest } from "next/server";

//TODO: integrate SSI SDK and signature
export async function POST(request: NextRequest) {
  const signature = "signature";
  return Response.json({ signature });
}
