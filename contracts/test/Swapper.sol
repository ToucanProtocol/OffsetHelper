//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@uniswap/v2-periphery/contracts/interfaces/IUniswapV2Router02.sol";

contract Swapper {
    using SafeERC20 for IERC20;

    mapping(address => address[]) public eligibleSwapPaths;
    address public swapToken;
    address public dexRouterAddress;

    constructor(
        address[][] memory _paths,
        address _swapToken,
        address _dexRouterAddress
    ) {
        dexRouterAddress = _dexRouterAddress;
        swapToken = _swapToken;
        uint256 i = 0;
        uint256 eligibleSwapPathsLen = _paths.length;
        while (i < eligibleSwapPathsLen) {
            eligibleSwapPaths[_paths[i][0]] = _paths[i];
            i++;
        }
    }

    function calculateNeededETHAmount(
        address _toToken,
        uint256 _amount
    ) public view returns (uint256) {
        IUniswapV2Router02 dexRouter = IUniswapV2Router02(dexRouterAddress);

        address[] memory path = generatePath(swapToken, _toToken);
        uint256 len = path.length;

        uint256[] memory amounts = dexRouter.getAmountsIn(_amount, path);
        // sanity check arrays
        require(len == amounts.length, "Arrays unequal");
        require(_amount == amounts[len - 1], "Output amount mismatch");
        return amounts[0];
    }

    function swap(address _toToken, uint256 _amount) public payable {
        IUniswapV2Router02 dexRouter = IUniswapV2Router02(dexRouterAddress);

        address[] memory path = generatePath(swapToken, _toToken);

        uint256[] memory amounts = dexRouter.swapETHForExactTokens{
            value: msg.value
        }(_amount, path, address(this), block.timestamp);

        IERC20(_toToken).transfer(msg.sender, _amount);

        if (msg.value > amounts[0]) {
            uint256 leftoverETH = msg.value - amounts[0];
            (bool success, ) = msg.sender.call{value: leftoverETH}(
                new bytes(0)
            );

            require(success, "Failed to send surplus ETH back to user.");
        }
    }

    function generatePath(
        address _fromToken,
        address _toToken
    ) internal view returns (address[] memory path) {
        uint256 len = eligibleSwapPaths[_fromToken].length;
        if (len == 1 || eligibleSwapPaths[_fromToken][1] == _toToken) {
            path = new address[](2);
            path[0] = _fromToken;
            path[1] = _toToken;
            return path;
        }
        if (len == 2 || eligibleSwapPaths[_fromToken][2] == _toToken) {
            path = new address[](3);
            path[0] = _fromToken;
            path[1] = eligibleSwapPaths[_fromToken][1];
            path[2] = _toToken;
            return path;
        }
        if (len == 3 || eligibleSwapPaths[_fromToken][3] == _toToken) {
            path = new address[](3);
            path[0] = _fromToken;
            path[1] = eligibleSwapPaths[_fromToken][1];
            path[2] = eligibleSwapPaths[_fromToken][2];
            path[3] = _toToken;
            return path;
        } else {
            path = new address[](4);
            path[0] = _fromToken;
            path[1] = eligibleSwapPaths[_fromToken][1];
            path[2] = eligibleSwapPaths[_fromToken][2];
            path[3] = eligibleSwapPaths[_fromToken][3];
            path[4] = _toToken;
            return path;
        }
    }

    fallback() external payable {}

    receive() external payable {}
}
