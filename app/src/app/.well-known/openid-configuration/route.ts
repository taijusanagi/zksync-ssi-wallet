export async function GET(request: Request) {
  return Response.json({
    issuer: `${process.env.NEXT_PUBLIC_APP_URI}`,
    jwks_uri: `${process.env.NEXT_PUBLIC_APP_URI}/.well-known/jwks.json`
  });
}
