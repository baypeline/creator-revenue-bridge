// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

import {Test} from "forge-std/Test.sol";

import {DeployLocal} from "../script/DeployLocal.s.sol";
import {RevenueBridge} from "../src/RevenueBridge.sol";
import {RevenueRightToken} from "../src/RevenueRightToken.sol";
import {MockSettlementToken} from "../src/mocks/MockSettlementToken.sol";

contract DeployLocalTest is Test {
    uint256 internal constant DEPLOYER_PRIVATE_KEY = 0xA11CE;
    uint256 internal constant INVESTOR_BALANCE = 25_000e6;

    address internal issuer = makeAddr("issuer");
    address internal settler = makeAddr("settler");
    address internal investor = makeAddr("investor");

    function setUp() public {
        vm.chainId(31_337);
        vm.setEnv("DEPLOYER_PRIVATE_KEY", vm.toString(DEPLOYER_PRIVATE_KEY));
        vm.setEnv("LOCAL_ISSUER_ADDRESS", vm.toString(issuer));
        vm.setEnv("LOCAL_SETTLER_ADDRESS", vm.toString(settler));
        vm.setEnv("LOCAL_INVESTOR_ADDRESS", vm.toString(investor));
        vm.setEnv("LOCAL_INVESTOR_BALANCE", vm.toString(INVESTOR_BALANCE));
        vm.setEnv("LOCAL_TOKEN_BASE_URI", "http://localhost/token/{id}.json");
    }

    function testDeploysAndSeedsLocalEnvironment() public {
        DeployLocal script = new DeployLocal();
        (MockSettlementToken settlementToken, RevenueBridge bridge, RevenueRightToken rightToken) = script.run();

        address deployer = vm.addr(DEPLOYER_PRIVATE_KEY);
        assertTrue(bridge.hasRole(bridge.DEFAULT_ADMIN_ROLE(), deployer));
        assertTrue(bridge.hasRole(bridge.ISSUER_ROLE(), issuer));
        assertTrue(bridge.hasRole(bridge.SETTLER_ROLE(), settler));
        assertTrue(bridge.allowedInvestors(investor));
        assertEq(settlementToken.balanceOf(investor), INVESTOR_BALANCE);
        assertEq(address(bridge.SETTLEMENT_TOKEN()), address(settlementToken));
        assertEq(address(bridge.REVENUE_RIGHT_TOKEN()), address(rightToken));
        assertEq(rightToken.CONTROLLER(), address(bridge));
        assertEq(rightToken.uri(1), "http://localhost/token/{id}.json");
    }

    function testRejectsNonLocalChain() public {
        vm.chainId(1);
        DeployLocal script = new DeployLocal();

        vm.expectRevert(abi.encodeWithSelector(DeployLocal.UnsupportedChain.selector, 1));
        script.run();
    }
}
