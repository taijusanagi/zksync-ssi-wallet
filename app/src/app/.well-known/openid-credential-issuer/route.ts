export async function GET(request: Request) {
  return Response.json({
    issuer: `${process.env.NEXT_PUBLIC_APP_URI}`,
    authorization_endpoint: `${process.env.NEXT_PUBLIC_APP_URI}/authorize`,
    token_endpoint: `${process.env.NEXT_PUBLIC_APP_URI}/token`,
    credential_issuer: `${process.env.NEXT_PUBLIC_APP_URI}`,
    credential_endpoint: `${process.env.NEXT_PUBLIC_APP_URI}/credential`
  });
}
