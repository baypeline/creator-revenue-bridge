#!/bin/sh

set -eu

script_dir=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
repo_dir=$(CDPATH= cd -- "$script_dir/.." && pwd)
compose_file="$repo_dir/compose.dev.yaml"
deployment_source="$repo_dir/contracts/deployments/31337.json"
client_metadata_source="$repo_dir/contracts/client/RevenueBridge.client.json"
frontend_target="$repo_dir/frontend/src/generated/contracts"
backend_target="$repo_dir/backend/src/main/resources/contracts/generated"
temp_dir=$(mktemp -d "${TMPDIR:-/tmp}/creator-revenue-bridge-contracts.XXXXXX")

cleanup() {
    rm -rf "$temp_dir"
}
trap cleanup EXIT HUP INT TERM

cd "$repo_dir"

docker compose -f "$compose_file" up -d anvil
docker compose -f "$compose_file" run --rm forge \
    script script/DeployLocal.s.sol:DeployLocal \
    --rpc-url http://anvil:8545 \
    --broadcast

if [ ! -s "$deployment_source" ]; then
    echo "Deployment manifest was not generated: $deployment_source" >&2
    exit 1
fi

docker compose -f "$compose_file" run --rm --no-deps forge \
    inspect src/RevenueBridge.sol:RevenueBridge abi --json > "$temp_dir/RevenueBridge.abi.json"
docker compose -f "$compose_file" run --rm --no-deps forge \
    inspect src/RevenueRightToken.sol:RevenueRightToken abi --json > "$temp_dir/RevenueRightToken.abi.json"
docker compose -f "$compose_file" run --rm --no-deps forge \
    inspect src/mocks/MockSettlementToken.sol:MockSettlementToken abi --json > "$temp_dir/MockSettlementToken.abi.json"

for abi_file in "$temp_dir"/*.abi.json; do
    if [ ! -s "$abi_file" ]; then
        echo "ABI generation failed: $abi_file" >&2
        exit 1
    fi
done

mkdir -p "$frontend_target" "$backend_target"
cp "$deployment_source" "$frontend_target/deployment.json"
cp "$deployment_source" "$backend_target/deployment.json"
cp "$client_metadata_source" "$frontend_target/RevenueBridge.client.json"
cp "$client_metadata_source" "$backend_target/RevenueBridge.client.json"
cp "$temp_dir"/*.abi.json "$frontend_target/"
cp "$temp_dir"/*.abi.json "$backend_target/"

echo "Local contracts deployed and application artifacts synchronized."
echo "Canonical manifest: contracts/deployments/31337.json"
echo "Frontend artifacts: frontend/src/generated/contracts"
echo "Backend artifacts: backend/src/main/resources/contracts/generated"
