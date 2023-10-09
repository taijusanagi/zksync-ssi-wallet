import { Provider, utils, Wallet } from "zksync-web3";
import * as ethers from "ethers";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { PAYMASTER_ADDRESS, SAMPLE_ADDRESS } from "../deployed";

function getSample(hre: HardhatRuntimeEnvironment, wallet: Wallet, address: string) {
  const artifact = hre.artifacts.readArtifactSync("Sample");
  return new ethers.Contract(address, artifact.abi, wallet);
}

function getPaymaster(hre: HardhatRuntimeEnvironment, wallet: Wallet, address: string) {
  const artifact = hre.artifacts.readArtifactSync("MyPaymaster");
  return new ethers.Contract(address, artifact.abi, wallet);
}

export default async function (hre: HardhatRuntimeEnvironment) {
  const provider = new Provider("https://zksync2-testnet.zksync.dev");

  const emptyWallet = Wallet.createRandom().connect(provider);
  // Obviously this step is not required, but it is here purely to demonstrate that indeed the wallet has no ether.
  const ethBalance = await emptyWallet.getBalance();
  if (!ethBalance.eq(0)) {
    throw new Error("The wallet is not empty!");
  }

  const privateKey = process.env.PRIVATE_KEY;
  if (!privateKey) {
    return;
  }
  const ownerWallet = new Wallet(privateKey).connect(provider);

  const sample = await getSample(hre, emptyWallet, SAMPLE_ADDRESS);
  const paymaster = await getPaymaster(hre, ownerWallet, PAYMASTER_ADDRESS);
  const setTx = await paymaster.setLensHolder(emptyWallet.address, true);
  await setTx.wait();

  let paymasterBalance = await provider.getBalance(PAYMASTER_ADDRESS);
  console.log(`Paymaster ETH balance is ${paymasterBalance.toString()}`);

  // Encoding the "ApprovalBased" paymaster flow's input
  const paymasterParams = utils.getPaymasterParams(PAYMASTER_ADDRESS, {
    type: "General",
    innerInput: new Uint8Array(),
  });

  const sendTx = await sample.test("test", {
    customData: {
      paymasterParams: paymasterParams,
      gasPerPubdata: utils.DEFAULT_GAS_PER_PUBDATA_LIMIT,
    },
  });
  await sendTx.wait();

  paymasterBalance = await provider.getBalance(PAYMASTER_ADDRESS);
  console.log(`Paymaster ETH balance is now ${paymasterBalance.toString()}`);
}
