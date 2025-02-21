// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std/Script.sol";
import "account-abstraction/core/EntryPoint.sol";
import "../src/MinimalPaymaster.sol";

contract FundScript is Script {
    // Deployed contract addresses
    address constant PAYMASTER_ADDRESS = 0x660F9aA249761000190E93Ab914AC1d832e917AE;
    address payable constant ENTRYPOINT_ADDRESS = payable(0xC9a1A675eFA0156f77540C097dA5DeeB6A32c917);

    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(deployerPrivateKey);

        // Get contract instances
        EntryPoint entryPoint = EntryPoint(payable(ENTRYPOINT_ADDRESS));
        MinimalPaymaster paymaster = MinimalPaymaster(payable(PAYMASTER_ADDRESS));

        // Deposit 0.01 ETH to paymaster
        paymaster.deposit{value: 0.1 ether}();
        console.log("MinimalPaymaster deposit made: 0.01 ETH");

        // Add stake of 0.01 ETH with 1 day unstake delay
        paymaster.addStake{value: 0.1 ether}(86400); // 86400 seconds = 1 day
        console.log("MinimalPaymaster stake added: 0.01 ETH with 1 day delay");

        // Log final balances
        console.log("MinimalPaymaster deposit balance:", entryPoint.balanceOf(PAYMASTER_ADDRESS));
        console.log("MinimalPaymaster stake info:", entryPoint.getDepositInfo(PAYMASTER_ADDRESS).stake);

        vm.stopBroadcast();
    }
} 