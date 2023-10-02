import { useProvider } from "wagmi";
import { useSigner } from "wagmi";
import { ethers } from "ethers";
import { parseEther } from "ethers/lib/utils";
import ToucanClient from "toucan-sdk";
import OffsetHelper from "../../deployments/polygon/OffsetHelper.json";

export default function AutoOffsetPoolToken() {
  // input data for the autoOffsetPoolToken function
  const poolAddress = "0xD838290e877E0188a4A44700463419ED96c16107"; // Polygon - NCT
  const amount = parseEther("0.0001");

  // get signer & provider
  const { data: signer } = useSigner();
  const provider = useProvider();

  // get toucanClient from the ToucanSDK to init the poolContract
  const toucan = new ToucanClient("polygon", provider);
  signer && toucan.setSigner(signer);
  const poolToken = toucan.getPoolContract("NCT");

  // create OffsetHelper contract
  const offsetHelper = new ethers.Contract(
    OffsetHelper.address,
    OffsetHelper.abi,
    signer
  );

  const offset = async () => {
    // approve spending of pool tokens
    await (await poolToken.approve(offsetHelper.address, amount)).wait();

    // retire carbon credits if the user already owns a Toucan pool token e.g., NCT,
    await offsetHelper.autoOffsetPoolToken(poolAddress, amount, {
      gasLimit: 3000000,
      value: amount,
    });
  };

  return (
    <div>
      <button
        className="inline-flex w-full justify-center rounded-full border px-5 my-5 py-2 text-md font-medium border-wood bg-prosperity text-black hover:bg-snow"
        onClick={offset}
      >
        AutoOffsetPoolToken
      </button>
    </div>
  );
}
