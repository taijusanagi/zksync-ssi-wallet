import { NextRequest } from "next/server";
import { session } from "@/lib/session";
import { redirect } from "next/navigation";

export async function GET(request: NextRequest) {
  const redirect_uri = request.nextUrl.searchParams.get("redirect_uri");
  const state = request.nextUrl.searchParams.get("state");
  const nonce = request.nextUrl.searchParams.get("nonce");
  await session().set("state", state);
  await session().set("nonce", nonce);
  redirect(
    `${process.env.NEXT_PUBLIC_APP_URI}/authorize-by-lens?state=${state}&nonce=${nonce}&redirect_uri=${redirect_uri}`
  );
}
