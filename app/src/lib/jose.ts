import jose from "node-jose";

// this is test generation to create env data
export async function generateJWK() {
  const keystore = jose.JWK.createKeyStore();
  const key = await keystore.generate("RSA", 2048, {
    alg: "RS256",
    use: "sig"
  });
  console.log(JSON.stringify(key.toJSON(true)));
  return key;
}

export async function loadJWK() {
  const jwkString = process.env.JWK;
  if (!jwkString) {
    throw new Error("JWK not found in environment variables.");
  }
  return jose.JWK.asKey(JSON.parse(jwkString));
}

export async function createJWT(key, payload) {
  const iat = Math.floor(Date.now() / 1000);
  const token = await jose.JWS.createSign({ format: "compact" }, key)
    .update(JSON.stringify({ iat, exp: iat + 60 * 60, ...payload }))
    .final();
  return token;
}

export async function verifyJWT(key, jwt) {
  try {
    const result = await jose.JWS.createVerify(key).verify(jwt);
    const payload = JSON.parse(result.payload.toString());
    return payload;
  } catch (error) {
    throw new Error("JWT verification failed");
  }
}
