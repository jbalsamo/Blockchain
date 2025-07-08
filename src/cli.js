#!/usr/bin/env node

import { Blockchain } from './blockchain.js';
import Wallet from './wallet.js';
import BlockchainStorage from './storage.js';
import { Network, Node } from './network.js';
import readline from 'readline';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs/promises';

// Get the directory where the script is located
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dataDir = path.join(__dirname, '..', 'data');

// Create readline interface for command input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Initialize components
const storage = new BlockchainStorage(dataDir);
let blockchain;
let wallet;
let node;
let network;

/**
 * Print a message with a colored header
 * @param {string} header - Header text
 * @param {string} message - Message text
 * @param {string} color - ANSI color code
 */
function printMessage(header, message, color = '\x1b[36m') {
  console.log(`${color}=== ${header} ===\x1b[0m`);
  console.log(message);
  console.log();
}

/**
 * Ask a question and get user input
 * @param {string} question - Question to ask
 * @returns {Promise<string>} - User's answer
 */
function ask(question) {
  return new Promise((resolve) => {
    rl.question(`${question}: `, (answer) => {
      resolve(answer);
    });
  });
}

/**
 * Initialize the blockchain and wallet
 */
async function initialize() {
  try {
    // Try to load existing blockchain
    if (await storage.blockchainExists()) {
      blockchain = await storage.loadBlockchain();
      printMessage('INFO', 'Loaded existing blockchain', '\x1b[32m');
    } else {
      blockchain = new Blockchain();
      await storage.saveBlockchain(blockchain);
      printMessage('INFO', 'Created a new blockchain', '\x1b[32m');
    }

    // Check for existing wallets
    const wallets = await storage.listWallets();
    if (wallets.length > 0) {
      printMessage('WALLETS', `Found ${wallets.length} existing wallets: ${wallets.join(', ')}`, '\x1b[33m');
      const useExisting = await ask('Do you want to use an existing wallet? (y/n)');
      
      if (useExisting.toLowerCase() === 'y') {
        const address = await ask('Enter wallet address');
        if (wallets.includes(address)) {
          const walletData = await storage.loadWallet(address);
          wallet = new Wallet(walletData.privateKey);
          printMessage('WALLET', `Loaded wallet with address: ${wallet.getAddress()}`, '\x1b[32m');
        } else {
          printMessage('ERROR', `Wallet with address ${address} not found`, '\x1b[31m');
          wallet = createNewWallet();
        }
      } else {
        wallet = createNewWallet();
      }
    } else {
      wallet = createNewWallet();
    }

    // Initialize network and node
    network = new Network();
    node = new Node(`node-${wallet.getAddress().substring(0, 8)}`, blockchain);
    printMessage('NETWORK', `Created local node with ID: ${node.id}`, '\x1b[32m');

    // Display the main menu
    showMainMenu();
  } catch (error) {
    printMessage('ERROR', `Initialization failed: ${error.message}`, '\x1b[31m');
    process.exit(1);
  }
}

/**
 * Create a new wallet and save it
 * @returns {Wallet} - The newly created wallet
 */
async function createNewWallet() {
  const newWallet = new Wallet();
  const address = newWallet.getAddress();
  
  await storage.saveWallet(address, {
    address: address,
    privateKey: newWallet.getPrivateKey(),
    publicKey: newWallet.getPublicKey()
  });
  
  printMessage('WALLET', `Created new wallet with address: ${address}`, '\x1b[32m');
  return newWallet;
}

/**
 * Display the main menu and handle user selection
 */
async function showMainMenu() {
  console.log('\x1b[1m\nBLOCKCHAIN CLI\x1b[0m');
  console.log('1. View Blockchain');
  console.log('2. Create Transaction');
  console.log('3. Mine Block');
  console.log('4. Check Balance');
  console.log('5. Network Options');
  console.log('6. Save Blockchain');
  console.log('7. Wallet Info');
  console.log('8. Exit');
  
  const choice = await ask('Enter your choice');
  
  switch (choice) {
    case '1':
      viewBlockchain();
      break;
    case '2':
      await createTransaction();
      break;
    case '3':
      await mineBlock();
      break;
    case '4':
      checkBalance();
      break;
    case '5':
      networkMenu();
      break;
    case '6':
      await saveBlockchain();
      break;
    case '7':
      walletInfo();
      break;
    case '8':
      exit();
      break;
    default:
      printMessage('ERROR', 'Invalid option', '\x1b[31m');
      showMainMenu();
  }
}

/**
 * View the current blockchain
 */
function viewBlockchain() {
  printMessage('BLOCKCHAIN', `Chain length: ${blockchain.chain.length} blocks`, '\x1b[36m');
  
  // Show a summary of each block
  blockchain.chain.forEach((block, index) => {
    let txCount = 0;
    if (Array.isArray(block.data)) {
      txCount = block.data.length;
    } else if (block.data && block.data.transactions && Array.isArray(block.data.transactions)) {
      txCount = block.data.transactions.length;
    }
    
    console.log(`Block #${block.index} | Hash: ${block.hash.substring(0, 10)}... | Transactions: ${txCount}`);
  });
  
  console.log(`\nPending transactions: ${blockchain.pendingTransactions.length}`);
  
  // Ask if user wants to see detailed information about a specific block
  askForBlockDetails();
}

/**
 * Ask if the user wants to see block details
 */
async function askForBlockDetails() {
  const showDetails = await ask('\nView block details? Enter block # or press Enter to return to menu');
  
  if (showDetails === '') {
    showMainMenu();
    return;
  }
  
  const blockIndex = parseInt(showDetails);
  if (isNaN(blockIndex) || blockIndex < 0 || blockIndex >= blockchain.chain.length) {
    printMessage('ERROR', 'Invalid block number', '\x1b[31m');
    askForBlockDetails();
    return;
  }
  
  const block = blockchain.chain[blockIndex];
  console.log('\n\x1b[36m=== BLOCK DETAILS ===\x1b[0m');
  console.log(`Index: ${block.index}`);
  console.log(`Timestamp: ${new Date(block.timestamp).toLocaleString()}`);
  console.log(`Previous Hash: ${block.previousHash}`);
  console.log(`Hash: ${block.hash}`);
  console.log(`Nonce: ${block.nonce}`);
  
  console.log('\nTransactions:');
  if (Array.isArray(block.data)) {
    // Each item in data array is a transaction
    block.data.forEach((tx, i) => {
      console.log(`\nTransaction #${i + 1}:`);
      console.log(`  From: ${tx.fromAddress || 'SYSTEM (Mining Reward)'}`);
      console.log(`  To: ${tx.toAddress}`);
      console.log(`  Amount: ${tx.amount}`);
    });
  } else if (block.data && block.data.transactions) {
    // Genesis block structure
    block.data.transactions.forEach((tx, i) => {
      console.log(`\nTransaction #${i + 1}:`);
      console.log(`  From: ${tx.fromAddress || 'SYSTEM'}`);
      console.log(`  To: ${tx.toAddress || 'N/A'}`);
      console.log(`  Amount: ${tx.amount || 0}`);
    });
    if (block.data.note) {
      console.log(`\nNote: ${block.data.note}`);
    }
  } else {
    console.log('No transactions or custom data format');
  }
  
  askForBlockDetails();
}

/**
 * Create a new transaction
 */
async function createTransaction() {
  try {
    const recipient = await ask('Enter recipient address');
    const amount = parseFloat(await ask('Enter amount to send'));
    
    if (isNaN(amount) || amount <= 0) {
      printMessage('ERROR', 'Amount must be a positive number', '\x1b[31m');
      showMainMenu();
      return;
    }
    
    // Check sender balance
    const balance = blockchain.getBalanceOfAddress(wallet.getAddress());
    if (balance < amount) {
      printMessage('ERROR', `Insufficient balance. You have ${balance} coins`, '\x1b[31m');
      showMainMenu();
      return;
    }
    
    // Create and sign the transaction
    const transaction = wallet.createTransaction(recipient, amount);
    
    // Add to blockchain and broadcast if connected to network
    blockchain.addTransaction(transaction);
    if (node && node.peers.size > 0) {
      node.broadcastTransaction(transaction);
    }
    
    printMessage('SUCCESS', `Transaction created and added to pending transactions`, '\x1b[32m');
    console.log(`From: ${transaction.fromAddress}`);
    console.log(`To: ${transaction.toAddress}`);
    console.log(`Amount: ${transaction.amount}`);
    console.log(`Transaction ID: ${transaction.signature.substring(0, 20)}...`);
    
    showMainMenu();
  } catch (error) {
    printMessage('ERROR', `Transaction failed: ${error.message}`, '\x1b[31m');
    showMainMenu();
  }
}

/**
 * Mine a new block with pending transactions
 */
async function mineBlock() {
  if (blockchain.pendingTransactions.length === 0) {
    printMessage('INFO', 'No pending transactions to mine', '\x1b[33m');
    showMainMenu();
    return;
  }
  
  try {
    printMessage('MINING', 'Mining a new block... This may take a moment', '\x1b[33m');
    
    // If connected to network, use node to mine and broadcast
    if (node && node.peers.size > 0) {
      node.minePendingTransactions(wallet.getAddress());
    } else {
      blockchain.minePendingTransactions(wallet.getAddress());
    }
    
    printMessage('SUCCESS', 'Block successfully mined!', '\x1b[32m');
    console.log(`Mining reward of ${blockchain.miningReward} coins will be available after mining another block`);
    
    // Save the blockchain after mining
    await storage.saveBlockchain(blockchain);
    
    showMainMenu();
  } catch (error) {
    printMessage('ERROR', `Mining failed: ${error.message}`, '\x1b[31m');
    showMainMenu();
  }
}

/**
 * Check the balance of an address
 */
async function checkBalance() {
  const checkAddress = await ask('Enter address to check (press Enter for your own address)');
  const address = checkAddress || wallet.getAddress();
  
  const balance = blockchain.getBalanceOfAddress(address);
  
  printMessage('BALANCE', `Address: ${address}\nBalance: ${balance} coins`, '\x1b[36m');
  showMainMenu();
}

/**
 * Display network options menu
 */
async function networkMenu() {
  console.log('\n\x1b[1mNETWORK OPTIONS\x1b[0m');
  console.log(`Status: ${node.peers.size} connected peers`);
  console.log('1. Connect to a peer');
  console.log('2. Disconnect from a peer');
  console.log('3. List connected peers');
  console.log('4. Simulate network (create test nodes)');
  console.log('5. Back to main menu');
  
  const choice = await ask('Enter your choice');
  
  switch (choice) {
    case '1':
      await connectToPeer();
      break;
    case '2':
      await disconnectFromPeer();
      break;
    case '3':
      listPeers();
      break;
    case '4':
      await simulateNetwork();
      break;
    case '5':
      showMainMenu();
      break;
    default:
      printMessage('ERROR', 'Invalid option', '\x1b[31m');
      networkMenu();
  }
}

/**
 * Connect to a peer node
 */
async function connectToPeer() {
  try {
    const peerId = await ask('Enter peer ID to connect to');
    
    // In a real app, we'd resolve the peer ID to a network address
    // For simulation, we'll create a new node with this ID if it doesn't exist
    if (!network.getNode(peerId)) {
      const peerNode = network.createNode(peerId);
      printMessage('NETWORK', `Created new peer node with ID: ${peerId}`, '\x1b[32m');
    }
    
    const peer = network.getNode(peerId);
    node.connect(peer);
    
    networkMenu();
  } catch (error) {
    printMessage('ERROR', `Failed to connect: ${error.message}`, '\x1b[31m');
    networkMenu();
  }
}

/**
 * Disconnect from a peer
 */
async function disconnectFromPeer() {
  if (node.peers.size === 0) {
    printMessage('INFO', 'No connected peers', '\x1b[33m');
    networkMenu();
    return;
  }
  
  console.log('\nConnected peers:');
  for (const peerId of node.peers.keys()) {
    console.log(` - ${peerId}`);
  }
  
  const peerId = await ask('\nEnter peer ID to disconnect from');
  if (node.peers.has(peerId)) {
    node.disconnect(peerId);
    printMessage('SUCCESS', `Disconnected from peer: ${peerId}`, '\x1b[32m');
  } else {
    printMessage('ERROR', `Not connected to peer: ${peerId}`, '\x1b[31m');
  }
  
  networkMenu();
}

/**
 * List connected peers
 */
function listPeers() {
  if (node.peers.size === 0) {
    printMessage('INFO', 'No connected peers', '\x1b[33m');
  } else {
    printMessage('PEERS', `Connected to ${node.peers.size} peers:`, '\x1b[36m');
    for (const peerId of node.peers.keys()) {
      console.log(` - ${peerId}`);
    }
  }
  
  networkMenu();
}

/**
 * Simulate a network with multiple nodes
 */
async function simulateNetwork() {
  printMessage('SIMULATION', 'Creating a simulated network...', '\x1b[33m');
  
  // Create several nodes
  const numNodes = 3;
  const nodes = [];
  
  for (let i = 1; i <= numNodes; i++) {
    const nodeId = `sim-node-${i}`;
    if (!network.getNode(nodeId)) {
      const simNode = network.createNode(nodeId);
      nodes.push(simNode);
      console.log(`Created node: ${nodeId}`);
    }
  }
  
  // Connect all nodes in a mesh
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      nodes[i].connect(nodes[j]);
    }
    // Connect to our main node too
    nodes[i].connect(node);
  }
  
  printMessage('SUCCESS', `Created ${numNodes} simulated nodes connected in a mesh network`, '\x1b[32m');
  
  // Optionally simulate some transactions
  const simulate = await ask('Simulate transactions between nodes? (y/n)');
  if (simulate.toLowerCase() === 'y') {
    // Create a transaction from our wallet to the first node
    const tx1 = wallet.createTransaction(nodes[0].id, 10);
    blockchain.addTransaction(tx1);
    node.broadcastTransaction(tx1);
    console.log('Broadcasted transaction from your wallet to first node');
    
    // Mine a block
    console.log('Mining a block with the transaction...');
    node.minePendingTransactions(wallet.getAddress());
    
    printMessage('SUCCESS', 'Network simulation completed', '\x1b[32m');
  }
  
  networkMenu();
}

/**
 * Save the blockchain to disk
 */
async function saveBlockchain() {
  try {
    await storage.saveBlockchain(blockchain);
    printMessage('SUCCESS', 'Blockchain saved successfully', '\x1b[32m');
  } catch (error) {
    printMessage('ERROR', `Failed to save blockchain: ${error.message}`, '\x1b[31m');
  }
  
  showMainMenu();
}

/**
 * Display wallet information
 */
function walletInfo() {
  printMessage('WALLET INFO', `Address: ${wallet.getAddress()}`, '\x1b[36m');
  console.log(`Public Key: ${wallet.getPublicKey().substring(0, 40)}...`);
  console.log(`Balance: ${blockchain.getBalanceOfAddress(wallet.getAddress())} coins`);
  
  showMainMenu();
}

/**
 * Exit the application
 */
async function exit() {
  try {
    // Save blockchain state before exiting
    await storage.saveBlockchain(blockchain);
    printMessage('GOODBYE', 'Blockchain saved. Exiting application...', '\x1b[32m');
    rl.close();
    process.exit(0);
  } catch (error) {
    printMessage('ERROR', `Error while exiting: ${error.message}`, '\x1b[31m');
    process.exit(1);
  }
}

// Start the application
console.log('\x1b[1m\n=== BLOCKCHAIN CLI ===\x1b[0m\n');
initialize();
