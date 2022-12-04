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
  let nct: IToucanPoolToken;
  let bct: IToucanPoolToken;
  let TOKEN_POOLS = [
    { name: "NCT", token: () => nct },
    { name: "BCT", token: () => bct },
  ];

  async function deployOffsetHelperFixture() {
    let offsetHelper: OffsetHelper;
    let swapper: Swapper;
    let weth: IERC20;
    let wmatic: IWETH;
    let usdc: IERC20;
    let addr1: SignerWithAddress;
    let addr2: SignerWithAddress;
    let addrs: SignerWithAddress[];

    [addr1, addr2, ...addrs] = await ethers.getSigners();

    const offsetHelperFactory = (await ethers.getContractFactory(
      "OffsetHelper",
      addr2
    )) as OffsetHelper__factory;
    offsetHelper = await offsetHelperFactory.deploy(
      ["BCT", "NCT", "USDC", "WETH", "WMATIC"],
      [
        addresses.bct,
        addresses.nct,
        addresses.usdc,
        addresses.weth,
        addresses.wmatic,
      ]
    );

    bct = IToucanPoolToken__factory.connect(addresses.bct, addr2);
    nct = IToucanPoolToken__factory.connect(addresses.nct, addr2);
    usdc = IERC20__factory.connect(addresses.usdc, addr2);
    weth = IERC20__factory.connect(addresses.weth, addr2);
    wmatic = IWETH__factory.connect(addresses.wmatic, addr2);

    const swapperFactory = (await ethers.getContractFactory(
      "Swapper",
      addr2
    )) as Swapper__factory;
    swapper = await swapperFactory.deploy(
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
      nct,
      bct,
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

    TOKEN_POOLS.forEach((pool) => {
      it(`should retire 1 WETH for ${pool.name} redemption`, async function () {
        const { weth } = await loadFixture(deployOffsetHelperFixture);
        await retireFixedInToken(weth, ONE_ETHER, pool.token());
      });

      it(`should retire 100 USDC for ${pool.name} redemption`, async function () {
        const { usdc } = await loadFixture(deployOffsetHelperFixture);
        await retireFixedInToken(usdc, parseUSDC("100"), pool.token());
      });

      it(`should retire 20 WMATIC for ${pool.name} redemption`, async function () {
        const { wmatic } = await loadFixture(deployOffsetHelperFixture);
        await retireFixedInToken(wmatic, parseEther("20"), pool.token());
      });
    });
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

    TOKEN_POOLS.forEach((pool) => {
      it(`should retire 20 MATIC for ${pool.name} redemption`, async function () {
        await retireFixedInETH(parseEther("20"), pool.token());
      });
    });
  });

  describe("#autoOffsetExactOut{ETH,Token}()", function () {
    it("should retire using a MATIC swap and NCT redemption", async function () {
      const { offsetHelper, addr2, nct } = await loadFixture(
        deployOffsetHelperFixture
      );

      // first we set the initial chain state
      const maticBalanceBefore = await addr2.getBalance();
      const nctSupplyBefore = await nct.totalSupply();

      // then we calculate the cost in MATIC of retiring 1.0 TCO2
      const maticCost = await offsetHelper.calculateNeededETHAmount(
        addresses.nct,
        ONE_ETHER
      );

      // then we use the autoOffset function to retire 1.0 TCO2 from MATIC using NCT
      const tx = await (
        await offsetHelper.autoOffsetExactOutETH(addresses.nct, ONE_ETHER, {
          value: maticCost,
        })
      ).wait();

      // we calculate the used gas
      const txFees = tx.gasUsed.mul(tx.effectiveGasPrice);

      // and we set the chain state after the transaction
      const maticBalanceAfter = await addr2.getBalance();
      const nctSupplyAfter = await nct.totalSupply();

      // lastly we compare chain states
      expect(
        formatEther(maticBalanceBefore.sub(maticBalanceAfter)),
        `User should have spent ${formatEther(maticCost)}} MATIC`
      ).to.equal(formatEther(maticCost.add(txFees)));
      expect(
        formatEther(nctSupplyBefore.sub(nctSupplyAfter)),
        "Total supply of NCT should have decreased by 1"
      ).to.equal("1.0");
    });

    it("should retire using a NCT deposit and NCT redemption", async function () {
      const { offsetHelper, addr2, nct } = await loadFixture(
        deployOffsetHelperFixture
      );

      // first we set the initial chain state
      const nctBalanceBefore = await nct.balanceOf(addr2.address);
      const nctSupplyBefore = await nct.totalSupply();

      // then we use the autoOffset function to retire 1.0 TCO2 from NCT
      await (await nct.approve(offsetHelper.address, ONE_ETHER)).wait();
      await offsetHelper.autoOffsetPoolToken(addresses.nct, ONE_ETHER);

      // then we set the chain state after the transaction
      const nctBalanceAfter = await nct.balanceOf(addr2.address);
      const nctSupplyAfter = await nct.totalSupply();

      // and we compare chain states
      expect(
        formatEther(nctBalanceBefore.sub(nctBalanceAfter)),
        `User should have spent 1.0 NCT`
      ).to.equal("1.0");
      expect(
        formatEther(nctSupplyBefore.sub(nctSupplyAfter)),
        "Total supply of NCT should have decreased by 1"
      ).to.equal("1.0");
    });

    it("should retire using a USDC swap and NCT redemption", async function () {
      const { offsetHelper, addr2, nct, usdc } = await loadFixture(
        deployOffsetHelperFixture
      );

      // first we set the initial chain state
      const usdcBalanceBefore = await usdc.balanceOf(addr2.address);
      const nctSupplyBefore = await nct.totalSupply();

      // then we calculate the cost in USDC of retiring 1.0 TCO2
      const usdcCost = await offsetHelper.calculateNeededTokenAmount(
        addresses.usdc,
        addresses.nct,
        ONE_ETHER
      );

      // then we use the autoOffset function to retire 1.0 TCO2 from USDC using NCT
      await (await usdc.approve(offsetHelper.address, usdcCost)).wait();
      await offsetHelper.autoOffsetExactOutToken(
        addresses.usdc,
        addresses.nct,
        ONE_ETHER
      );

      // then we set the chain state after the transaction
      const usdcBalanceAfter = await usdc.balanceOf(addr2.address);
      const nctSupplyAfter = await nct.totalSupply();

      // and we compare chain states
      expect(
        formatEther(usdcBalanceBefore.sub(usdcBalanceAfter)),
        `User should have spent ${formatEther(usdcCost)}} USDC`
      ).to.equal(formatEther(usdcCost));
      expect(
        formatEther(nctSupplyBefore.sub(nctSupplyAfter)),
        "Total supply of NCT should have decreased by 1"
      ).to.equal("1.0");
    });

    it("should retire using a WMATIC swap and NCT redemption", async function () {
      const { offsetHelper, addr2, nct, wmatic } = await loadFixture(
        deployOffsetHelperFixture
      );

      // then we set the initial chain state
      const wmaticBalanceBefore = await wmatic.balanceOf(addr2.address);
      const nctSupplyBefore = await nct.totalSupply();

      // and we calculate the cost in WMATIC of retiring 1.0 TCO2
      const wmaticCost = await offsetHelper.calculateNeededTokenAmount(
        addresses.wmatic,
        addresses.nct,
        ONE_ETHER
      );

      // we use the autoOffset function to retire 1.0 TCO2 from WMATIC using NCT
      await (await wmatic.approve(offsetHelper.address, wmaticCost)).wait();
      await offsetHelper.autoOffsetExactOutToken(
        addresses.wmatic,
        addresses.nct,
        ONE_ETHER
      );

      // then we set the chain state after the transaction
      const wmaticBalanceAfter = await wmatic.balanceOf(addr2.address);
      const nctSupplyAfter = await nct.totalSupply();

      // and we compare chain states
      expect(
        formatEther(wmaticBalanceBefore.sub(wmaticBalanceAfter)),
        `User should have spent ${formatEther(wmaticCost)} WMATIC`
      ).to.equal(formatEther(wmaticCost));
      expect(
        formatEther(nctSupplyBefore.sub(nctSupplyAfter)),
        "Total supply of NCT should have decreased by 1"
      ).to.equal("1.0");
    });

    TOKEN_POOLS.forEach((pool) => {
      it(`should retire 1.0 TCO2 using a WETH swap and ${pool.name} redemption`, async function () {
        const { offsetHelper, addr2, weth } = await loadFixture(
          deployOffsetHelperFixture
        );

        // first we set the initial chain state
        const wethBalanceBefore = await weth.balanceOf(addr2.address);
        const poolTokenSupplyBefore = await pool.token().totalSupply();

        // then we calculate the cost in WETH of retiring 1.0 TCO2
        const wethCost = await offsetHelper.calculateNeededTokenAmount(
          addresses.weth,
          pool.name === "BCT" ? addresses.bct : addresses.nct,
          ONE_ETHER
        );

        // then we use the autoOffset function to retire 1.0 TCO2 from WETH using pool token
        await (await weth.approve(offsetHelper.address, wethCost)).wait();
        await offsetHelper.autoOffsetExactOutToken(
          addresses.weth,
          pool.name === "BCT" ? addresses.bct : addresses.nct,
          ONE_ETHER
        );

        // then we set the chain state after the transaction
        const wethBalanceAfter = await weth.balanceOf(addr2.address);
        const poolTokenSupplyAfter = await pool.token().totalSupply();

        // and we compare chain states
        expect(
          formatEther(wethBalanceBefore.sub(wethBalanceAfter)),
          `User should have spent ${formatEther(wethCost)}} WETH`
        ).to.equal(formatEther(wethCost));
        expect(
          formatEther(poolTokenSupplyBefore.sub(poolTokenSupplyAfter)),
          `Total supply of ${pool.name} should have decreased by 1`
        ).to.equal("1.0");
      });
    });
  });

  describe("#autoRedeem()", function () {
    it("Should fail because we haven't deposited NCT", async function () {
      const { offsetHelper } = await loadFixture(deployOffsetHelperFixture);
      await expect(
        offsetHelper.autoRedeem(addresses.nct, ONE_ETHER)
      ).to.be.revertedWith("Insufficient NCT/BCT balance");
    });

    TOKEN_POOLS.forEach((pool) => {
      it(`should redeem ${pool.name} from deposit`, async function () {
        const { offsetHelper, addr2 } = await loadFixture(
          deployOffsetHelperFixture
        );

        // first we set the initial chain state
        const states: {
          userPoolTokenBalance: BigNumber;
          contractPoolTokenBalance: BigNumber;
          poolTokenSupply: BigNumber;
        }[] = [];
        states.push({
          userPoolTokenBalance: await pool.token().balanceOf(addr2.address),
          contractPoolTokenBalance: await pool
            .token()
            .balanceOf(offsetHelper.address),
          poolTokenSupply: await pool.token().totalSupply(),
        });

        // then we deposit 1.0 pool token into the OH contract
        await (
          await pool.token().approve(offsetHelper.address, ONE_ETHER)
        ).wait();
        await (
          await offsetHelper.deposit(
            pool.name === "BCT" ? addresses.bct : addresses.nct,
            ONE_ETHER
          )
        ).wait();

        // then we set the chain state after the deposit transaction
        states.push({
          userPoolTokenBalance: await pool.token().balanceOf(addr2.address),
          contractPoolTokenBalance: await pool
            .token()
            .balanceOf(offsetHelper.address),
          poolTokenSupply: await pool.token().totalSupply(),
        });

        // and we compare chain states post deposit
        expect(
          formatEther(
            states[0].userPoolTokenBalance.sub(states[1].userPoolTokenBalance)
          ),
          `User should have 1 less ${pool.name} post deposit`
        ).to.equal(formatEther(ONE_ETHER));
        expect(
          formatEther(
            states[1].contractPoolTokenBalance.sub(
              states[0].contractPoolTokenBalance
            )
          ),
          `Contract should have 1 more ${pool.token} post deposit`
        ).to.equal(formatEther(ONE_ETHER));
        expect(
          formatEther(states[0].poolTokenSupply),
          `${pool.token} supply should be the same post deposit`
        ).to.equal(formatEther(states[1].poolTokenSupply));

        // we redeem 1.0 pool token from the OH contract for TCO2s
        await offsetHelper.autoRedeem(
          pool.name === "BCT" ? addresses.bct : addresses.nct,
          ONE_ETHER
        );

        // then we set the chain state after the redeem transaction
        states.push({
          userPoolTokenBalance: await pool.token().balanceOf(addr2.address),
          contractPoolTokenBalance: await pool
            .token()
            .balanceOf(offsetHelper.address),
          poolTokenSupply: await pool.token().totalSupply(),
        });

        // and we compare chain states post redeem
        expect(
          formatEther(states[1].userPoolTokenBalance),
          `User should have the same amount of ${pool.name} post redeem`
        ).to.equal(formatEther(states[2].userPoolTokenBalance));
        expect(
          formatEther(
            states[1].contractPoolTokenBalance.sub(
              states[2].contractPoolTokenBalance
            )
          ),
          `Contract should have 1 less ${pool.name} post redeem`
        ).to.equal(formatEther(ONE_ETHER));
        expect(
          formatEther(states[1].poolTokenSupply.sub(states[2].poolTokenSupply)),
          `${pool.name} supply should be less by 1 post redeem`
        ).to.equal(formatEther(ONE_ETHER));
      });
    });
  });

  describe("#autoRetire()", function () {
    it("Should fail because we haven't redeemed any TCO2", async function () {
      const { offsetHelper } = await loadFixture(deployOffsetHelperFixture);
      await expect(
        offsetHelper.autoRetire(
          ["0xb139C4cC9D20A3618E9a2268D73Eff18C496B991"],
          [ONE_ETHER]
        )
      ).to.be.revertedWith("Insufficient TCO2 balance");
    });

    TOKEN_POOLS.forEach((pool) => {
      it(`should retire using an ${pool.name} deposit`, async function () {
        const { offsetHelper, addr2 } = await loadFixture(
          deployOffsetHelperFixture
        );

        // first we set the initial state
        const state: {
          userPoolTokenBalance: BigNumber;
          contractPoolTokenBalance: BigNumber;
          poolTokenSupply: BigNumber;
        }[] = [];
        state.push({
          userPoolTokenBalance: await pool.token().balanceOf(addr2.address),
          contractPoolTokenBalance: await pool
            .token()
            .balanceOf(offsetHelper.address),
          poolTokenSupply: await pool.token().totalSupply(),
        });

        // we deposit pool token into OH
        await (
          await pool.token().approve(offsetHelper.address, ONE_ETHER)
        ).wait();
        await (
          await offsetHelper.deposit(
            pool.name === "BCT" ? addresses.bct : addresses.nct,
            ONE_ETHER
          )
        ).wait();

        // and we check the state after the deposit
        state.push({
          userPoolTokenBalance: await pool.token().balanceOf(addr2.address),
          contractPoolTokenBalance: await pool
            .token()
            .balanceOf(offsetHelper.address),
          poolTokenSupply: await pool.token().totalSupply(),
        });
        expect(
          formatEther(
            state[0].userPoolTokenBalance.sub(state[1].userPoolTokenBalance)
          ),
          `User should have 1 less ${pool.name} post deposit`
        ).to.equal(formatEther(ONE_ETHER));
        expect(
          formatEther(
            state[1].contractPoolTokenBalance.sub(
              state[0].contractPoolTokenBalance
            )
          ),
          `Contract should have 1 more ${pool.name} post deposit`
        ).to.equal(formatEther(ONE_ETHER));
        expect(
          formatEther(state[0].poolTokenSupply),
          `${pool.name} supply should be the same post deposit`
        ).to.equal(formatEther(state[1].poolTokenSupply));

        // we redeem pool token for TCO2 within OH
        const redeemReceipt = await (
          await offsetHelper.autoRedeem(
            pool.name === "BCT" ? addresses.bct : addresses.nct,
            ONE_ETHER
          )
        ).wait();

        // and we check the state after the redeem
        state.push({
          userPoolTokenBalance: await pool.token().balanceOf(addr2.address),
          contractPoolTokenBalance: await pool
            .token()
            .balanceOf(offsetHelper.address),
          poolTokenSupply: await pool.token().totalSupply(),
        });
        expect(
          formatEther(state[1].userPoolTokenBalance),
          `User should have the same amount of ${pool.name} post redeem`
        ).to.equal(formatEther(state[2].userPoolTokenBalance));
        expect(
          formatEther(
            state[1].contractPoolTokenBalance.sub(
              state[2].contractPoolTokenBalance
            )
          ),
          `Contract should have 1 less ${pool.name} post redeem`
        ).to.equal(formatEther(ONE_ETHER));
        expect(
          formatEther(state[1].poolTokenSupply.sub(state[2].poolTokenSupply)),
          `${pool.name} supply should be less by 1 post redeem`
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
          userPoolTokenBalance: await pool.token().balanceOf(addr2.address),
          contractPoolTokenBalance: await pool
            .token()
            .balanceOf(offsetHelper.address),
          poolTokenSupply: await pool.token().totalSupply(),
        });
        expect(
          formatEther(state[2].userPoolTokenBalance),
          `User should have the same amount of ${pool.name} post retire`
        ).to.equal(formatEther(state[3].userPoolTokenBalance));
        expect(
          formatEther(state[2].contractPoolTokenBalance),
          `Contract should have the same amount of ${pool.name} post retire`
        ).to.equal(formatEther(state[3].contractPoolTokenBalance));
        expect(
          formatEther(state[2].poolTokenSupply),
          `${pool.name} supply should be the same post retire`
        ).to.equal(formatEther(state[3].poolTokenSupply));
      });
    });
  });

  describe("#deposit() and #withdraw()", function () {
    it("Should fail to deposit because we have no NCT", async function () {
      const { offsetHelper, addrs } = await loadFixture(
        deployOffsetHelperFixture
      );
      await (
        await nct.connect(addrs[0]).approve(offsetHelper.address, ONE_ETHER)
      ).wait();

      await expect(
        offsetHelper.connect(addrs[0]).deposit(addresses.nct, ONE_ETHER)
      ).to.be.revertedWith("ERC20: transfer amount exceeds balance");
    });

    it("Should deposit and withdraw 1.0 NCT", async function () {
      const { offsetHelper, addr2 } = await loadFixture(
        deployOffsetHelperFixture
      );
      const preDepositNCTBalance = await nct.balanceOf(addr2.address);

      await (await nct.approve(offsetHelper.address, ONE_ETHER)).wait();

      await (await offsetHelper.deposit(addresses.nct, ONE_ETHER)).wait();

      await (await offsetHelper.withdraw(addresses.nct, ONE_ETHER)).wait();

      const postWithdrawNCTBalance = await nct.balanceOf(addr2.address);

      expect(formatEther(postWithdrawNCTBalance)).to.be.eql(
        formatEther(preDepositNCTBalance)
      );
    });

    it("Should fail to withdraw because we haven't deposited enough NCT", async function () {
      const { offsetHelper } = await loadFixture(deployOffsetHelperFixture);
      await (await nct.approve(offsetHelper.address, ONE_ETHER)).wait();

      await (await offsetHelper.deposit(addresses.nct, ONE_ETHER)).wait();

      await expect(
        offsetHelper.withdraw(addresses.nct, parseEther("2.0"))
      ).to.be.revertedWith("Insufficient balance");
    });

    TOKEN_POOLS.forEach((pool) => {
      it(`Should deposit 1.0 ${pool.name}`, async function () {
        const { offsetHelper, addr2 } = await loadFixture(
          deployOffsetHelperFixture
        );
        await (
          await pool.token().approve(offsetHelper.address, ONE_ETHER)
        ).wait();

        await (
          await offsetHelper.deposit(
            pool.name === "BCT" ? addresses.bct : addresses.nct,
            ONE_ETHER
          )
        ).wait();

        expect(
          formatEther(
            await offsetHelper.balances(
              addr2.address,
              pool.name === "BCT" ? addresses.bct : addresses.nct
            )
          )
        ).to.be.eql("1.0");
      });
    });
  });

  describe("#swapExactOut{ETH,Token}() for NCT", function () {
    it("Should swap MATIC for 1.0 NCT", async function () {
      const { offsetHelper } = await loadFixture(deployOffsetHelperFixture);

      const maticToSend = await offsetHelper.calculateNeededETHAmount(
        addresses.nct,
        ONE_ETHER
      );

      await (
        await offsetHelper.swapExactOutETH(addresses.nct, ONE_ETHER, {
          value: maticToSend,
        })
      ).wait();

      const balance = await nct.balanceOf(offsetHelper.address);
      expect(formatEther(balance)).to.be.eql("1.0");
    });

    it("Should send surplus MATIC to user", async function () {
      const { offsetHelper } = await loadFixture(deployOffsetHelperFixture);

      const preSwapETHBalance = await offsetHelper.provider.getBalance(
        offsetHelper.address
      );

      const maticToSend = await offsetHelper.calculateNeededETHAmount(
        addresses.nct,
        ONE_ETHER
      );

      await (
        await offsetHelper.swapExactOutETH(addresses.nct, ONE_ETHER, {
          value: maticToSend.add(parseEther("0.5")),
        })
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

    it("Should fail since we have no WETH", async function () {
      const { offsetHelper, weth, addrs } = await loadFixture(
        deployOffsetHelperFixture
      );

      await (
        await weth.connect(addrs[0]).approve(offsetHelper.address, ONE_ETHER)
      ).wait();

      await expect(
        offsetHelper
          .connect(addrs[0])
          .swapExactOutToken(addresses.weth, addresses.nct, ONE_ETHER)
      ).to.be.revertedWith("ERC20: transfer amount exceeds balance");
    });

    TOKEN_POOLS.forEach((pool) => {
      it(`Should swap WETH for 1.0 ${pool.name}`, async function () {
        const { offsetHelper, weth, addr2 } = await loadFixture(
          deployOffsetHelperFixture
        );

        const initialBalance = await pool
          .token()
          .balanceOf(offsetHelper.address);

        const neededAmount = await offsetHelper.calculateNeededTokenAmount(
          addresses.weth,
          pool.name === "BCT" ? addresses.bct : addresses.nct,
          ONE_ETHER
        );

        await (await weth.approve(offsetHelper.address, neededAmount)).wait();

        await (
          await offsetHelper.swapExactOutToken(
            addresses.weth,
            pool.name === "BCT" ? addresses.bct : addresses.nct,
            ONE_ETHER
          )
        ).wait();

        // I expect the offsetHelper will have 1 extra pool token in its balance
        const balance = await pool.token().balanceOf(offsetHelper.address);
        expect(formatEther(balance)).to.be.eql(
          formatEther(initialBalance.add(ONE_ETHER))
        );

        // I expect that the user should have his in-contract balance for pool token to be 1.0
        expect(
          formatEther(
            await offsetHelper.balances(
              addr2.address,
              pool.name === "BCT" ? addresses.bct : addresses.nct
            )
          )
        ).to.be.eql("1.0");
      });
    });
  });
});
