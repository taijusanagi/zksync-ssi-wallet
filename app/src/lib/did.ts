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

export const ethrProvider = {
  name: "goerli",
  rpcUrl: "https://rpc.ankr.com/eth_goerli",
  registry: "0xdca7ef03e98e0dc2b855be647c39abe984fcf21b"
};
