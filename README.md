# Smart Account Contracts

This project includes a smart account system based on Account Abstraction (EIP-4337).

Repository: https://github.com/Atom-Smart-Wallet/Atom-Smart-Wallet.git

## Contracts

- `SmartAccount.sol`: ERC-4337 compatible smart account contract
- `AccountFactory.sol`: Factory contract for creating new smart accounts
- `MinimalPaymaster.sol`: Simple paymaster implementation
- `SmartAccountRegistry.sol`: Username registration system

## Setup

1. Install Foundry:
```bash
curl -L https://foundry.paradigm.xyz | bash
foundryup
```

2. Install Dependencies:
```bash
forge install
```

3. Compile Contracts:
```bash
forge build
```

## Test

To run tests:
```bash
forge test
```

For detailed test output:
```bash
forge test -vvv
```

## Deploy

1. Create `.env` file:
```bash
cp .env.example .env
```

2. Edit `.env` file:
```
PRIVATE_KEY=your_private_key
RPC_URL=your_rpc_url
```

3. Deploy contracts:
```bash
forge script script/Deploy.s.sol --rpc-url $RPC_URL --broadcast
```

## Funding Paymaster

To fund MinimalPaymaster:
```bash
forge script script/Fund.s.sol --rpc-url $RPC_URL --broadcast
```

This script:
- Deposits 0.1 ETH to MinimalPaymaster
- Adds 0.1 ETH stake for MinimalPaymaster (with 1 day unstake period)

## License

MIT
