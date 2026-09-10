// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

import {Script} from "forge-std/Script.sol";
import {console2} from "forge-std/console2.sol";

import {RevenueBridge} from "../src/RevenueBridge.sol";
import {RevenueRightToken} from "../src/RevenueRightToken.sol";
import {IRevenueBridge} from "../src/interfaces/IRevenueBridge.sol";
import {MockSettlementToken} from "../src/mocks/MockSettlementToken.sol";

/// @notice Deploys and seeds the contracts used by the local Anvil environment.
contract DeployLocal is Script {
    error UnsupportedChain(uint256 chainId);
    error InvalidLocalConfiguration();

    uint256 internal constant LOCAL_CHAIN_ID = 31_337;
    uint256 internal constant DEFAULT_ACTOR_BALANCE = 1_000_000e6;
    uint256 internal constant DEMO_UNITS_FOR_SALE = 100;
    uint256 internal constant DEMO_UNIT_PRICE = 100e6;
    uint16 internal constant DEMO_REVENUE_SHARE_BPS = 2_000;
    uint256 internal constant DEMO_FUNDING_DURATION = 7 days;
    uint256 internal constant DEMO_REVENUE_START_DELAY = 1 days;
    uint256 internal constant DEMO_SETTLEMENT_PERIOD = 30 days;

    struct LocalConfig {
        uint256 deployerPrivateKey;
        address deployer;
        address issuer;
        address settler;
        address creator;
        address investor;
        uint256 investorBalance;
        uint256 settlerBalance;
        string tokenBaseUri;
        string deploymentPath;
    }

    struct DemoOffering {
        uint256 id;
        uint64 fundingDeadline;
        uint64 revenueStart;
        uint64 revenueEnd;
    }

    function run()
        external
        returns (
            MockSettlementToken settlementToken,
            RevenueBridge bridge,
            RevenueRightToken rightToken,
            uint256 demoOfferingId
        )
    {
        if (block.chainid != LOCAL_CHAIN_ID) {
            revert UnsupportedChain(block.chainid);
        }

        LocalConfig memory config = _loadConfig();

        vm.startBroadcast(config.deployerPrivateKey);

        settlementToken = new MockSettlementToken();
        bridge = new RevenueBridge(settlementToken, config.deployer, config.tokenBaseUri);
        rightToken = bridge.REVENUE_RIGHT_TOKEN();

        if (config.issuer != config.deployer) {
            bridge.grantRole(bridge.ISSUER_ROLE(), config.issuer);
        }
        if (config.settler != config.deployer) {
            bridge.grantRole(bridge.SETTLER_ROLE(), config.settler);
        }
        bridge.setInvestorAllowed(config.investor, true);
        settlementToken.mint(config.investor, config.investorBalance);
        settlementToken.mint(config.settler, config.settlerBalance);

        DemoOffering memory demo = _createDemoOffering(bridge, config.creator);
        demoOfferingId = demo.id;

        if (config.issuer != config.deployer) {
            bridge.revokeRole(bridge.ISSUER_ROLE(), config.deployer);
        }
        if (config.settler != config.deployer) {
            bridge.revokeRole(bridge.SETTLER_ROLE(), config.deployer);
        }

        vm.stopBroadcast();

        _writeDeploymentManifest(settlementToken, bridge, rightToken, config, demo);
        _logDeployment(settlementToken, bridge, rightToken, config, demo);
    }

    function _loadConfig() private view returns (LocalConfig memory config) {
        config.deployerPrivateKey = vm.envUint("DEPLOYER_PRIVATE_KEY");
        config.deployer = vm.addr(config.deployerPrivateKey);
        config.issuer = vm.envOr("LOCAL_ISSUER_ADDRESS", config.deployer);
        config.settler = vm.envOr("LOCAL_SETTLER_ADDRESS", config.deployer);
        config.creator = vm.envOr("LOCAL_CREATOR_ADDRESS", config.deployer);
        config.investor = vm.envOr("LOCAL_INVESTOR_ADDRESS", config.deployer);
        config.investorBalance = vm.envOr("LOCAL_INVESTOR_BALANCE", DEFAULT_ACTOR_BALANCE);
        config.settlerBalance = vm.envOr("LOCAL_SETTLER_BALANCE", DEFAULT_ACTOR_BALANCE);
        config.tokenBaseUri =
            vm.envOr("LOCAL_TOKEN_BASE_URI", string("http://localhost:3000/api/revenue-rights/{id}.json"));
        config.deploymentPath =
            vm.envOr("LOCAL_DEPLOYMENT_PATH", string.concat(vm.projectRoot(), "/deployments/31337.json"));

        if (
            config.deployer == address(0) || config.issuer == address(0) || config.settler == address(0)
                || config.creator == address(0) || config.investor == address(0) || config.investorBalance == 0
                || config.settlerBalance == 0
        ) {
            revert InvalidLocalConfiguration();
        }
    }

    function _createDemoOffering(RevenueBridge bridge, address creator) private returns (DemoOffering memory demo) {
        demo.fundingDeadline = uint64(block.timestamp + DEMO_FUNDING_DURATION);
        demo.revenueStart = uint64(demo.fundingDeadline + DEMO_REVENUE_START_DELAY);
        demo.revenueEnd = uint64(demo.revenueStart + (DEMO_SETTLEMENT_PERIOD * 3));
        uint64[] memory periodEnds = new uint64[](3);
        periodEnds[0] = uint64(demo.revenueStart + DEMO_SETTLEMENT_PERIOD);
        periodEnds[1] = uint64(demo.revenueStart + (DEMO_SETTLEMENT_PERIOD * 2));
        periodEnds[2] = demo.revenueEnd;

        IRevenueBridge.OfferingTerms memory demoTerms = IRevenueBridge.OfferingTerms({
            creatorPayout: creator,
            assetKey: keccak256("local-demo-youtube-revenue"),
            termsHash: keccak256("local-demo-terms-v1"),
            valuationHash: keccak256("local-demo-valuation-v1"),
            unitsForSale: DEMO_UNITS_FOR_SALE,
            unitPrice: DEMO_UNIT_PRICE,
            fundingDeadline: demo.fundingDeadline,
            revenueStart: demo.revenueStart,
            revenueEnd: demo.revenueEnd,
            revenueShareBps: DEMO_REVENUE_SHARE_BPS
        });
        demo.id = bridge.createOffering(demoTerms, periodEnds);
    }

    function _writeDeploymentManifest(
        MockSettlementToken settlementToken,
        RevenueBridge bridge,
        RevenueRightToken rightToken,
        LocalConfig memory config,
        DemoOffering memory demo
    ) private {
        string memory contractsJson = vm.serializeAddress("contracts", "settlementToken", address(settlementToken));
        vm.serializeAddress("contracts", "revenueBridge", address(bridge));
        contractsJson = vm.serializeAddress("contracts", "revenueRightToken", address(rightToken));

        string memory accountsJson = vm.serializeAddress("accounts", "admin", config.deployer);
        vm.serializeAddress("accounts", "issuer", config.issuer);
        vm.serializeAddress("accounts", "settler", config.settler);
        vm.serializeAddress("accounts", "creator", config.creator);
        accountsJson = vm.serializeAddress("accounts", "investor", config.investor);

        string memory demoJson = vm.serializeUint("demo", "offeringId", demo.id);
        vm.serializeUint("demo", "unitsForSale", DEMO_UNITS_FOR_SALE);
        vm.serializeUint("demo", "unitPrice", DEMO_UNIT_PRICE);
        vm.serializeUint("demo", "targetRaise", DEMO_UNITS_FOR_SALE * DEMO_UNIT_PRICE);
        vm.serializeUint("demo", "revenueShareBps", DEMO_REVENUE_SHARE_BPS);
        vm.serializeUint("demo", "fundingDeadline", demo.fundingDeadline);
        vm.serializeUint("demo", "revenueStart", demo.revenueStart);
        demoJson = vm.serializeUint("demo", "revenueEnd", demo.revenueEnd);

        string memory deploymentJson = vm.serializeUint("deployment", "chainId", LOCAL_CHAIN_ID);
        vm.serializeString("deployment", "network", "anvil");
        vm.serializeString("deployment", "contracts", contractsJson);
        vm.serializeString("deployment", "accounts", accountsJson);
        deploymentJson = vm.serializeString("deployment", "demo", demoJson);

        vm.writeJson(deploymentJson, config.deploymentPath);
    }

    function _logDeployment(
        MockSettlementToken settlementToken,
        RevenueBridge bridge,
        RevenueRightToken rightToken,
        LocalConfig memory config,
        DemoOffering memory demo
    ) private view {
        console2.log("Local deployment complete");
        console2.log("Chain ID", block.chainid);
        console2.log("Deployer/Admin", config.deployer);
        console2.log("Issuer", config.issuer);
        console2.log("Settler", config.settler);
        console2.log("Creator", config.creator);
        console2.log("Investor", config.investor);
        console2.log("MockSettlementToken", address(settlementToken));
        console2.log("RevenueBridge", address(bridge));
        console2.log("RevenueRightToken", address(rightToken));
        console2.log("Demo Offering ID", demo.id);
        console2.log("Demo Units For Sale", DEMO_UNITS_FOR_SALE);
        console2.log("Demo Unit Price (mUSD base units)", DEMO_UNIT_PRICE);
        console2.log("Demo Target Raise (mUSD base units)", DEMO_UNITS_FOR_SALE * DEMO_UNIT_PRICE);
        console2.log("Demo Funding Deadline", demo.fundingDeadline);
        console2.log("Demo Revenue Start", demo.revenueStart);
        console2.log("Demo Revenue End", demo.revenueEnd);
        console2.log("Deployment Manifest", config.deploymentPath);
    }
}
