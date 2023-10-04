<div>
<div className="relative flex flex-col h-16 justify-between">
<h1>Welcome to the OffsetHelper Example Frontend</h1>
<p className="m-3">
Helper functions that simplify the carbon offsetting (retirement)
process. Retiring carbon tokens requires multiple steps and
interactions with Toucan Protocol&lsquo;s main contracts:
</p>
<br />
<ol className="m-3">
<li className="m-5">
{" "}
Obtain a Toucan pool token such as BCT or NCT (by performing a token
swap).
</li>
<li className="m-5"> Redeem the pool token for a TCO2 token.</li>
<li className="m-5"> Retire the TCO2 token.</li>
</ol>
<br />
<p className="m-3">
These steps are combined in each of the following &quot;auto
offset&quot; methods implemented in OffsetHelper to allow a retirement
within one transaction:
</p>
<ul>
<li className="m-5">
<code className="text-forest">
<a
                href="/autoOffsetPoolToken"
                target="_blank"
                rel="noopener noreferrer"
              > autoOffsetPoolToken()
</a>
</code>{" "}
if the user already owns a Toucan pool token such as BCT or NCT,
</li>
<li className="m-5">
<code className="text-forest">
<a
                href="/autoOffsetExactOutToken"
                target="_blank"
                rel="noopener noreferrer"
              > autoOffsetExactOutToken()
</a>
</code>{" "}
if the user would like to perform a retirement using an ERC20 token
(USDC, WETH or WMATIC), specifying the exact amount of TCO2s to
retire,
</li>
<li className="m-5">
<code className="text-forest">
<a
                href="/autoOffsetExactInToken"
                target="_blank"
                rel="noopener noreferrer"
              > autoOffsetExactInToken()
</a>
</code>{" "}
if the user would like to perform a retirement using an ERC20 token
(USDC, WETH or WMATIC), specifying the exact amount of token to swap
into TCO2s.
</li>
<li className="m-5">
<code className="text-forest">
<a
                href="/autoOffsetExactOutETH"
                target="_blank"
                rel="noopener noreferrer"
              > autoOffsetExactOutETH()
</a>
</code>{" "}
if the user would like to perform a retirement using MATIC,
specifying the exact amount of TCO2s to retire,
</li>
<li className="m-5">
<code className="text-forest">
<a
                href="/autoOffsetExactInETH"
                target="_blank"
                rel="noopener noreferrer"
              > autoOffsetExactInETH()
</a>
</code>{" "}
if the user would like to perform a retirement using MATIC, swapping
all sent MATIC into TCO2s,
</li>
</ul>
</div>
</div>
