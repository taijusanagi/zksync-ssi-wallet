import { Provider, Wallet } from "zksync-web3";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { Deployer } from "@matterlabs/hardhat-zksync-deploy";

export default async function (hre: HardhatRuntimeEnvironment) {
  const privateKey = process.env.PRIVATE_KEY;
  if (!privateKey) {
    return;
  }

  const provider = new Provider("https://zksync2-testnet.zksync.dev");
  const wallet = new Wallet(privateKey);
  const deployer = new Deployer(hre, wallet);

  const sampleArtifact = await deployer.loadArtifact("Sample");
  const sample = await deployer.deploy(sampleArtifact);
  await sample.deployed();
  console.log(`Sample address: ${sample.address}`);

  // Deploying the paymaster
  const paymasterArtifact = await deployer.loadArtifact("MyPaymaster");
  const paymaster = await deployer.deploy(paymasterArtifact);
  await paymaster.deployed();
  console.log(`Paymaster address: ${paymaster.address}`);

  let paymasterBalance = await provider.getBalance(paymaster.address);

  console.log(`Paymaster ETH balance is now ${paymasterBalance.toString()}`);
  console.log(`Done!`);
}
