import { KeyDIDMethod } from "@jpmorganchase/onyx-ssi-sdk";

export const loadIssuer = async () => {
  const privateKey = process.env.ISSUER_PRIVATE_KEY || "";
  if (!privateKey) {
    throw new Error("Issuer private key is not defined");
  }
  const didKey = new KeyDIDMethod();
  const did = await didKey.generateFromPrivateKey(Buffer.from(privateKey, "hex"));
  return did;
};
