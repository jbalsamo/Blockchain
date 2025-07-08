# Modern Blockchain Implementation

A JavaScript implementation of a blockchain with transactions, wallets, network simulation, and secure cryptography. This project demonstrates the core concepts of blockchain technology, including:

- Blockchain data structure with proof-of-work consensus
- Cryptocurrency transactions and mining rewards
- Wallet generation with public/private key cryptography 
- Transaction signing and verification
- Secure data encryption using AES-256
- Merkle trees for efficient transaction verification
- P2P network simulation
- Blockchain persistence and storage

## Features

### Core Blockchain
- Immutable chain of blocks with SHA-256 hashing
- Proof-of-work mining with adjustable difficulty
- Chain validation to prevent tampering

### Cryptocurrency
- Transaction system with sender, recipient, and amount
- Pending transaction pool
- Mining rewards for block creation
- Balance tracking for addresses

### Wallet System
- RSA public/private key pair generation
- Transaction signing with private keys
- Signature verification with public keys
- Address generation from public keys

### Security
- AES-256-CBC encryption for sensitive data
- Secure key derivation with scrypt
- Random initialization vectors for encryption
- No hardcoded credentials

### Merkle Trees
- Efficient transaction verification
- Proof generation and validation
- Scalable transaction validation

### Network Simulation
- P2P network of blockchain nodes
- Consensus mechanism between nodes
- Transaction and block broadcasting
- Network resilience with automatic chain resolution

### Storage & Persistence
- Save blockchain state to disk
- Load existing blockchain on startup
- Wallet storage and retrieval
- Data directory configuration

## Installation

To install dependencies:

```bash
npm install
```

## Running the Application

Run the demo application:

```bash
npm start
```

### Using the CLI

The project includes a command-line interface for interacting with the blockchain:

```bash
npm run cli
```

Or install globally:

```bash
npm install -g .
blockchain-cli
```

The CLI provides the following features:
- View blockchain and block details
- Create transactions
- Mine blocks with pending transactions
- Check wallet balances
- Network simulation and peer connections
- Save and load blockchain state

This will demonstrate creating wallets, making transactions, mining blocks, and using encryption.

## Running Tests

Test the blockchain implementation:

```bash
bun test
```

## Project Structure

```
├── src/
│   ├── blockchain.js    # Core blockchain implementation
│   ├── wallet.js        # Cryptocurrency wallet functionality
│   ├── transaction.js   # Transaction handling
│   └── aescrypto.js     # Secure encryption utilities
├── test/
│   ├── blockchain.test.js
│   ├── wallet.test.js
│   └── crypto.test.js
├── index.js            # Demo application
└── package.json
```

## Usage Examples

### Create a Blockchain
```javascript
import { Blockchain } from './src/blockchain.js';

const blockchain = new Blockchain();
```

### Create Wallets
```javascript
import Wallet from './src/wallet.js';

const wallet = new Wallet();
const address = wallet.getAddress();
```

### Make Transactions
```javascript
const transaction = wallet1.createTransaction(wallet2.getAddress(), 100);
blockchain.addTransaction(transaction);
```

### Mine Blocks
```javascript
blockchain.minePendingTransactions(minerWalletAddress);
```

### Encrypt Sensitive Data
```javascript
import { encryptData, decryptData } from './src/aescrypto.js';

const encrypted = await encryptData(sensitiveData, password);
const decrypted = await decryptData(encrypted, password);
```

## Technologies

- ES Modules
- Node.js Crypto module
- RSA & AES cryptography
- Bun runtime & test framework

---

This project was created using `bun init` in bun v1.1.17. [Bun](https://bun.sh) is a fast all-in-one JavaScript runtime.
