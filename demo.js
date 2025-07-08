#!/usr/bin/env node

import { Blockchain } from './src/blockchain.js';
import Wallet from './src/wallet.js';
import BlockchainStorage from './src/storage.js';
import { Network, Node } from './src/network.js';
import { MerkleTree } from './src/merkletree.js';
import { encryptData, decryptData } from './src/aescrypto.js';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';

// Get directory path for relative file operations
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dataDir = path.join(__dirname, 'data');

console.log('\n=== BLOCKCHAIN DEMO ===\n');

async function runDemo() {
  try {
    console.log('1. Creating a blockchain and storage...');
    const blockchain = new Blockchain();
    const storage = new BlockchainStorage(dataDir);
    await storage.initStorage();
    
    console.log('\n2. Creating wallets for demo...');
    const minerWallet = new Wallet();
    const aliceWallet = new Wallet();
    const bobWallet = new Wallet();
    
    console.log('\nMiner address:', minerWallet.getAddress().substring(0, 25) + '...');
    console.log('Alice address:', aliceWallet.getAddress().substring(0, 25) + '...');
    console.log('Bob address:  ', bobWallet.getAddress().substring(0, 25) + '...');
    
    // Save wallets to storage
    await storage.saveWallet(minerWallet.getAddress(), {
      address: minerWallet.getAddress(),
      privateKey: minerWallet.getPrivateKey(),
      publicKey: minerWallet.getPublicKey()
    });
    
    console.log('Wallet saved successfully');
    
    console.log('\n3. Setting up P2P network...');
    const network = new Network();
    const minerNode = network.createNode('miner-node');
    minerNode.blockchain = blockchain;
    
    const aliceNode = network.createNode('alice-node');
    const bobNode = network.createNode('bob-node');
    
    // Connect nodes
    minerNode.connect(aliceNode);
    minerNode.connect(bobNode);
    aliceNode.connect(bobNode);
    
    console.log(`Network created with ${network.nodes.size} nodes`);
    console.log(`Miner node has ${minerNode.peers.size} connections`);
    
    console.log('\n4. Mining genesis block with reward for miner...');
    minerNode.minePendingTransactions(minerWallet.getAddress());
    
    console.log('\n5. Alice creates a transaction to Bob...');
    // First mine another block so miner gets reward and can send funds
    minerNode.minePendingTransactions(minerWallet.getAddress());
    
    // Create transaction from miner to Alice (since Alice has no funds yet)
    const tx1 = minerWallet.createTransaction(aliceWallet.getAddress(), 50);
    minerNode.blockchain.addTransaction(tx1);
    console.log('Miner sent 50 coins to Alice');
    
    // Mine the block with miner->Alice transaction
    minerNode.minePendingTransactions(minerWallet.getAddress());
    console.log('Mined block with miner->Alice transaction');
    
    // Alice sends to Bob
    const tx2 = aliceWallet.createTransaction(bobWallet.getAddress(), 25);
    aliceNode.blockchain.addTransaction(tx2);
    aliceNode.broadcastTransaction(tx2);
    console.log('Alice sent 25 coins to Bob (transaction broadcasted)');
    
    // Mine the pending transactions
    minerNode.minePendingTransactions(minerWallet.getAddress());
    console.log('Miner mined a new block with Alice->Bob transaction');
    
    console.log('\n6. Verifying balances...');
    const minerBalance = minerNode.blockchain.getBalanceOfAddress(minerWallet.getAddress());
    const aliceBalance = minerNode.blockchain.getBalanceOfAddress(aliceWallet.getAddress());
    const bobBalance = minerNode.blockchain.getBalanceOfAddress(bobWallet.getAddress());
    
    console.log(`Miner balance: ${minerBalance}`);
    console.log(`Alice balance: ${aliceBalance}`);
    console.log(`Bob balance: ${bobBalance}`);
    
    console.log('\n7. Verifying transaction with Merkle proof...');
    // Get the latest block which should contain the Alice->Bob transaction
    const latestBlock = minerNode.blockchain.getLatestBlock();
    
    // Check if transaction is in the block and verify it
    const isVerified = latestBlock.verifyTransaction(tx2);
    console.log(`Transaction verification result: ${isVerified ? 'VALID ✓' : 'INVALID ✗'}`);
    
    console.log('\n8. Testing Merkle tree separately...');
    // Create sample transactions for Merkle tree demo
    const sampleTxs = [
      { sender: 'Alice', recipient: 'Bob', amount: 10 },
      { sender: 'Bob', recipient: 'Charlie', amount: 5 },
      { sender: 'Charlie', recipient: 'Dave', amount: 2 },
      { sender: 'Dave', recipient: 'Eve', amount: 1 }
    ];
    
    // Convert to string hashes
    const leaves = sampleTxs.map(tx => 
      crypto.createHash('sha256').update(JSON.stringify(tx)).digest('hex')
    );
    
    // Create Merkle tree
    const merkleTree = new MerkleTree(leaves);
    const root = merkleTree.getRoot();
    console.log('Merkle Root:', root);
    
    // Generate proof for the first transaction
    const proof = merkleTree.getProof(0);
    console.log('Merkle Proof for first transaction:', JSON.stringify(proof));
    
    // Verify the proof using the static method
    const isValid = MerkleTree.verifyProof(proof, root);
    console.log('Proof verification result:', isValid ? 'VALID ✓' : 'INVALID ✗');
    
    console.log('\n9. Testing blockchain persistence...');
    await storage.saveBlockchain(minerNode.blockchain);
    console.log('Blockchain saved to disk');
    
    // Load the blockchain
    const loadedBlockchain = await storage.loadBlockchain();
    console.log('Blockchain loaded from disk');
    console.log(`Loaded chain length: ${loadedBlockchain.chain.length}`);
    console.log(`Last block hash: ${loadedBlockchain.chain[loadedBlockchain.chain.length - 1].hash.substring(0, 10)}...`);
    
    console.log('\n10. Testing secure wallet data encryption...');
    const password = 'secure-password-123';
    const walletBackup = JSON.stringify({
      address: aliceWallet.getAddress(),
      privateKey: aliceWallet.getPrivateKey()
    });
    
    // Encrypt wallet data
    const encryptedData = await encryptData(walletBackup, password);
    console.log('Encrypted wallet data:', JSON.stringify(encryptedData).substring(0, 40) + '...');
    
    // Decrypt wallet data
    const decrypted = await decryptData(encryptedData, password);
    const restoredWallet = JSON.parse(decrypted);
    console.log('Decrypted wallet matches original:', restoredWallet.address === aliceWallet.getAddress() ? 'YES ✓' : 'NO ✗');
    
    console.log('\n=== DEMO COMPLETED SUCCESSFULLY ===');
    
  } catch (error) {
    console.error('Error in demo:', error);
  }
}

runDemo();
