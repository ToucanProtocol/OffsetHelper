import { useProvider, useSigner } from "wagmi";
import { useState } from "react";
import { FormatTypes, Interface, parseUnits } from "ethers/lib/utils";
import { ethers } from "ethers";
import OffsetHelper from "../../deployments/polygon/OffsetHelper.json";
import ERC20 from "../abis/ERC20.json";

export default function AutoOffsetExactInToken() {
  // input data for the autoOffsetExactInToken function
  const poolAddress = "0xD838290e877E0188a4A44700463419ED96c16107"; // Polygon - NCT
  const depositedToken = "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174"; // Polygon - USDC
  const amount = parseUnits("0.0001", 6);
  const [tx, setTx] = useState("");

  // get signer & provider
  const { data: signer } = useSigner();
  const provider = useProvider();
  // create contract for approve function of the ERC20 token
  const iface = new Interface(ERC20.abi);
  iface.format(FormatTypes.full);
  const depositedTokenContract = new ethers.Contract(
    depositedToken,
    iface,
    signer || provider
  );

  // create OffsetHelper contract
  const offsetHelper = new ethers.Contract(
    OffsetHelper.address,
    OffsetHelper.abi,
    signer || provider
  );
  const offset = async () => {
    try {
      // approve spending of deposited tokens
      await (
        await depositedTokenContract.approve(OffsetHelper.address, amount)
      ).wait();

      // retire carbon credits if the user already owns a Toucan pool token e.g., NCT,
      const result = await offsetHelper.autoOffsetExactInToken(
        depositedToken,
        poolAddress,
        amount
      );
      setTx(result.hash);
    } catch (error) {
      // Handle the error
      console.error("An error occurred:", error);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center">
      <button
        className="inline-flex  justify-center rounded-full border px-5 my-5 py-2 text-md font-medium border-wood bg-prosperity text-black hover:bg-snow"
        onClick={offset}
      >
        AutoOffsetExactInToken
      </button>
      <div>{tx && <div>Transaction: {JSON.stringify(tx)}</div>}</div>
    </div>
  );
}
