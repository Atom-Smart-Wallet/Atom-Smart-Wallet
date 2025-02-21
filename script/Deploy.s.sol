// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std/Script.sol";
import "account-abstraction/core/EntryPoint.sol";
import "../src/AccountFactory.sol";
import "../src/MinimalPaymaster.sol";
import "../src/SmartAccountRegistry.sol";
import "../src/interfaces/ISmartAccountRegistry.sol";

contract DeployScript is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(deployerPrivateKey);

        // Deploy EntryPoint
        EntryPoint entryPoint = new EntryPoint();
        console.log("EntryPoint deployed at:", address(entryPoint));

        // Deploy SmartAccountRegistry
        ISmartAccountRegistry registry = ISmartAccountRegistry(address(new SmartAccountRegistry()));
        console.log("SmartAccountRegistry deployed at:", address(registry));

        // Deploy MinimalPaymaster
        MinimalPaymaster minimalPaymaster = new MinimalPaymaster(entryPoint);
        console.log("MinimalPaymaster deployed at:", address(minimalPaymaster));

        // Deploy AccountFactory with registry
        AccountFactory factory = new AccountFactory(entryPoint, SmartAccountRegistry(address(registry)));
        console.log("AccountFactory deployed at:", address(factory));

        // Initial setup
        minimalPaymaster.deposit{value: 0.08 ether}();
        console.log("MinimalPaymaster deposit made");

        minimalPaymaster.addStake{value: 0.08 ether}(86400);
        console.log("MinimalPaymaster stake made");

        // Authorize factory in registry
        registry.setFactoryAuthorization(address(factory), true);
        console.log("Factory authorized in registry");

        console.log("MinimalPaymaster balance:", entryPoint.balanceOf(address(minimalPaymaster)));

        vm.stopBroadcast();
    }
} 