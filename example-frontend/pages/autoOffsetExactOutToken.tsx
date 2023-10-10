import { useProvider, useSigner } from "wagmi";
import { useState } from "react";
import { ethers } from "ethers";
import { FormatTypes, Interface, parseEther } from "ethers/lib/utils";
import OffsetHelper from "../../deployments/polygon/OffsetHelper.json";
import ERC20 from "../abis/ERC20.json";

export default function AutoOffsetExactOutToken() {
  // input data for the autoOffsetExactOutToken function
  const poolAddress = "0xD838290e877E0188a4A44700463419ED96c16107"; // Polygon - NCT
  // const depositedToken = "0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270"; // Polygon - WMATIC
  // const depositedToken = "0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619"; // Polygon - WETH
  const depositedToken = "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174"; // Polygon - USDC
  const amount = parseEther("0.0001");
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
      // determine how much of the ERC20 token must be sent
      const amountOut = await offsetHelper.calculateNeededTokenAmount(
        depositedToken,
        poolAddress,
        amount
      );

      // approve spending of deposited tokens
      await (
        await depositedTokenContract.approve(offsetHelper.address, amountOut)
      ).wait();

      // retire carbon credits using ERC20 token, specifying the exact amount of TCO2s to retire,
      const result = await offsetHelper.autoOffsetExactOutToken(
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
      <div className="w-1/2">
        Retire carbon credits using the oldest TCO2 tokens available from the
        specified Toucan token pool by sending ERC20 tokens (cUSD, USDC, WETH,
        WMATIC). Use `calculateNeededTokenAmount` first in order to find out how
        much of the ERC20 token is required to retire the specified quantity of
        TCO2.
        <div className="mt-5">
          This function:
          <ol>
            <li>
              1. Swaps the ERC20 token sent to the contract for the specified
              pool token.
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
        AutoOffsetExactOutToken
      </button>
      {tx && <div>Transaction: {JSON.stringify(tx)}</div>}
    </div>
  );
}
