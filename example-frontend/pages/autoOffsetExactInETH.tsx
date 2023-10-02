import { useSigner } from "wagmi";
import { parseEther } from "ethers/lib/utils";
import { ethers } from "ethers";
import OffsetHelper from "../../deployments/polygon/OffsetHelper.json";

export default function AutoOffsetExactInETH() {
  // input data for the autoOffsetExactInETH function
  const poolAddress = "0xD838290e877E0188a4A44700463419ED96c16107"; // Polygon - NCT
  const amount = parseEther("0.0001");

  // get signer
  const { data: signer } = useSigner();

  // create OffsetHelper contract
  const offsetHelper = new ethers.Contract(
    OffsetHelper.address,
    OffsetHelper.abi,
    signer
  );

  // retire carbon credits using native tokens e.g., MATIC, specifying the exact amount of TCO2s to retire (only on Polygon, not on Celo),
  const offset = async () => {
    await offsetHelper.autoOffsetExactInETH(poolAddress, {
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
        AutoOffsetExactInETH
      </button>
    </div>
  );
}
