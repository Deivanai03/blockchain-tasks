// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract FortunePots is Ownable, ReentrancyGuard {
    IERC20 public immutable usdc;
    address public immutable rakeWallet;
    uint256 public totalTickets;
    uint256 public totalUSDC;
    uint256 public rakeFee = 1; // 1% rake fee
    uint256 public constant WINNER_PERCENTAGE = 90;
    uint256 public constant PAYOUT_PERCENTAGE = 10;
    uint256 public constant maxTicketsPerUser = 100;

    struct Participant {
        uint256 tickets;
    }

    mapping(address => Participant) public participants;
    address[] private participantList;
    mapping(address => bool) private selectedWinners;

    event TicketPurchased(address indexed buyer, uint256 ticketCount);
    event PayoutProcessed(uint256 totalPayout, uint256 numWinners, uint256 gasUsed);
    event WinnerSelected(address indexed winner, uint256 amount);

    constructor(address _usdc, address _rakeWallet) Ownable(msg.sender) {
        require(_usdc != address(0), "Invalid USDC address");
        require(_rakeWallet != address(0), "Invalid rake wallet address");

        usdc = IERC20(_usdc);
        rakeWallet = _rakeWallet;
    }

    function buyTicket(uint256 ticketCount) external nonReentrant {
        require(ticketCount > 0, "Must buy at least 1 ticket");
        require(participants[msg.sender].tickets + ticketCount <= maxTicketsPerUser, "Exceeds max tickets");

        uint256 ticketPrice = ticketCount * 1e6; 
        uint256 fee = (ticketPrice * rakeFee) / 100;

        require(usdc.transferFrom(msg.sender, rakeWallet, fee), "Fee transfer failed");
        require(usdc.transferFrom(msg.sender, address(this), ticketPrice), "Ticket transfer failed");

        if (participants[msg.sender].tickets == 0) {
            participantList.push(msg.sender);
        }
        participants[msg.sender].tickets += ticketCount;

        totalTickets += ticketCount;
        totalUSDC += ticketPrice;

        emit TicketPurchased(msg.sender, ticketCount);
    }

    function processPayouts() external onlyOwner nonReentrant {
        require(participantList.length > 1, "Not enough participants");

        uint256 winnersCount = (participantList.length * WINNER_PERCENTAGE) / 100;
        require(winnersCount > 0, "No winners");

        uint256 payoutPerWinner = (totalUSDC * PAYOUT_PERCENTAGE) / (100 * winnersCount);
        require(usdc.balanceOf(address(this)) >= (payoutPerWinner * winnersCount), "Insufficient USDC balance");

        uint256 initialGas = gasleft();

        for (uint256 i = 0; i < winnersCount; i++) {
            uint256 index = uint256(keccak256(abi.encodePacked(blockhash(block.number - 1), block.timestamp, i))) % participantList.length;
            address winner = participantList[index];

            while (selectedWinners[winner]) {
                index = (index + 1) % participantList.length;
                winner = participantList[index];
            }
            selectedWinners[winner] = true;

            require(usdc.transfer(winner, payoutPerWinner), "Payout transfer failed");
            emit WinnerSelected(winner, payoutPerWinner);
        }

        uint256 gasUsed = initialGas - gasleft();
        emit PayoutProcessed(totalUSDC, winnersCount, gasUsed);

        delete participantList;
        _clearSelectedWinners();
        totalTickets = 0;
        totalUSDC = 0;
    }

    function _clearSelectedWinners() private {
        for (uint256 i = 0; i < participantList.length; i++) {
            selectedWinners[participantList[i]] = false;
        }
    }

    /** 
     * 🔹 Read Functions (No Gas Cost)
     */
    
    function getTotalTickets() external view returns (uint256) {
        return totalTickets;
    }

    function getTotalUSDC() external view returns (uint256) {
        return totalUSDC;
    }

    function getTotalParticipants() external view returns (uint256) {
        return participantList.length;
    }

    function getParticipants() external view returns (address[] memory) {
        return participantList;
    }

    function getUserTickets(address user) external view returns (uint256) {
        return participants[user].tickets;
    }

    function getWinnerStatus(address user) external view returns (bool) {
        return selectedWinners[user];
    }
}