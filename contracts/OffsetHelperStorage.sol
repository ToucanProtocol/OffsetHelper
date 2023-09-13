// SPDX-FileCopyrightText: 2022 Toucan Labs
//
// SPDX-License-Identifier: GPL-3.0

pragma solidity ^0.8.0;

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";

contract OffsetHelperStorage is OwnableUpgradeable {
    // token symbol => token address
    mapping(address => address[]) public eligibleSwapPaths;
    mapping(string => address[]) public eligibleSwapPathsBySymbol;

    address public dexRouterAddress;

    address[] public poolAddresses;
    string[] public tokenSymbolsForPaths;
    address[][] public paths;

    // user => (token => amount)
    mapping(address => mapping(address => uint256)) public balances;
}
