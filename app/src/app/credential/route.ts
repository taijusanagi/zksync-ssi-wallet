import { NextRequest } from "next/server";

//TODO: integrate SSI SDK
export async function POST(request: NextRequest) {
  const credential = "credential";
  return Response.json({ credential });
}
