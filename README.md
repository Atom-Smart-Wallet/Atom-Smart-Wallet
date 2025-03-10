# Sonic Network Bundler

A specialized ERC-4337 (Account Abstraction) bundler service developed for Sonic Network. This bundler processes and manages UserOperations, enabling account abstraction functionality on the Sonic Network.

## Features

- ERC-4337 compliant UserOperation bundling
- Batch transaction support
- Paymaster integration
- Health monitoring
- Gas estimation and optimization
- Automatic batch processing

## Requirements

- Node.js v16 or higher
- npm or yarn
- Access to Sonic Network RPC endpoint

## Installation

1. Clone the repository:
```bash
git clone https://github.com/Atom-Smart-Wallet/Atom-Smart-Wallet.git
cd Atom-Smart-Wallet
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment variables:
```bash
cp .env.example .env
```

4. Update the `.env` file with your configuration:

```env
# Network Configuration
RPC_URL=                                         # Sonic Network RPC endpoint
ENTRYPOINT_ADDRESS=0x5FbDB2315678afecb367f032d93F642f64180aa3  # EntryPoint contract address
PAYMASTER_ADDRESS=0x...                          # Optional paymaster contract address

# Bundler Configuration
BUNDLER_PRIVATE_KEY=your_private_key             # Private key for the bundler account

# Server Configuration
PORT=3001                                        # Port for the bundler service

```

Important notes:
- The `RPC_URL` should point to a Sonic Network node
- The `ENTRYPOINT_ADDRESS` must be the deployed EntryPoint contract address
- The `BUNDLER_PRIVATE_KEY` must be funded with native tokens for gas
- The `PAYMASTER_ADDRESS` is optional and only needed if using a paymaster

## API Endpoints

### Health Check
```
GET /health
Response: { "status": "ok" } or { "status": "error", "message": "..." }
```

### Create UserOperation
```
POST /createUserOperation
Body: {
    "sender": "0x...",
    "callData": "0x...",
    "usePaymaster": boolean,
    "nonceOffset": number (optional)
}
Response: { "success": true, "userOp": {...} }
```

### Submit UserOperation
```
POST /userOperation
Query: ?batchId=string (optional)
Body: UserOperation object
Response: { "success": true, "message": "UserOperation queued", "userOpHash": "0x..." }
```

### Submit Batch
```
POST /submitBatch
Body: { "batchId": "string" }
Response: { "success": true, "message": "Batch processed", "transactionHash": "0x..." }
```

## Architecture

The bundler consists of several key components:

1. **BundlerService**: Core service that manages:
   - UserOperation validation and processing
   - Batch management
   - Transaction submission
   - Health monitoring

2. **UserOperationService**: Handles:
   - UserOperation creation
   - Gas estimation
   - Paymaster integration
   - Nonce management

3. **Express Server**: Provides:
   - RESTful API endpoints
   - Request validation
   - Error handling

4. **Configuration Management**: Manages:
   - Environment variables
   - Network settings
   - Gas parameters
   - Batch settings

## Security

- Private keys are managed through environment variables
- UserOperations are validated before processing
- Gas limits are enforced for safety
- Batch timeouts prevent stuck operations
- Health monitoring ensures system stability

## Monitoring

The bundler provides monitoring through:
- Health check endpoint
- Detailed error logging
- Transaction status tracking
- Batch processing metrics

## Development

1. Start in development mode:
```bash
npm run dev
```

2. Run tests:
```bash
npm test
```

## Production

1. Build the project:
```bash
npm run build
```

2. Start in production mode:
```bash
npm start
```

## Troubleshooting

Common issues and solutions:

1. **Connection Issues**
   - Verify RPC endpoint is accessible
   - Check network connectivity
   - Ensure correct EntryPoint address

2. **Transaction Failures**
   - Verify bundler account has sufficient funds
   - Check gas price settings
   - Validate UserOperation parameters

3. **Batch Processing Issues**
   - Monitor batch timeout settings
   - Check maximum batch size
   - Verify gas limit configurations

## Lisans

MIT 