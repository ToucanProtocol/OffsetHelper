import { useSigner } from "wagmi";
import { parseEther } from "ethers/lib/utils";
import { ethers } from "ethers";
import OffsetHelper from "../../deployments/polygon/OffsetHelper.json";

export default function AutoOffsetExactOutETH() {
  // input data for the autoOffsetExactOutETH function
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

  const offset = async () => {
    // determine how much native tokens e.g., MATIC, token must be sent
    const amountOut = await offsetHelper.calculateNeededETHAmount(
      poolAddress,
      amount
    );

    // retire carbon credits using native tokens e.g., MATIC, specifying the exact amount of TCO2s to retire (only on Polygon, not on Celo),
    await offsetHelper.autoOffsetExactOutETH(poolAddress, amount, {
      gasLimit: 3000000,
      value: amountOut,
    });
  };

  return (
    <div>
      <button
        className="inline-flex w-full justify-center rounded-full border px-5 my-5 py-2 text-md font-medium border-wood bg-prosperity text-black hover:bg-snow"
        onClick={offset}
      >
        AutoOffsetExactOutETH
      </button>
    </div>
  );
}
