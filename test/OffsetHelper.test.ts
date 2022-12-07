// SPDX-License-Identifier: GPL-3.0

import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import { expect } from "chai";
import { ethers } from "hardhat";
import { formatEther, parseEther, parseUnits } from "ethers/lib/utils";

import {
  IERC20,
  IERC20__factory,
  IWETH,
  IWETH__factory,
  IToucanPoolToken,
  IToucanPoolToken__factory,
  OffsetHelper,
  OffsetHelper__factory,
  Swapper,
  Swapper__factory,
} from "../typechain";
import addresses from "../utils/addresses";
import { BigNumber } from "ethers";
import { sum as sumBN } from "../utils/bignumber";

const ONE_ETHER = parseEther("1.0");

function parseUSDC(s: string): BigNumber {
  return parseUnits(s, 6);
}

describe("OffsetHelper", function () {
  const TOKEN_POOLS = ["nct", "bct"];

  async function deployOffsetHelperFixture() {
    const [addr1, addr2, ...addrs] = await ethers.getSigners();

    const offsetHelperFactory = (await ethers.getContractFactory(
      "OffsetHelper",
      addr2
    )) as OffsetHelper__factory;
    const offsetHelper = await offsetHelperFactory.deploy(
      ["BCT", "NCT", "USDC", "WETH", "WMATIC"],
      [
        addresses.bct,
        addresses.nct,
        addresses.usdc,
        addresses.weth,
        addresses.wmatic,
      ]
    );

    const bct = IToucanPoolToken__factory.connect(addresses.bct, addr2);
    const nct = IToucanPoolToken__factory.connect(addresses.nct, addr2);
    const usdc = IERC20__factory.connect(addresses.usdc, addr2);
    const weth = IERC20__factory.connect(addresses.weth, addr2);
    const wmatic = IWETH__factory.connect(addresses.wmatic, addr2);

    const tokens = {
      nct: {
        name: "NCT",
        token: () => nct,
      },
      bct: {
        name: "BCT",
        token: () => bct,
      },
    };

    const swapperFactory = (await ethers.getContractFactory(
      "Swapper",
      addr2
    )) as Swapper__factory;
    const swapper = await swapperFactory.deploy(
      ["BCT", "NCT", "USDC", "WETH", "WMATIC"],
      [
        addresses.bct,
        addresses.nct,
        addresses.usdc,
        addresses.weth,
        addresses.wmatic,
      ]
    );

    await Promise.all(
      addrs.map(async (addr) => {
        await addr.sendTransaction({
          to: addr2.address,
          value: (await addr.getBalance()).sub(ONE_ETHER),
        });
      })
    );

    await IWETH__factory.connect(addresses.wmatic, addr2).deposit({
      value: parseEther("1000"),
    });

    await swapper.swap(addresses.weth, parseEther("20.0"), {
      value: await swapper.calculateNeededETHAmount(
        addresses.weth,
        parseEther("20.0")
      ),
    });

    await swapper.swap(addresses.usdc, parseUSDC("1000"), {
      value: await swapper.calculateNeededETHAmount(
        addresses.usdc,
        parseUSDC("1000")
      ),
    });

    await swapper.swap(addresses.bct, parseEther("50.0"), {
      value: await swapper.calculateNeededETHAmount(
        addresses.bct,
        parseEther("50.0")
      ),
    });

    await swapper.swap(addresses.nct, parseEther("50.0"), {
      value: await swapper.calculateNeededETHAmount(
        addresses.nct,
        parseEther("50.0")
      ),
    });

    return {
      offsetHelper,
      weth,
      wmatic,
      usdc,
      addr1,
      addr2,
      addrs,
      tokens,
    };
  }

  describe("#autoOffsetExactInToken()", function () {
    async function retireFixedInToken(
      fromToken: IERC20,
      fromAmount: BigNumber,
      poolToken: IToucanPoolToken
    ) {
      const { offsetHelper, addr2 } = await loadFixture(
        deployOffsetHelperFixture
      );

      const expOffset = await offsetHelper.calculateExpectedPoolTokenForToken(
        fromToken.address,
        fromAmount,
        poolToken.address
      );
      // sanity check
      expect(expOffset).to.be.greaterThan(0);

      await fromToken.approve(offsetHelper.address, fromAmount);

      const supplyBefore = await poolToken.totalSupply();
      await expect(
        offsetHelper.autoOffsetExactInToken(
          fromToken.address,
          fromAmount,
          poolToken.address
        )
      )
        .to.emit(offsetHelper, "Redeemed")
        .withArgs(
          addr2.address,
          poolToken.address,
          anyValue,
          (amounts: BigNumber[]) => {
            return expOffset == sumBN(amounts);
          }
        )
        .and.to.changeTokenBalance(
          fromToken,
          addr2.address,
          fromAmount.mul(-1)
        );

      const supplyAfter = await poolToken.totalSupply();
      expect(supplyBefore.sub(supplyAfter)).to.equal(expOffset);
    }

    for (const name of TOKEN_POOLS) {
      it(`should retire 1 WETH for ${name.toUpperCase()} redemption`, async function () {
        const { weth, tokens } = await loadFixture(deployOffsetHelperFixture);
        // @ts-ignore
        const poolToken = tokens[name];
        await retireFixedInToken(weth, ONE_ETHER, poolToken.token());
      });

      it(`should retire 100 USDC for ${name.toUpperCase()} redemption`, async function () {
        const { usdc, tokens } = await loadFixture(deployOffsetHelperFixture);
        // @ts-ignore
        const poolToken = tokens[name];
        await retireFixedInToken(usdc, parseUSDC("100"), poolToken.token());
      });

      it(`should retire 20 WMATIC for ${name.toUpperCase()} redemption`, async function () {
        const { wmatic, tokens } = await loadFixture(deployOffsetHelperFixture);
        // @ts-ignore
        const poolToken = tokens[name];
        await retireFixedInToken(wmatic, parseEther("20"), poolToken.token());
      });
    }
  });

  describe("#autoOffsetExactInETH()", function () {
    async function retireFixedInETH(
      fromAmount: BigNumber,
      poolToken: IToucanPoolToken
    ) {
      const { offsetHelper, addr2 } = await loadFixture(
        deployOffsetHelperFixture
      );

      const expOffset = await offsetHelper.calculateExpectedPoolTokenForETH(
        fromAmount,
        poolToken.address
      );
      // sanity check, should easily be > 1 tonne for all provided inputs
      expect(expOffset).to.be.greaterThan(0);

      const supplyBefore = await poolToken.totalSupply();
      await expect(
        offsetHelper.autoOffsetExactInETH(poolToken.address, {
          value: fromAmount,
        })
      )
        .to.emit(offsetHelper, "Redeemed")
        .withArgs(
          addr2.address,
          poolToken.address,
          anyValue,
          (amounts: BigNumber[]) => {
            return expOffset == sumBN(amounts);
          }
        )
        .and.to.changeEtherBalance(addr2.address, fromAmount.mul(-1));

      const supplyAfter = await poolToken.totalSupply();
      expect(supplyBefore.sub(supplyAfter)).to.equal(expOffset);
    }

    for (const name of TOKEN_POOLS) {
      it(`should retire 20 MATIC for ${name.toUpperCase()} redemption`, async function () {
        const { tokens } = await loadFixture(deployOffsetHelperFixture);
        // @ts-ignore
        const poolToken = tokens[name];
        await retireFixedInETH(parseEther("20"), poolToken.token());
      });
    }
  });

  describe("#autoOffsetExactOut{ETH,Token}()", function () {
    for (const name of TOKEN_POOLS) {
      it(`should retire 1.0 TCO2 using a MATIC swap and ${name.toUpperCase()} redemption`, async function () {
        const { offsetHelper, addr2, tokens } = await loadFixture(
          deployOffsetHelperFixture
        );
        // extracting the the pool token for this loop
        // @ts-ignore
        const poolToken = tokens[name];

        // first we set the initial chain state
        const maticBalanceBefore = await addr2.getBalance();
        const poolTokenSupplyBefore = await poolToken.token().totalSupply();

        // then we calculate the cost in MATIC of retiring 1.0 TCO2
        const maticCost = await offsetHelper.calculateNeededETHAmount(
          poolToken.name === "BCT" ? addresses.bct : addresses.nct,
          ONE_ETHER
        );

        // then we use the autoOffset function to retire 1.0 TCO2 from MATIC using NCT
        const tx = await (
          await offsetHelper.autoOffsetExactOutETH(
            poolToken.name === "BCT" ? addresses.bct : addresses.nct,
            ONE_ETHER,
            {
              value: maticCost,
            }
          )
        ).wait();

        // we calculate the used gas
        const txFees = tx.gasUsed.mul(tx.effectiveGasPrice);

        // and we set the chain state after the transaction
        const maticBalanceAfter = await addr2.getBalance();
        const poolTokenSupplyAfter = await poolToken.token().totalSupply();

        // lastly we compare chain states
        expect(
          formatEther(maticBalanceBefore.sub(maticBalanceAfter)),
          `User should have spent ${formatEther(maticCost)}} MATIC`
        ).to.equal(formatEther(maticCost.add(txFees)));
        expect(
          formatEther(poolTokenSupplyBefore.sub(poolTokenSupplyAfter)),
          `Total supply of ${name.toUpperCase()} should have decreased by 1`
        ).to.equal("1.0");
      });

      it(`should retire 1.0 TCO2 using a ${name.toUpperCase()} deposit and ${name.toUpperCase()} redemption`, async function () {
        const { offsetHelper, addr2, tokens } = await loadFixture(
          deployOffsetHelperFixture
        );
        // extracting the the pool token for this loop
        // @ts-ignore
        const poolToken = tokens[name];

        // first we set the initial chain state
        const poolTokenBalanceBefore = await poolToken
          .token()
          .balanceOf(addr2.address);
        const poolTokenSupplyBefore = await poolToken.token().totalSupply();

        // then we use the autoOffset function to retire 1.0 TCO2 from NCT/BCT
        await (
          await poolToken.token().approve(offsetHelper.address, ONE_ETHER)
        ).wait();
        await offsetHelper.autoOffsetPoolToken(
          poolToken.name === "BCT" ? addresses.bct : addresses.nct,
          ONE_ETHER
        );

        // then we set the chain state after the transaction
        const poolTokenBalanceAfter = await poolToken
          .token()
          .balanceOf(addr2.address);
        const poolTokenSupplyAfter = await poolToken.token().totalSupply();

        // and we compare chain states
        expect(
          formatEther(poolTokenBalanceBefore.sub(poolTokenBalanceAfter)),
          `User should have spent 1.0 ${poolToken.name}`
        ).to.equal("1.0");
        expect(
          formatEther(poolTokenSupplyBefore.sub(poolTokenSupplyAfter)),
          `Total supply of ${poolToken.name} should have decreased by 1`
        ).to.equal("1.0");
      });

      it(`should retire 1.0 TCO2 using a ${name.toUpperCase()} deposit and ${name.toUpperCase()} redemption`, async function () {
        const { offsetHelper, addr2, tokens } = await loadFixture(
          deployOffsetHelperFixture
        );
        // extracting the the pool token for this loop
        // @ts-ignore
        const poolToken = tokens[name];

        // first we set the initial chain state
        const poolTokenBalanceBefore = await poolToken
          .token()
          .balanceOf(addr2.address);
        const poolTokenSupplyBefore = await poolToken.token().totalSupply();

        // then we use the autoOffset function to retire 1.0 TCO2 from NCT/BCT
        await (
          await poolToken.token().approve(offsetHelper.address, ONE_ETHER)
        ).wait();
        await offsetHelper.autoOffsetPoolToken(
          poolToken.name === "BCT" ? addresses.bct : addresses.nct,
          ONE_ETHER
        );

        // then we set the chain state after the transaction
        const poolTokenBalanceAfter = await poolToken
          .token()
          .balanceOf(addr2.address);
        const poolTokenSupplyAfter = await poolToken.token().totalSupply();

        // and we compare chain states
        expect(
          formatEther(poolTokenBalanceBefore.sub(poolTokenBalanceAfter)),
          `User should have spent 1.0 ${poolToken.name}`
        ).to.equal("1.0");
        expect(
          formatEther(poolTokenSupplyBefore.sub(poolTokenSupplyAfter)),
          `Total supply of ${poolToken.name} should have decreased by 1`
        ).to.equal("1.0");
      });

      it(`should retire 1.0 TCO2 using a USDC swap and ${name.toUpperCase()} redemption`, async function () {
        const { offsetHelper, addr2, usdc, tokens } = await loadFixture(
          deployOffsetHelperFixture
        );
        // extracting the the pool token for this loop
        // @ts-ignore
        const poolToken = tokens[name];

        // first we set the initial chain state
        const usdcBalanceBefore = await usdc.balanceOf(addr2.address);
        const poolTokenSupplyBefore = await poolToken.token().totalSupply();

        // then we calculate the cost in USDC of retiring 1.0 TCO2
        const usdcCost = await offsetHelper.calculateNeededTokenAmount(
          addresses.usdc,
          poolToken.name === "BCT" ? addresses.bct : addresses.nct,
          ONE_ETHER
        );

        // then we use the autoOffset function to retire 1.0 TCO2 from USDC using NCT/BCT
        await (await usdc.approve(offsetHelper.address, usdcCost)).wait();
        await offsetHelper.autoOffsetExactOutToken(
          addresses.usdc,
          poolToken.name === "BCT" ? addresses.bct : addresses.nct,
          ONE_ETHER
        );

        // then we set the chain state after the transaction
        const usdcBalanceAfter = await usdc.balanceOf(addr2.address);
        const poolTokenSupplyAfter = await poolToken.token().totalSupply();

        // and we compare chain states
        expect(
          formatEther(usdcBalanceBefore.sub(usdcBalanceAfter)),
          `User should have spent ${formatEther(usdcCost)}} USDC`
        ).to.equal(formatEther(usdcCost));
        expect(
          formatEther(poolTokenSupplyBefore.sub(poolTokenSupplyAfter)),
          `Total supply of ${poolToken.name} should have decreased by 1`
        ).to.equal("1.0");
      });

      it(`should retire 1.0 TCO2 using a WMATIC swap and ${name.toUpperCase()} redemption`, async function () {
        const { offsetHelper, addr2, wmatic, tokens } = await loadFixture(
          deployOffsetHelperFixture
        );
        // extracting the the pool token for this loop
        // @ts-ignore
        const poolToken = tokens[name];

        // then we set the initial chain state
        const wmaticBalanceBefore = await wmatic.balanceOf(addr2.address);
        const poolTokenSupplyBefore = await poolToken.token().totalSupply();

        // and we calculate the cost in WMATIC of retiring 1.0 TCO2
        const wmaticCost = await offsetHelper.calculateNeededTokenAmount(
          addresses.wmatic,
          poolToken.name === "BCT" ? addresses.bct : addresses.nct,
          ONE_ETHER
        );

        // we use the autoOffset function to retire 1.0 TCO2 from WMATIC using NCT
        await (await wmatic.approve(offsetHelper.address, wmaticCost)).wait();
        await offsetHelper.autoOffsetExactOutToken(
          addresses.wmatic,
          poolToken.name === "BCT" ? addresses.bct : addresses.nct,
          ONE_ETHER
        );

        // then we set the chain state after the transaction
        const wmaticBalanceAfter = await wmatic.balanceOf(addr2.address);
        const poolTokenSupplyAfter = await poolToken.token().totalSupply();

        // and we compare chain states
        expect(
          formatEther(wmaticBalanceBefore.sub(wmaticBalanceAfter)),
          `User should have spent ${formatEther(wmaticCost)} WMATIC`
        ).to.equal(formatEther(wmaticCost));
        expect(
          formatEther(poolTokenSupplyBefore.sub(poolTokenSupplyAfter)),
          `Total supply of ${poolToken.name} should have decreased by 1`
        ).to.equal("1.0");
      });

      it(`should retire 1.0 TCO2 using a WETH swap and ${name.toUpperCase()} redemption`, async function () {
        const { offsetHelper, addr2, weth, tokens } = await loadFixture(
          deployOffsetHelperFixture
        );
        // extracting the the pool token for this loop
        // @ts-ignore
        const poolToken = tokens[name];

        // first we set the initial chain state
        const wethBalanceBefore = await weth.balanceOf(addr2.address);
        const poolTokenSupplyBefore = await poolToken.token().totalSupply();

        // then we calculate the cost in WETH of retiring 1.0 TCO2
        const wethCost = await offsetHelper.calculateNeededTokenAmount(
          addresses.weth,
          poolToken.name === "BCT" ? addresses.bct : addresses.nct,
          ONE_ETHER
        );

        // then we use the autoOffset function to retire 1.0 TCO2 from WETH using pool token
        await (await weth.approve(offsetHelper.address, wethCost)).wait();
        await offsetHelper.autoOffsetExactOutToken(
          addresses.weth,
          poolToken.name === "BCT" ? addresses.bct : addresses.nct,
          ONE_ETHER
        );

        // then we set the chain state after the transaction
        const wethBalanceAfter = await weth.balanceOf(addr2.address);
        const poolTokenSupplyAfter = await poolToken.token().totalSupply();

        // and we compare chain states
        expect(
          formatEther(wethBalanceBefore.sub(wethBalanceAfter)),
          `User should have spent ${formatEther(wethCost)}} WETH`
        ).to.equal(formatEther(wethCost));
        expect(
          formatEther(poolTokenSupplyBefore.sub(poolTokenSupplyAfter)),
          `Total supply of ${poolToken.name} should have decreased by 1`
        ).to.equal("1.0");
      });
    }
  });

  describe("#autoRedeem()", function () {
    for (const name of TOKEN_POOLS) {
      it(`should fail because we haven't deposited ${name.toUpperCase()}`, async function () {
        const { offsetHelper, tokens } = await loadFixture(
          deployOffsetHelperFixture
        );
        // @ts-ignore
        const poolToken = tokens[name];

        await expect(
          offsetHelper.autoRedeem(
            poolToken.name === "BCT" ? addresses.bct : addresses.nct,
            ONE_ETHER
          )
        ).to.be.revertedWith("Insufficient NCT/BCT balance");
      });

      it(`should redeem ${name.toUpperCase()} from deposit`, async function () {
        const { offsetHelper, addr2, tokens } = await loadFixture(
          deployOffsetHelperFixture
        );
        // extracting the the pool token for this loop
        // @ts-ignore
        const poolToken = tokens[name];

        // first we set the initial chain state
        const states: {
          userPoolTokenBalance: BigNumber;
          contractPoolTokenBalance: BigNumber;
          poolTokenSupply: BigNumber;
        }[] = [];
        states.push({
          userPoolTokenBalance: await poolToken
            .token()
            .balanceOf(addr2.address),
          contractPoolTokenBalance: await poolToken
            .token()
            .balanceOf(offsetHelper.address),
          poolTokenSupply: await poolToken.token().totalSupply(),
        });

        // then we deposit 1.0 pool token into the OH contract
        await (
          await poolToken.token().approve(offsetHelper.address, ONE_ETHER)
        ).wait();
        await (
          await offsetHelper.deposit(
            poolToken.name === "BCT" ? addresses.bct : addresses.nct,
            ONE_ETHER
          )
        ).wait();

        // then we set the chain state after the deposit transaction
        states.push({
          userPoolTokenBalance: await poolToken
            .token()
            .balanceOf(addr2.address),
          contractPoolTokenBalance: await poolToken
            .token()
            .balanceOf(offsetHelper.address),
          poolTokenSupply: await poolToken.token().totalSupply(),
        });

        // and we compare chain states post deposit
        expect(
          formatEther(
            states[0].userPoolTokenBalance.sub(states[1].userPoolTokenBalance)
          ),
          `User should have 1 less ${poolToken.name} post deposit`
        ).to.equal(formatEther(ONE_ETHER));
        expect(
          formatEther(
            states[1].contractPoolTokenBalance.sub(
              states[0].contractPoolTokenBalance
            )
          ),
          `Contract should have 1 more ${poolToken.token} post deposit`
        ).to.equal(formatEther(ONE_ETHER));
        expect(
          formatEther(states[0].poolTokenSupply),
          `${poolToken.token} supply should be the same post deposit`
        ).to.equal(formatEther(states[1].poolTokenSupply));

        // we redeem 1.0 pool token from the OH contract for TCO2s
        await offsetHelper.autoRedeem(
          poolToken.name === "BCT" ? addresses.bct : addresses.nct,
          ONE_ETHER
        );

        // then we set the chain state after the redeem transaction
        states.push({
          userPoolTokenBalance: await poolToken
            .token()
            .balanceOf(addr2.address),
          contractPoolTokenBalance: await poolToken
            .token()
            .balanceOf(offsetHelper.address),
          poolTokenSupply: await poolToken.token().totalSupply(),
        });

        // and we compare chain states post redeem
        expect(
          formatEther(states[1].userPoolTokenBalance),
          `User should have the same amount of ${poolToken.name} post redeem`
        ).to.equal(formatEther(states[2].userPoolTokenBalance));
        expect(
          formatEther(
            states[1].contractPoolTokenBalance.sub(
              states[2].contractPoolTokenBalance
            )
          ),
          `Contract should have 1 less ${poolToken.name} post redeem`
        ).to.equal(formatEther(ONE_ETHER));
        expect(
          formatEther(states[1].poolTokenSupply.sub(states[2].poolTokenSupply)),
          `${poolToken.name} supply should be less by 1 post redeem`
        ).to.equal(formatEther(ONE_ETHER));
      });
    }
  });

  describe("#autoRetire()", function () {
    it("should fail because we haven't redeemed any TCO2", async function () {
      const { offsetHelper } = await loadFixture(deployOffsetHelperFixture);
      await expect(
        offsetHelper.autoRetire(
          ["0xb139C4cC9D20A3618E9a2268D73Eff18C496B991"],
          [ONE_ETHER]
        )
      ).to.be.revertedWith("Insufficient TCO2 balance");
    });

    for (const name of TOKEN_POOLS) {
      it(`should retire using an ${name.toUpperCase()} deposit`, async function () {
        const { offsetHelper, addr2, tokens } = await loadFixture(
          deployOffsetHelperFixture
        );
        // extracting the the pool token for this loop
        // @ts-ignore
        const poolToken = tokens[name];

        // first we set the initial state
        const state: {
          userPoolTokenBalance: BigNumber;
          contractPoolTokenBalance: BigNumber;
          poolTokenSupply: BigNumber;
        }[] = [];
        state.push({
          userPoolTokenBalance: await poolToken
            .token()
            .balanceOf(addr2.address),
          contractPoolTokenBalance: await poolToken
            .token()
            .balanceOf(offsetHelper.address),
          poolTokenSupply: await poolToken.token().totalSupply(),
        });

        // we deposit pool token into OH
        await (
          await poolToken.token().approve(offsetHelper.address, ONE_ETHER)
        ).wait();
        await (
          await offsetHelper.deposit(
            poolToken.name === "BCT" ? addresses.bct : addresses.nct,
            ONE_ETHER
          )
        ).wait();

        // and we check the state after the deposit
        state.push({
          userPoolTokenBalance: await poolToken
            .token()
            .balanceOf(addr2.address),
          contractPoolTokenBalance: await poolToken
            .token()
            .balanceOf(offsetHelper.address),
          poolTokenSupply: await poolToken.token().totalSupply(),
        });
        expect(
          formatEther(
            state[0].userPoolTokenBalance.sub(state[1].userPoolTokenBalance)
          ),
          `User should have 1 less ${poolToken.name} post deposit`
        ).to.equal(formatEther(ONE_ETHER));
        expect(
          formatEther(
            state[1].contractPoolTokenBalance.sub(
              state[0].contractPoolTokenBalance
            )
          ),
          `Contract should have 1 more ${poolToken.name} post deposit`
        ).to.equal(formatEther(ONE_ETHER));
        expect(
          formatEther(state[0].poolTokenSupply),
          `${poolToken.name} supply should be the same post deposit`
        ).to.equal(formatEther(state[1].poolTokenSupply));

        // we redeem pool token for TCO2 within OH
        const redeemReceipt = await (
          await offsetHelper.autoRedeem(
            poolToken.name === "BCT" ? addresses.bct : addresses.nct,
            ONE_ETHER
          )
        ).wait();

        // and we check the state after the redeem
        state.push({
          userPoolTokenBalance: await poolToken
            .token()
            .balanceOf(addr2.address),
          contractPoolTokenBalance: await poolToken
            .token()
            .balanceOf(offsetHelper.address),
          poolTokenSupply: await poolToken.token().totalSupply(),
        });
        expect(
          formatEther(state[1].userPoolTokenBalance),
          `User should have the same amount of ${poolToken.name} post redeem`
        ).to.equal(formatEther(state[2].userPoolTokenBalance));
        expect(
          formatEther(
            state[1].contractPoolTokenBalance.sub(
              state[2].contractPoolTokenBalance
            )
          ),
          `Contract should have 1 less ${poolToken.name} post redeem`
        ).to.equal(formatEther(ONE_ETHER));
        expect(
          formatEther(state[1].poolTokenSupply.sub(state[2].poolTokenSupply)),
          `${poolToken.name} supply should be less by 1 post redeem`
        ).to.equal(formatEther(ONE_ETHER));

        // we get the tco2s and amounts that were redeemed
        if (!redeemReceipt.events) throw new Error("No events emitted");
        const tco2s =
          redeemReceipt.events[redeemReceipt.events.length - 1].args?.tco2s;
        const amounts =
          redeemReceipt.events[redeemReceipt.events.length - 1].args?.amounts;

        // we retire the tco2s
        await offsetHelper.autoRetire(tco2s, amounts);

        // and we check the state after the retire
        state.push({
          userPoolTokenBalance: await poolToken
            .token()
            .balanceOf(addr2.address),
          contractPoolTokenBalance: await poolToken
            .token()
            .balanceOf(offsetHelper.address),
          poolTokenSupply: await poolToken.token().totalSupply(),
        });
        expect(
          formatEther(state[2].userPoolTokenBalance),
          `User should have the same amount of ${poolToken.name} post retire`
        ).to.equal(formatEther(state[3].userPoolTokenBalance));
        expect(
          formatEther(state[2].contractPoolTokenBalance),
          `Contract should have the same amount of ${poolToken.name} post retire`
        ).to.equal(formatEther(state[3].contractPoolTokenBalance));
        expect(
          formatEther(state[2].poolTokenSupply),
          `${poolToken.name} supply should be the same post retire`
        ).to.equal(formatEther(state[3].poolTokenSupply));
      });
    }
  });

  describe("#deposit() and #withdraw()", function () {
    for (const name of TOKEN_POOLS) {
      it(`should fail to deposit because we have no ${name.toUpperCase()}`, async function () {
        const { offsetHelper, addrs, tokens } = await loadFixture(
          deployOffsetHelperFixture
        );
        // extracting the the pool token for this loop
        // @ts-ignore
        const poolToken = tokens[name];

        await (
          await poolToken
            .token()
            .connect(addrs[0])
            .approve(offsetHelper.address, ONE_ETHER)
        ).wait();

        await expect(
          offsetHelper
            .connect(addrs[0])
            .deposit(
              poolToken.name === "BCT" ? addresses.bct : addresses.nct,
              ONE_ETHER
            )
        ).to.be.revertedWith("ERC20: transfer amount exceeds balance");
      });

      it(`should deposit and withdraw 1.0 ${name.toUpperCase()}`, async function () {
        const { offsetHelper, addr2, tokens } = await loadFixture(
          deployOffsetHelperFixture
        );
        // @ts-ignore
        const poolToken = tokens[name];

        const preDepositPoolTokenBalance = await poolToken
          .token()
          .balanceOf(addr2.address);

        await (
          await poolToken.token().approve(offsetHelper.address, ONE_ETHER)
        ).wait();

        await (
          await offsetHelper.deposit(
            poolToken.name === "BCT" ? addresses.bct : addresses.nct,
            ONE_ETHER
          )
        ).wait();

        await (
          await offsetHelper.withdraw(
            poolToken.name === "BCT" ? addresses.bct : addresses.nct,
            ONE_ETHER
          )
        ).wait();

        const postWithdrawPoolTokenBalance = await poolToken
          .token()
          .balanceOf(addr2.address);

        expect(formatEther(postWithdrawPoolTokenBalance)).to.be.eql(
          formatEther(preDepositPoolTokenBalance)
        );
      });

      it(`should fail to withdraw because we haven't deposited enough ${name.toUpperCase()}`, async function () {
        const { offsetHelper, tokens } = await loadFixture(
          deployOffsetHelperFixture
        );
        // @ts-ignore
        const poolToken = tokens[name];

        await (
          await poolToken.token().approve(offsetHelper.address, ONE_ETHER)
        ).wait();

        await (
          await offsetHelper.deposit(
            poolToken.name === "BCT" ? addresses.bct : addresses.nct,
            ONE_ETHER
          )
        ).wait();

        await expect(
          offsetHelper.withdraw(
            poolToken.name === "BCT" ? addresses.bct : addresses.nct,
            parseEther("2.0")
          )
        ).to.be.revertedWith("Insufficient balance");
      });

      it(`should deposit 1.0 ${name.toUpperCase()}`, async function () {
        const { offsetHelper, addr2, tokens } = await loadFixture(
          deployOffsetHelperFixture
        );
        // @ts-ignore
        const poolToken = tokens[name];

        await (
          await poolToken.token().approve(offsetHelper.address, ONE_ETHER)
        ).wait();

        await (
          await offsetHelper.deposit(
            poolToken.name === "BCT" ? addresses.bct : addresses.nct,
            ONE_ETHER
          )
        ).wait();

        expect(
          formatEther(
            await offsetHelper.balances(
              addr2.address,
              poolToken.name === "BCT" ? addresses.bct : addresses.nct
            )
          )
        ).to.be.eql("1.0");
      });
    }
  });

  describe("#swapExactOut{ETH,Token}() for pool token", function () {
    for (const name of TOKEN_POOLS) {
      it(`should swap MATIC for 1.0 ${name.toUpperCase()}`, async function () {
        const { offsetHelper, tokens } = await loadFixture(
          deployOffsetHelperFixture
        );
        // @ts-ignore
        const poolToken = tokens[name];

        const maticToSend = await offsetHelper.calculateNeededETHAmount(
          poolToken.name === "BCT" ? addresses.bct : addresses.nct,
          ONE_ETHER
        );

        await (
          await offsetHelper.swapExactOutETH(
            poolToken.name === "BCT" ? addresses.bct : addresses.nct,
            ONE_ETHER,
            {
              value: maticToSend,
            }
          )
        ).wait();

        const balance = await poolToken.token().balanceOf(offsetHelper.address);
        expect(formatEther(balance)).to.be.eql("1.0");
      });

      it(`should send surplus MATIC to user`, async function () {
        const { offsetHelper, tokens } = await loadFixture(
          deployOffsetHelperFixture
        );
        // @ts-ignore
        const poolToken = tokens[name];

        const preSwapETHBalance = await offsetHelper.provider.getBalance(
          offsetHelper.address
        );

        const maticToSend = await offsetHelper.calculateNeededETHAmount(
          poolToken.name === "BCT" ? addresses.bct : addresses.nct,
          ONE_ETHER
        );

        await (
          await offsetHelper.swapExactOutETH(
            poolToken.name === "BCT" ? addresses.bct : addresses.nct,
            ONE_ETHER,
            {
              value: maticToSend.add(parseEther("0.5")),
            }
          )
        ).wait();

        const postSwapETHBalance = await offsetHelper.provider.getBalance(
          offsetHelper.address
        );

        // I'm expecting that the OffsetHelper doesn't have extra MATIC
        // this check is done to ensure any surplus MATIC has been sent to the user, and not to OffsetHelper
        expect(formatEther(preSwapETHBalance)).to.be.eql(
          formatEther(postSwapETHBalance)
        );
      });

      it(`should fail since we have no WETH`, async function () {
        const { offsetHelper, weth, addrs, tokens } = await loadFixture(
          deployOffsetHelperFixture
        );
        // @ts-ignore
        const poolToken = tokens[name];

        await (
          await weth.connect(addrs[0]).approve(offsetHelper.address, ONE_ETHER)
        ).wait();

        await expect(
          offsetHelper
            .connect(addrs[0])
            .swapExactOutToken(
              addresses.weth,
              poolToken.name === "BCT" ? addresses.bct : addresses.nct,
              ONE_ETHER
            )
        ).to.be.revertedWith("ERC20: transfer amount exceeds balance");
      });

      it(`should swap WETH for 1.0 ${name.toUpperCase()}`, async function () {
        const { offsetHelper, weth, addr2, tokens } = await loadFixture(
          deployOffsetHelperFixture
        );
        // @ts-ignore
        const poolToken = tokens[name];

        const initialBalance = await poolToken
          .token()
          .balanceOf(offsetHelper.address);

        const neededAmount = await offsetHelper.calculateNeededTokenAmount(
          addresses.weth,
          poolToken.name === "BCT" ? addresses.bct : addresses.nct,
          ONE_ETHER
        );

        await (await weth.approve(offsetHelper.address, neededAmount)).wait();

        await (
          await offsetHelper.swapExactOutToken(
            addresses.weth,
            poolToken.name === "BCT" ? addresses.bct : addresses.nct,
            ONE_ETHER
          )
        ).wait();

        // I expect the offsetHelper will have 1 extra pool token in its balance
        const balance = await poolToken.token().balanceOf(offsetHelper.address);
        expect(formatEther(balance)).to.be.eql(
          formatEther(initialBalance.add(ONE_ETHER))
        );

        // I expect that the user should have his in-contract balance for pool token to be 1.0
        expect(
          formatEther(
            await offsetHelper.balances(
              addr2.address,
              poolToken.name === "BCT" ? addresses.bct : addresses.nct
            )
          )
        ).to.be.eql("1.0");
      });
    }
  });
});
