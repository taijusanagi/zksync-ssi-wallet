import { Provider, utils, Wallet } from "zksync-web3";
import * as ethers from "ethers";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { PAYMASTER_ADDRESS } from "../deployed";

function getPaymaster(hre: HardhatRuntimeEnvironment, wallet: Wallet, address: string) {
  const artifact = hre.artifacts.readArtifactSync("MyPaymaster");
  return new ethers.Contract(address, artifact.abi, wallet);
}

export default async function (hre: HardhatRuntimeEnvironment) {
  const privateKey = process.env.PRIVATE_KEY;
  if (!privateKey) {
    return;
  }
  const provider = new Provider("https://zksync2-testnet.zksync.dev");
  const wallet = new Wallet(privateKey).connect(provider);

  const paymaster = getPaymaster(hre, wallet, PAYMASTER_ADDRESS);

  const tx = await paymaster.withdraw(wallet.address);
  await tx.wait();

  const paymasterBalance = await provider.getBalance(PAYMASTER_ADDRESS);
  console.log(`Paymaster ETH balance is now ${paymasterBalance.toString()}`);
}
