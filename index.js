import { Blockchain, Block } from './src/blockchain.js';
import Wallet from './src/wallet.js';
import Transaction from './src/transaction.js';
import { encryptData, decryptData } from './src/aescrypto.js';

// Check crypto support
try {
  console.log("Checking crypto module support...")
  const testHash = await import('crypto').then(crypto => 
    crypto.createHash('sha256').update('test').digest('hex')
  );
  console.log(`Crypto support is enabled! Test hash: ${testHash}`);
} catch (err) {
  console.error("Crypto support is disabled!", err);
  process.exit(1);
}

// Initialize our blockchain
console.log('Creating a new blockchain...');
const myCoin = new Blockchain();

// Create wallets for testing
console.log('\nCreating test wallets...');
const wallet1 = new Wallet();
const wallet2 = new Wallet();

console.log(`Wallet 1 address: ${wallet1.getAddress()}`);
console.log(`Wallet 2 address: ${wallet2.getAddress()}`);

// Create and sign a transaction
console.log('\nCreating transactions...');
const tx1 = wallet1.createTransaction(wallet2.getAddress(), 50);
console.log('Transaction created:', tx1);

// Add the transaction to the blockchain
myCoin.addTransaction(tx1);
console.log('\nPending transactions:', myCoin.pendingTransactions.length);

// Mine the pending transactions
console.log('\nMining block...');
myCoin.minePendingTransactions(wallet1.getAddress());

// Show the mining reward pending for next block
console.log(`\nWallet 1 mining reward pending: ${myCoin.pendingTransactions[0].amount} coins`);

// Show chain validation
console.log('\nIs blockchain valid?', myCoin.isChainValid() ? 'Yes' : 'No');

// Demonstrate encryption
const secretMessage = "This is sensitive blockchain data";
console.log('\nEncrypting message:', secretMessage);

// Use a secure password (in a real app, never hardcode this)
const demoPassword = "secure-example-password";

// Encrypt data
encryptData(secretMessage, demoPassword)
  .then(async encrypted => {
    console.log('Encrypted data:', encrypted);
    
    // Decrypt data
    try {
      const decrypted = await decryptData(encrypted, demoPassword);
      console.log('Decrypted message:', decrypted);
    } catch (error) {
      console.error('Decryption failed:', error.message);
    }
  })
  .catch(error => {
    console.error('Encryption error:', error.message);
  });

// Display the current state of the blockchain
console.log('\nCurrent blockchain:');
console.log(JSON.stringify(myCoin.chain, null, 2));
