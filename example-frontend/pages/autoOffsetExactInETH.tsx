import { useProvider, useSigner } from "wagmi";
import { useState } from "react";
import { parseEther } from "ethers/lib/utils";
import { ethers } from "ethers";
import OffsetHelper from "../../deployments/polygon/OffsetHelper.json";

export default function AutoOffsetExactInETH() {
  // input data for the autoOffsetExactInETH function
  const poolAddress = "0xD838290e877E0188a4A44700463419ED96c16107"; // Polygon - NCT
  const amount = parseEther("0.0001");
  const [tx, setTx] = useState("");

  // get signer & provider
  const { data: signer } = useSigner();
  const provider = useProvider();

  // create OffsetHelper contract
  const offsetHelper = new ethers.Contract(
    OffsetHelper.address,
    OffsetHelper.abi,
    signer || provider
  );
  // retire carbon credits using native tokens e.g., MATIC, specifying the exact amount of TCO2s to retire (only on Polygon, not on Celo),
  const offset = async () => {
    try {
      const result = await offsetHelper.autoOffsetExactInETH(poolAddress, {
        value: amount,
      });

      setTx(result.hash);
    } catch (error) {
      // Handle the error
      console.error("An error occurred:", error);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center">
      <div className="w-1/2">
        Retire carbon credits using the oldest TCO2 tokens available from the
        specified Toucan token pool by sending native tokens e.g., MATIC. All
        provided native tokens is consumed for offsetting. Use
        `calculateExpectedPoolTokenForETH()` to calculate the expected amount of
        Pool token that can be acquired by swapping the provided amount of
        native tokens e.g., MATIC.:
        <div className="mt-5">
          This function:
          <ol>
            <li>
              1. Swaps the MATIC sent to the contract for the specified pool
              token.
            </li>
            <li>
              2. Redeems the pool token for the oldest TCO2 tokens available.
            </li>
            <li>3. Retires the TCO2 tokens.</li>
          </ol>
        </div>
      </div>
      <button
        className="inline-flex  justify-center rounded-full border px-5 my-5 py-2 text-md font-medium border-wood bg-prosperity text-black hover:bg-snow"
        onClick={offset}
      >
        AutoOffsetExactInETH
      </button>
      {tx && <div>Transaction: {JSON.stringify(tx)}</div>}
    </div>
  );
}
