# Solidity API

## OffsetHelper

Helper functions that simplify the carbon offsetting (retirement)
process.

Retiring carbon tokens requires multiple steps and interactions with
Toucan Protocol's main contracts:

1. Obtain a Toucan pool token such as BCT or NCT (by performing a token
   swap).
2. Redeem the pool token for a TCO2 token.
3. Retire the TCO2 token.

These steps are combined in each of the following "auto offset" methods
implemented in `OffsetHelper` to allow a retirement within one transaction:

- `autoOffsetPoolToken()` if the user already owns a Toucan pool
  token such as BCT or NCT,
- `autoOffsetExactOutETH()` if the user would like to perform a retirement
  using MATIC, specifying the exact amount of TCO2s to retire,
- `autoOffsetExactInETH()` if the user would like to perform a retirement
  using MATIC, swapping all sent MATIC into TCO2s,
- `autoOffsetExactOutToken()` if the user would like to perform a retirement
  using an ERC20 token (USDC, WETH or WMATIC), specifying the exact amount
  of TCO2s to retire,
- `autoOffsetExactInToken()` if the user would like to perform a retirement
  using an ERC20 token (USDC, WETH or WMATIC), specifying the exact amount
  of token to swap into TCO2s.

In these methods, "auto" refers to the fact that these methods use
`autoRedeem()` in order to automatically choose a TCO2 token corresponding
to the oldest tokenized carbon project in the specfified token pool.
There are no fees incurred by the user when using `autoRedeem()`, i.e., the
user receives 1 TCO2 token for each pool token (BCT/NCT) redeemed.

There are two `view` helper functions `calculateNeededETHAmount()` and
`calculateNeededTokenAmount()` that should be called before using
`autoOffsetExactOutETH()` and `autoOffsetExactOutToken()`, to determine how
much MATIC, respectively how much of the ERC20 token must be sent to the
`OffsetHelper` contract in order to retire the specified amount of carbon.

The two `view` helper functions `calculateExpectedPoolTokenForETH()` and
`calculateExpectedPoolTokenForToken()` can be used to calculate the
expected amount of TCO2s that will be offset using functions
`autoOffsetExactInETH()` and `autoOffsetExactInToken()`.

### constructor

```solidity
constructor(string[] _eligibleTokenSymbols, address[] _eligibleTokenAddresses) public
```

Contract constructor. Should specify arrays of ERC20 symbols and
addresses that can used by the contract.

_See `isEligible()` for a list of tokens that can be used in the
contract. These can be modified after deployment by the contract owner
using `setEligibleTokenAddress()` and `deleteEligibleTokenAddress()`._

#### Parameters

| Name                     | Type      | Description                                                            |
| ------------------------ | --------- | ---------------------------------------------------------------------- |
| \_eligibleTokenSymbols   | string[]  | A list of token symbols.                                               |
| \_eligibleTokenAddresses | address[] | A list of token addresses corresponding to the provided token symbols. |

### Redeemed

```solidity
event Redeemed(address who, address poolToken, address[] tco2s, uint256[] amounts)
```

Emitted upon successful redemption of TCO2 tokens from a Toucan
pool token such as BCT or NCT.

#### Parameters

| Name      | Type      | Description                                                                          |
| --------- | --------- | ------------------------------------------------------------------------------------ |
| who       | address   | The sender of the transaction                                                        |
| poolToken | address   | The address of the Toucan pool token used in the redemption, for example, NCT or BCT |
| tco2s     | address[] | An array of the TCO2 addresses that were redeemed                                    |
| amounts   | uint256[] | An array of the amounts of each TCO2 that were redeemed                              |

### onlyRedeemable

```solidity
modifier onlyRedeemable(address _token)
```

### onlySwappable

```solidity
modifier onlySwappable(address _token)
```

### nativeTokenChain

```solidity
modifier nativeTokenChain()
```

### constructor

```solidity
constructor(address[] _poolAddresses, string[] _tokenSymbolsForPaths, address[][] _paths, address _dexRouterAddress) public
```

Contract constructor. Should specify arrays of ERC20 symbols and
addresses that can used by the contract.

_See `isEligible()` for a list of tokens that can be used in the
contract. These can be modified after deployment by the contract owner
using `setEligibleTokenAddress()` and `deleteEligibleTokenAddress()`._

#### Parameters

| Name                   | Type        | Description                                                                                                                             |
| ---------------------- | ----------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| \_poolAddresses        | address[]   | A list of pool token addresses.                                                                                                         |
| \_tokenSymbolsForPaths | string[]    | An array of symbols of the token the user want to retire carbon credits for                                                             |
| \_paths                | address[][] | An array of arrays of addresses to describe the path needed to swap form the baseToken to the pool Token to the provided token symbols. |
| \_dexRouterAddress     | address     |                                                                                                                                         |

### receive

```solidity
receive() external payable
```

### fallback

```solidity
fallback() external payable
```

### initialize

```solidity
function initialize() external virtual
```

### autoOffsetExactOutToken

```solidity
function autoOffsetExactOutToken(address _depositedToken, address _poolToken, uint256 _amountToOffset) public returns (address[] tco2s, uint256[] amounts)
```

Retire carbon credits using the lowest quality (oldest) TCO2
tokens available from the specified Toucan token pool by sending ERC20
tokens (USDC, WETH, WMATIC). Use `calculateNeededTokenAmount` first in
order to find out how much of the ERC20 token is required to retire the
specified quantity of TCO2.

This function:

1. Swaps the ERC20 token sent to the contract for the specified pool token.
2. Redeems the pool token for the poorest quality TCO2 tokens available.
3. Retires the TCO2 tokens.

Note: The client must approve the ERC20 token that is sent to the contract.

_When automatically redeeming pool tokens for the lowest quality
TCO2s there are no fees and you receive exactly 1 TCO2 token for 1 pool
token._

#### Parameters

| Name             | Type    | Description                                                                              |
| ---------------- | ------- | ---------------------------------------------------------------------------------------- |
| \_depositedToken | address | The address of the ERC20 token that the user sends (must be one of USDC, WETH, WMATIC)   |
| \_poolToken      | address | The address of the Toucan pool token that the user wants to use, for example, NCT or BCT |
| \_amountToOffset | uint256 | The amount of TCO2 to offset                                                             |

#### Return Values

| Name    | Type      | Description                                             |
| ------- | --------- | ------------------------------------------------------- |
| tco2s   | address[] | An array of the TCO2 addresses that were redeemed       |
| amounts | uint256[] | An array of the amounts of each TCO2 that were redeemed |

### autoOffsetExactInToken

```solidity
function autoOffsetExactInToken(address _fromToken, uint256 _amountToSwap, address _poolToken) public returns (address[] tco2s, uint256[] amounts)
```

Retire carbon credits using the lowest quality (oldest) TCO2
tokens available from the specified Toucan token pool by sending ERC20
tokens (USDC, WETH, WMATIC). All provided token is consumed for
offsetting.

This function:

1. Swaps the ERC20 token sent to the contract for the specified pool token.
2. Redeems the pool token for the poorest quality TCO2 tokens available.
3. Retires the TCO2 tokens.

Note: The client must approve the ERC20 token that is sent to the contract.

_When automatically redeeming pool tokens for the lowest quality
TCO2s there are no fees and you receive exactly 1 TCO2 token for 1 pool
token._

#### Parameters

| Name           | Type    | Description                                                                                        |
| -------------- | ------- | -------------------------------------------------------------------------------------------------- |
| \_fromToken    | address | The address of the ERC20 token that the user sends (must be one of USDC, WETH, WMATIC)             |
| \_amountToSwap | uint256 | The amount of ERC20 token to swap into Toucan pool token. Full amount will be used for offsetting. |
| \_poolToken    | address | The address of the Toucan pool token that the user wants to use, for example, NCT or BCT           |

#### Return Values

| Name    | Type      | Description                                             |
| ------- | --------- | ------------------------------------------------------- |
| tco2s   | address[] | An array of the TCO2 addresses that were redeemed       |
| amounts | uint256[] | An array of the amounts of each TCO2 that were redeemed |

### autoOffsetExactOutETH

```solidity
function autoOffsetExactOutETH(address _poolToken, uint256 _amountToOffset) public payable returns (address[] tco2s, uint256[] amounts)
```

Retire carbon credits using the lowest quality (oldest) TCO2
tokens available from the specified Toucan token pool by sending MATIC.
Use `calculateNeededETHAmount()` first in order to find out how much
MATIC is required to retire the specified quantity of TCO2.

This function:

1. Swaps the Matic sent to the contract for the specified pool token.
2. Redeems the pool token for the poorest quality TCO2 tokens available.
3. Retires the TCO2 tokens.

_If the user sends much MATIC, the leftover amount will be sent back
to the user._

#### Parameters

| Name             | Type    | Description                                                                               |
| ---------------- | ------- | ----------------------------------------------------------------------------------------- |
| \_poolToken      | address | The address of the Toucan pool token that the user wants to use, for example, NCT or BCT. |
| \_amountToOffset | uint256 | The amount of TCO2 to offset.                                                             |

#### Return Values

| Name    | Type      | Description                                             |
| ------- | --------- | ------------------------------------------------------- |
| tco2s   | address[] | An array of the TCO2 addresses that were redeemed       |
| amounts | uint256[] | An array of the amounts of each TCO2 that were redeemed |

### autoOffsetExactInETH

```solidity
function autoOffsetExactInETH(address _poolToken) public payable returns (address[] tco2s, uint256[] amounts)
```

Retire carbon credits using the lowest quality (oldest) TCO2
tokens available from the specified Toucan token pool by sending MATIC.
All provided MATIC is consumed for offsetting.

This function:

1. Swaps the Matic sent to the contract for the specified pool token.
2. Redeems the pool token for the poorest quality TCO2 tokens available.
3. Retires the TCO2 tokens.

#### Parameters

| Name        | Type    | Description                                                                               |
| ----------- | ------- | ----------------------------------------------------------------------------------------- |
| \_poolToken | address | The address of the Toucan pool token that the user wants to use, for example, NCT or BCT. |

#### Return Values

| Name    | Type      | Description                                             |
| ------- | --------- | ------------------------------------------------------- |
| tco2s   | address[] | An array of the TCO2 addresses that were redeemed       |
| amounts | uint256[] | An array of the amounts of each TCO2 that were redeemed |

### autoOffsetPoolToken

```solidity
function autoOffsetPoolToken(address _poolToken, uint256 _amountToOffset) public returns (address[] tco2s, uint256[] amounts)
```

Retire carbon credits using the lowest quality (oldest) TCO2
tokens available by sending Toucan pool tokens, for example, BCT or NCT.

This function:

1. Redeems the pool token for the poorest quality TCO2 tokens available.
2. Retires the TCO2 tokens.

Note: The client must approve the pool token that is sent.

#### Parameters

| Name             | Type    | Description                                                                               |
| ---------------- | ------- | ----------------------------------------------------------------------------------------- |
| \_poolToken      | address | The address of the Toucan pool token that the user wants to use, for example, NCT or BCT. |
| \_amountToOffset | uint256 | The amount of TCO2 to offset.                                                             |

#### Return Values

| Name    | Type      | Description                                             |
| ------- | --------- | ------------------------------------------------------- |
| tco2s   | address[] | An array of the TCO2 addresses that were redeemed       |
| amounts | uint256[] | An array of the amounts of each TCO2 that were redeemed |

### autoRedeem

```solidity
function autoRedeem(address _fromToken, uint256 _amount) public returns (address[] tco2s, uint256[] amounts)
```

Redeems the specified amount of NCT / BCT for TCO2.

_Needs to be approved on the client side_

#### Parameters

| Name        | Type    | Description                 |
| ----------- | ------- | --------------------------- |
| \_fromToken | address | Could be the address of NCT |
| \_amount    | uint256 | Amount to redeem            |

#### Return Values

| Name    | Type      | Description                                             |
| ------- | --------- | ------------------------------------------------------- |
| tco2s   | address[] | An array of the TCO2 addresses that were redeemed       |
| amounts | uint256[] | An array of the amounts of each TCO2 that were redeemed |

### autoRetire

```solidity
function autoRetire(address[] _tco2s, uint256[] _amounts) public
```

Retire the specified TCO2 tokens.

#### Parameters

| Name      | Type      | Description                                                         |
| --------- | --------- | ------------------------------------------------------------------- |
| \_tco2s   | address[] | The addresses of the TCO2s to retire                                |
| \_amounts | uint256[] | The amounts to retire from each of the corresponding TCO2 addresses |

### swapExactOutToken

```solidity
function swapExactOutToken(address _fromToken, address _toToken, uint256 _toAmount) public
```

### swapExactInToken

```solidity
function swapExactInToken(address _fromToken, uint256 _fromAmount, address _toToken) public returns (uint256)
```

Swap eligible ERC20 tokens for Toucan pool tokens (BCT/NCT) on
SushiSwap. All provided ERC20 tokens will be swapped.

_Needs to be approved on the client side._

#### Parameters

| Name         | Type    | Description                                                 |
| ------------ | ------- | ----------------------------------------------------------- |
| \_fromToken  | address | The ERC20 token to deposit and swap                         |
| \_fromAmount | uint256 | The amount of ERC20 token to swap                           |
| \_toToken    | address | The Toucan token to swap for (will be held within contract) |

#### Return Values

| Name | Type    | Description                                                                           |
| ---- | ------- | ------------------------------------------------------------------------------------- |
| [0]  | uint256 | Resulting amount of Toucan pool token that got acquired for the swapped ERC20 tokens. |

### swapExactOutETH

```solidity
function swapExactOutETH(address _poolToken, uint256 _toAmount) public payable
```

Swap native tokens e.g., MATIC for Toucan pool tokens (BCT/NCT) on SushiSwap.
Remaining native tokens that was not consumed by the swap is returned.

#### Parameters

| Name        | Type    | Description                                            |
| ----------- | ------- | ------------------------------------------------------ |
| \_poolToken | address | The address of the pool token to swap for, e.g., NCT   |
| \_toAmount  | uint256 | The required amount of the Toucan pool token (NCT/BCT) |

### swapExactInETH

```solidity
function swapExactInETH(address _poolToken) public payable returns (uint256 amountOut)
```

Swap native tokens e.g., MATIC for Toucan pool tokens (BCT/NCT) on SushiSwap. All
provided native tokens will be swapped.

#### Parameters

| Name        | Type    | Description                                          |
| ----------- | ------- | ---------------------------------------------------- |
| \_poolToken | address | The address of the pool token to swap for, e.g., NCT |

#### Return Values

| Name      | Type    | Description                                                                             |
| --------- | ------- | --------------------------------------------------------------------------------------- |
| amountOut | uint256 | Resulting amount of Toucan pool token that got acquired for the swapped native tokens . |

### withdraw

```solidity
function withdraw(address _erc20Addr, uint256 _amount) public
```

Allow users to withdraw tokens they have deposited.

### deposit

```solidity
function deposit(address _erc20Addr, uint256 _amount) public
```

Allow users to deposit BCT / NCT.

_Needs to be approved_

### calculateNeededTokenAmount

```solidity
function calculateNeededTokenAmount(address _fromToken, address _poolToken, uint256 _toAmount) public view returns (uint256 amountIn)
```

Return how much of the specified ERC20 token is required in
order to swap for the desired amount of a Toucan pool token, for
example, e.g., NCT.

#### Parameters

| Name        | Type    | Description                                          |
| ----------- | ------- | ---------------------------------------------------- |
| \_fromToken | address | The address of the ERC20 token used for the swap     |
| \_poolToken | address | The address of the pool token to swap for, e.g., NCT |
| \_toAmount  | uint256 | The desired amount of pool token to receive          |

#### Return Values

| Name     | Type    | Description                                                                                        |
| -------- | ------- | -------------------------------------------------------------------------------------------------- |
| amountIn | uint256 | The amount of the ERC20 token required in order to swap for the specified amount of the pool token |

### calculateNeededETHAmount

```solidity
function calculateNeededETHAmount(address _poolToken, uint256 _toAmount) public view returns (uint256 amountIn)
```

Return how much native tokens e.g, MATIC is required in order to swap for the
desired amount of a Toucan pool token, e.g., NCT.

#### Parameters

| Name        | Type    | Description                                                 |
| ----------- | ------- | ----------------------------------------------------------- |
| \_poolToken | address | The address of the pool token to swap for, for example, NCT |
| \_toAmount  | uint256 | The desired amount of pool token to receive                 |

#### Return Values

| Name     | Type    | Description                                                                                      |
| -------- | ------- | ------------------------------------------------------------------------------------------------ |
| amountIn | uint256 | The amount of native tokens required in order to swap for the specified amount of the pool token |

### calculateExpectedPoolTokenForToken

```solidity
function calculateExpectedPoolTokenForToken(address _fromToken, address _poolToken, uint256 _fromAmount) public view returns (uint256 amountOut)
```

Calculates the expected amount of Toucan Pool token that can be
acquired by swapping the provided amount of ERC20 token.

#### Parameters

| Name         | Type    | Description                                          |
| ------------ | ------- | ---------------------------------------------------- |
| \_fromToken  | address | The address of the ERC20 token used for the swap     |
| \_poolToken  | address | The address of the pool token to swap for, e.g., NCT |
| \_fromAmount | uint256 | The amount of ERC20 token to swap                    |

#### Return Values

| Name      | Type    | Description                                            |
| --------- | ------- | ------------------------------------------------------ |
| amountOut | uint256 | The expected amount of Pool token that can be acquired |

### calculateExpectedPoolTokenForETH

```solidity
function calculateExpectedPoolTokenForETH(address _poolToken, uint256 _fromTokenAmount) public view returns (uint256 amountOut)
```

Calculates the expected amount of Toucan Pool token that can be
acquired by swapping the provided amount of native tokens e.g., MATIC.

#### Parameters

| Name              | Type    | Description                                          |
| ----------------- | ------- | ---------------------------------------------------- |
| \_poolToken       | address | The address of the pool token to swap for, e.g., NCT |
| \_fromTokenAmount | uint256 | The amount of native tokens to swap                  |

#### Return Values

| Name      | Type    | Description                                            |
| --------- | ------- | ------------------------------------------------------ |
| amountOut | uint256 | The expected amount of Pool token that can be acquired |

### calculateExactOutSwap

```solidity
function calculateExactOutSwap(address _fromToken, address _toToken, uint256 _toAmount) internal view returns (address[] path, uint256[] amounts)
```

### calculateExactInSwap

```solidity
function calculateExactInSwap(address _fromToken, uint256 _fromAmount, address _toToken) internal view returns (address[] path, uint256[] amounts)
```

### generatePath

```solidity
function generatePath(address _fromToken, address _toToken) internal view returns (address[])
```

### routerSushi

```solidity
function routerSushi() internal view returns (contract IUniswapV2Router02)
```

### setEligibleTokenAddress

```solidity
function setEligibleTokenAddress(string _tokenSymbol, address _address) public virtual
```

Change or add eligible tokens and their addresses.

#### Parameters

| Name          | Type    | Description                     |
| ------------- | ------- | ------------------------------- |
| \_tokenSymbol | string  | The symbol of the token to add  |
| \_address     | address | The address of the token to add |

### deleteEligibleTokenAddress

```solidity
function deleteEligibleTokenAddress(string _tokenSymbol) public virtual
```

Delete eligible tokens stored in the contract.

#### Parameters

| Name          | Type   | Description                       |
| ------------- | ------ | --------------------------------- |
| \_tokenSymbol | string | The symbol of the token to remove |

### setToucanContractRegistry

```solidity
function setToucanContractRegistry(address _address) public virtual
```

Change the TCO2 contracts registry.

#### Parameters

| Name      | Type    | Description                                        |
| --------- | ------- | -------------------------------------------------- |
| \_address | address | The address of the Toucan contract registry to use |
