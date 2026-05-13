// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {Math} from "@openzeppelin/contracts/utils/math/Math.sol";
import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import {ERC4626Upgradeable} from "@openzeppelin/contracts-upgradeable/token/ERC20/extensions/ERC4626Upgradeable.sol";
import {OwnableUpgradeable} from "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import {UUPSUpgradeable} from "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import {IERC4626} from "@openzeppelin/contracts/interfaces/IERC4626.sol";
import "hardhat/console.sol";

interface IWETH {
    function deposit() external payable;

    function withdraw(uint256 wad) external;

    function balanceOf(address) external view returns (uint256);
}

contract StoryEthVault is
    Initializable,
    ERC4626Upgradeable,
    OwnableUpgradeable,
    UUPSUpgradeable
{
    uint256 public constant INITIAL_OWNER_STAKE_ETH = 0.001 ether;
    error ZeroAddress();
    error ZeroAmount();
    error EthTransferFailed();

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    modifier assetsInitialized() {
        require(
            address(asset()) != address(0),
            "The assets need to be initialized"
        );
        _;
    }

    function initialize(
        address weth_,
        string memory name_,
        string memory symbol_,
        address owner_
    ) external initializer {
        if (weth_ == address(0) || owner_ == address(0)) revert ZeroAddress();

        __ERC20_init(name_, symbol_);
        __ERC4626_init(IERC20(weth_));
        __Ownable_init(owner_);
    }

    function depositEth(
        address receiver
    ) external payable assetsInitialized returns (uint256 shares) {
        if (msg.value == 0) revert ZeroAmount();
        // convert the eth to the weth
        uint256 amount = msg.value;
        shares = previewDeposit(amount);
        IWETH(address(asset())).deposit{value: msg.value}();
        console.log('The amount of weth:', amount);
        _mint(receiver, shares);
        console.log('The shares in vault: ', shares);
    }

    function withdrawEth(
        uint256 assets,
        address receiver
    ) external returns (uint256 shares) {
        if (assets == 0) revert ZeroAmount();
        address owner = msg.sender;
        shares = withdraw(assets, address(this), owner);

        IWETH(address(asset())).withdraw(assets);

        (bool success, ) = receiver.call{value: assets}("");
        if (!success) revert EthTransferFailed();
    }

    function _authorizeUpgrade(address) internal view override onlyOwner {}

    receive() external payable {
    }
}
