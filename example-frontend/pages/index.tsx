export default function Home() {
  return (
    <div className="space-y-5 text-black text-base max-w-4xl">
      <h1 className="text-2xl">Welcome to the OffsetHelper Example Frontend</h1>

      <div className="space-y-3">
        <p className="">
          Helper functions that simplify the carbon offsetting (retirement)
          process. Retiring carbon tokens requires multiple steps and
          interactions with Toucan Protocol&lsquo;s main contracts:
        </p>

        <ol className="list-decimal list-outside ml-8">
          <li>
            Obtain a Toucan pool token such as BCT or NCT (by performing a token
            swap).
          </li>
          <li>Redeem the pool token for a TCO2 token.</li>
          <li>Retire the TCO2 token.</li>
        </ol>
      </div>

      <div className="space-y-3">
        <p className="">
          These steps are combined in each of the following &quot;auto
          offset&quot; methods implemented in OffsetHelper to allow a retirement
          within one transaction:
        </p>

        <ul className="list-disc list-outside ml-8 space-y-2">
          <li>
            <code className="text-forest rounded-md bg-gray-200 px-1.5 py-1">
              <a
                className="underline hover:no-underline"
                href="/autoOffsetPoolToken"
                target="_blank"
                rel="noopener noreferrer"
              >
                autoOffsetPoolToken()
              </a>
            </code>{" "}
            - if the user already owns a Toucan pool token such as BCT or NCT;
          </li>
          <li>
            <code className="text-forest rounded-md bg-gray-200 px-1.5 py-1">
              <a
                className="underline hover:no-underline"
                href="/autoOffsetExactOutToken"
                target="_blank"
                rel="noopener noreferrer"
              >
                autoOffsetExactOutToken()
              </a>
            </code>{" "}
            - if the user would like to perform a retirement using an ERC20
            token (USDC, WETH or WMATIC), specifying the exact amount of TCO2s
            to retire;
          </li>
          <li>
            <code className="text-forest rounded-md bg-gray-200 px-1.5 py-1">
              <a
                className="underline hover:no-underline"
                href="/autoOffsetExactInToken"
                target="_blank"
                rel="noopener noreferrer"
              >
                autoOffsetExactInToken()
              </a>
            </code>{" "}
            - if the user would like to perform a retirement using an ERC20
            token (USDC, WETH or WMATIC), specifying the exact amount of token
            to swap into TCO2s;
          </li>
          <li>
            <code className="text-forest rounded-md bg-gray-200 px-1.5 py-1">
              <a
                className="underline hover:no-underline"
                href="/autoOffsetExactOutETH"
                target="_blank"
                rel="noopener noreferrer"
              >
                autoOffsetExactOutETH()
              </a>
            </code>{" "}
            - if the user would like to perform a retirement using MATIC,
            specifying the exact amount of TCO2s to retire;
          </li>
          <li>
            <code className="text-forest rounded-md bg-gray-200 px-1.5 py-1">
              <a
                className="underline hover:no-underline"
                href="/autoOffsetExactInETH"
                target="_blank"
                rel="noopener noreferrer"
              >
                autoOffsetExactInETH()
              </a>
            </code>{" "}
            - if the user would like to perform a retirement using MATIC,
            swapping all sent MATIC into TCO2s;
          </li>
        </ul>
      </div>
    </div>
  );
}
