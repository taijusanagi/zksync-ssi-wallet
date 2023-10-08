import { Provider, Wallet } from "zksync-web3";
import * as ethers from "ethers";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { Deployer } from "@matterlabs/hardhat-zksync-deploy";
import { PAYMASTER_ADDRESS } from "../deployed";

export default async function (hre: HardhatRuntimeEnvironment) {
  const privateKey = process.env.PRIVATE_KEY;
  if (!privateKey) {
    return;
  }

  const provider = new Provider("https://zksync2-testnet.zksync.dev");
  const wallet = new Wallet(privateKey);
  const deployer = new Deployer(hre, wallet);

  console.log("Funding paymaster with ETH");
  // Supplying paymaster with ETH
  await (
    await deployer.zkWallet.sendTransaction({
      to: PAYMASTER_ADDRESS,
      value: ethers.utils.parseEther("0.1"),
    })
  ).wait();

  let paymasterBalance = await provider.getBalance(PAYMASTER_ADDRESS);

  console.log(`Paymaster ETH balance is now ${paymasterBalance.toString()}`);
  console.log(`Done!`);
}
