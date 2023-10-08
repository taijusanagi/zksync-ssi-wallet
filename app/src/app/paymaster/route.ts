import { type NextRequest } from "next/server";

//TODO: integrate SSI SDK and signature
export async function POST(request: NextRequest) {
  const credential = "credential";
  return Response.json({ credential });
}
