// SPDX-License-Identifier: None
pragma solidity ^0.8.20;

import '@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol';
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

contract VusdSwap is Initializable, AccessControlUpgradeable {
    using SafeERC20 for IERC20;

    bytes32 public constant GOVERNOR_ROLE = keccak256("GOVERNOR_ROLE");
    bytes32 public constant DEPOSITOR_ROLE = keccak256("DEPOSITOR_ROLE");

    event Deposit(address indexed node, uint256 amount);
    event Swap(address indexed node, uint256 amount);
    event Withdraw(address indexed node, uint256 amount);
    event RateUpdated(uint256 amount);

    IERC20 internal _vusd;
    IERC20 internal _vow;
    uint256 private _rate;

    mapping(address => uint256) private _deposits;
    mapping(address => uint256) private _withdrawals;

    error AmountIsZero();
    error InvalidBalance();
    error InvalidDepositorAddress();
    error InvalidDepositorBalance();
    error LowPoolBalance();

    function initialize(
        IERC20 vusd_,
        IERC20 vow_
    ) public initializer {
        _vusd = vusd_;
        _vow = vow_;
        _rate = 2500;
        _grantRole(DEFAULT_ADMIN_ROLE, _msgSender());
    }

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() initializer {}

    function deposit(uint256 amount) public onlyRole(DEPOSITOR_ROLE) {
        if (amount == 0) revert AmountIsZero();
        if (_vow.balanceOf(_msgSender()) < amount) revert InvalidBalance();
        _vow.safeTransferFrom(_msgSender(), address(this), amount);
        _deposits[_msgSender()] += amount;
        emit Deposit(_msgSender(), amount);
    }

    function swap(uint256 amount, address depositor) external {
        if (depositor == address(0)) revert InvalidDepositorAddress();
        if (amount == 0) revert AmountIsZero();
        uint256 vowAmount = _getExchangeAmount(amount);

        uint256 vowDepositorBalance = _withdrawable(depositor);
        if (vowAmount > vowDepositorBalance) revert InvalidDepositorBalance();

        _withdrawals[depositor] += vowAmount;

        _vusd.safeTransferFrom(_msgSender(), depositor, amount);
        _vow.safeTransfer(_msgSender(), vowAmount);

        emit Swap(_msgSender(), amount);
    }

    function withdraw() external {
        uint256 withdrawableAmount = _withdrawable(_msgSender());
        if (withdrawableAmount == 0) revert AmountIsZero();
        _withdrawals[_msgSender()] += withdrawableAmount;
        _vow.safeTransfer(_msgSender(), withdrawableAmount);
        emit Withdraw(_msgSender(), withdrawableAmount);
    }

    function setSwapRatio(uint256 swapRate) public onlyRole(GOVERNOR_ROLE) {
        if (swapRate == 0) revert AmountIsZero();
        _rate = swapRate;
        emit RateUpdated(swapRate);
    }

    function _vowPool() private view returns (uint256) {
        return _vow.balanceOf(address(this));
    }

    function contractInfo() public view returns (uint256 vowPool, uint256 swapRate) {
        return (_vowPool(), _rate);
    }

    function nodeInfo(
        address node
    ) public view returns (uint256 deposits, uint256 withdrawals) {
        return (_deposits[node], _withdrawals[node]);
    }

    function withdrawable(address node) public view returns (uint256 amount) {
        return _withdrawable(node);
    }

    function _withdrawable(address node) internal view returns (uint256 amount) {
        return _deposits[node] - _withdrawals[node];
    }

    function getExchangeAmount(uint256 amount) public view virtual returns (
        uint256 exchangeAmount  
    ) {
        return _getExchangeAmount(amount);
    }

    function _getExchangeAmount(
        uint256 amount
    ) internal view returns(uint256) {
        return amount * _rate / 10000;
    }

    function version() internal pure returns (uint256) {
        return 20241125;
    }
}