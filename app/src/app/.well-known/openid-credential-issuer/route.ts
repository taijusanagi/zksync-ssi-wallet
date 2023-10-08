export async function GET(request: Request) {
  return Response.json({
    issuer: `http://localhost:3000`,
    authorization_endpoint: `http://localhost:3000/authorize`,
    token_endpoint: `http://localhost:3000/token`,
    credential_issuer: `http://localhost:3000`,
    credential_endpoint: `http://localhost:3000/credential`,
  });
}
