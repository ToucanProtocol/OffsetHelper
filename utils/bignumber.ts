// SPDX-License-Identifier: GPL-3.0

import { BigNumber } from "ethers";

export function sum(ns: BigNumber[]): BigNumber {
  return ns.reduce((x, y) => x.add(y));
}
