// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

import {Script} from "forge-std/Script.sol";
import {console2} from "forge-std/console2.sol";

import {RevenueBridge} from "../src/RevenueBridge.sol";
import {RevenueRightToken} from "../src/RevenueRightToken.sol";
import {MockSettlementToken} from "../src/mocks/MockSettlementToken.sol";

/// @notice Deploys and seeds the contracts used by the local Anvil environment.
contract DeployLocal is Script {
    error UnsupportedChain(uint256 chainId);
    error InvalidLocalConfiguration();

    uint256 internal constant LOCAL_CHAIN_ID = 31_337;
    uint256 internal constant DEFAULT_INVESTOR_BALANCE = 1_000_000e6;

    function run()
        external
        returns (MockSettlementToken settlementToken, RevenueBridge bridge, RevenueRightToken rightToken)
    {
        if (block.chainid != LOCAL_CHAIN_ID) {
            revert UnsupportedChain(block.chainid);
        }

        uint256 deployerPrivateKey = vm.envUint("DEPLOYER_PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);
        address issuer = vm.envOr("LOCAL_ISSUER_ADDRESS", deployer);
        address settler = vm.envOr("LOCAL_SETTLER_ADDRESS", deployer);
        address investor = vm.envOr("LOCAL_INVESTOR_ADDRESS", deployer);
        uint256 investorBalance = vm.envOr("LOCAL_INVESTOR_BALANCE", DEFAULT_INVESTOR_BALANCE);
        string memory tokenBaseUri =
            vm.envOr("LOCAL_TOKEN_BASE_URI", string("http://localhost:3000/api/revenue-rights/{id}.json"));

        if (
            deployer == address(0) || issuer == address(0) || settler == address(0) || investor == address(0)
                || investorBalance == 0
        ) {
            revert InvalidLocalConfiguration();
        }

        vm.startBroadcast(deployerPrivateKey);

        settlementToken = new MockSettlementToken();
        bridge = new RevenueBridge(settlementToken, deployer, tokenBaseUri);
        rightToken = bridge.REVENUE_RIGHT_TOKEN();

        if (issuer != deployer) {
            bridge.grantRole(bridge.ISSUER_ROLE(), issuer);
        }
        if (settler != deployer) {
            bridge.grantRole(bridge.SETTLER_ROLE(), settler);
        }
        bridge.setInvestorAllowed(investor, true);
        settlementToken.mint(investor, investorBalance);

        vm.stopBroadcast();

        console2.log("Local deployment complete");
        console2.log("Chain ID", block.chainid);
        console2.log("Deployer/Admin", deployer);
        console2.log("Issuer", issuer);
        console2.log("Settler", settler);
        console2.log("Investor", investor);
        console2.log("MockSettlementToken", address(settlementToken));
        console2.log("RevenueBridge", address(bridge));
        console2.log("RevenueRightToken", address(rightToken));
    }
}
