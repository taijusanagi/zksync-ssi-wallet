import { type NextRequest } from "next/server";
import { redirect } from "next/navigation";

//TODO: integrate OIDC
export async function GET(request: NextRequest) {
  const code = "code";
  const searchParams = request.nextUrl.searchParams;
  const redirect_uri = searchParams.get("redirect_uri");
  redirect(`${redirect_uri}?code=${code}`);
}
