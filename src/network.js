import { Blockchain, Block } from './blockchain.js';
import crypto from 'crypto';

/**
 * Simulates a node in a peer-to-peer blockchain network
 */
class Node {
  /**
   * Create a new network node
   * @param {string} id - Unique identifier for this node
   * @param {Blockchain} [blockchain] - Existing blockchain to use (or create new)
   */
  constructor(id, blockchain = null) {
    this.id = id;
    this.blockchain = blockchain || new Blockchain();
    this.peers = new Map(); // Maps peer IDs to peer node objects
    this.pendingBroadcasts = new Set(); // Tracks message IDs to prevent infinite loops
  }

  /**
   * Connect to another node in the network
   * @param {Node} peer - Another node to connect to
   * @returns {boolean} - True if connection was successful
   */
  connect(peer) {
    if (peer.id === this.id) {
      console.log(`Node ${this.id}: Cannot connect to self`);
      return false;
    }

    if (this.peers.has(peer.id)) {
      console.log(`Node ${this.id}: Already connected to ${peer.id}`);
      return false;
    }

    this.peers.set(peer.id, peer);
    peer.peers.set(this.id, this);
    console.log(`Node ${this.id}: Connected to ${peer.id}`);
    return true;
  }

  /**
   * Disconnect from a peer
   * @param {string} peerId - ID of the peer to disconnect from
   * @returns {boolean} - True if disconnection was successful
   */
  disconnect(peerId) {
    if (!this.peers.has(peerId)) {
      console.log(`Node ${this.id}: Not connected to ${peerId}`);
      return false;
    }

    const peer = this.peers.get(peerId);
    this.peers.delete(peerId);
    peer.peers.delete(this.id);
    console.log(`Node ${this.id}: Disconnected from ${peerId}`);
    return true;
  }

  /**
   * Broadcast a message to all peers
   * @param {string} type - Message type
   * @param {Object} data - Message content
   * @param {string} [originalSender] - ID of the original sender (for forwarding)
   */
  broadcast(type, data, originalSender = null) {
    // Create a unique message ID to prevent rebroadcasting the same message
    const messageId = crypto.createHash('sha256')
      .update(`${type}-${JSON.stringify(data)}-${Date.now()}`)
      .digest('hex');

    // If we've already processed this message, ignore it
    if (this.pendingBroadcasts.has(messageId)) {
      return;
    }

    this.pendingBroadcasts.add(messageId);
    setTimeout(() => {
      this.pendingBroadcasts.delete(messageId);
    }, 5000); // Clean up after 5 seconds

    // Forward the message to all peers except the sender
    for (const [peerId, peer] of this.peers.entries()) {
      if (peerId !== originalSender) {
        peer.receiveMessage(type, data, this.id, messageId);
      }
    }
  }

  /**
   * Handle an incoming message from another node
   * @param {string} type - Message type
   * @param {Object} data - Message data
   * @param {string} senderId - ID of the message sender
   * @param {string} messageId - Unique ID of the message
   */
  receiveMessage(type, data, senderId, messageId) {
    console.log(`Node ${this.id}: Received ${type} message from ${senderId}`);

    // Process message based on type
    switch(type) {
      case 'NEW_BLOCK':
        this.handleNewBlock(data.block);
        // Rebroadcast to other peers
        this.broadcast(type, data, senderId);
        break;
        
      case 'NEW_TRANSACTION':
        this.handleNewTransaction(data.transaction);
        // Rebroadcast to other peers
        this.broadcast(type, data, senderId);
        break;
        
      case 'CHAIN_REQUEST':
        this.sendChain(senderId);
        break;
        
      case 'CHAIN_RESPONSE':
        this.handleChainResponse(data.chain, senderId);
        break;
        
      default:
        console.log(`Node ${this.id}: Unknown message type: ${type}`);
    }
  }

  /**
   * Request the blockchain from all peers
   */
  requestChainFromPeers() {
    console.log(`Node ${this.id}: Requesting blockchain from peers`);
    this.broadcast('CHAIN_REQUEST', {});
  }

  /**
   * Send our blockchain to a specific peer
   * @param {string} peerId - ID of the peer to send the chain to
   */
  sendChain(peerId) {
    if (!this.peers.has(peerId)) {
      console.log(`Node ${this.id}: Peer ${peerId} not connected`);
      return;
    }

    console.log(`Node ${this.id}: Sending blockchain to ${peerId}`);
    const peer = this.peers.get(peerId);
    peer.receiveMessage('CHAIN_RESPONSE', {
      chain: this.blockchain.chain
    }, this.id, `chain-response-${Date.now()}`);
  }

  /**
   * Handle a new block received from the network
   * @param {Object} block - The new block received
   */
  handleNewBlock(block) {
    console.log(`Node ${this.id}: Processing new block with index ${block.index}`);
    
    // Check if the block already exists in our chain
    const existingBlockIndex = this.blockchain.chain.findIndex(b => b.hash === block.hash);
    if (existingBlockIndex !== -1) {
      console.log(`Node ${this.id}: Already have this block`);
      return;
    }

    // Validate the block before adding it
    if (block.previousHash === this.blockchain.getLatestBlock().hash) {
      // If block is valid and connects to our chain, add it
      this.blockchain.chain.push(block);
      console.log(`Node ${this.id}: Added new block to chain`);
    } else {
      console.log(`Node ${this.id}: Received block doesn't connect to our chain`);
      // This would trigger a chain comparison in real implementation
      this.requestChainFromPeers();
    }
  }

  /**
   * Handle a new transaction received from the network
   * @param {Object} transaction - The new transaction
   */
  handleNewTransaction(transaction) {
    try {
      this.blockchain.addTransaction(transaction);
      console.log(`Node ${this.id}: Added transaction to pending pool`);
    } catch (error) {
      console.log(`Node ${this.id}: Invalid transaction received: ${error.message}`);
    }
  }

  /**
   * Handle a blockchain received from a peer
   * @param {Array} receivedChain - The blockchain from the peer
   * @param {string} peerId - ID of the peer that sent the chain
   */
  handleChainResponse(receivedChain, peerId) {
    if (receivedChain.length <= this.blockchain.chain.length) {
      console.log(`Node ${this.id}: Received chain is not longer than current chain`);
      return;
    }

    try {
      // Create a new blockchain for validation
      const tempBlockchain = new Blockchain();
      
      // Clear the chain (removing genesis block)
      tempBlockchain.chain = [];
      
      // Import each block properly to ensure methods are available
      for (const blockData of receivedChain) {
        // Create a new block with the same properties
        const block = new Block(
          blockData.index,
          blockData.timestamp,
          blockData.data,
          blockData.previousHash
        );
        
        // Copy over properties that wouldn't be set by the constructor
        block.hash = blockData.hash;
        block.nonce = blockData.nonce;
        if (blockData.merkleRoot) {
          block.merkleRoot = blockData.merkleRoot;
        }
        
        // Add to the temp chain
        tempBlockchain.chain.push(block);
      }

      // Validate the reconstructed chain
      if (tempBlockchain.isChainValid()) {
        console.log(`Node ${this.id}: Received chain is valid and longer, replacing current chain`);
        
        // Replace our chain with the validated one
        this.blockchain.chain = tempBlockchain.chain;
      } else {
        console.log(`Node ${this.id}: Received chain is invalid`);
      }
    } catch (error) {
      console.log(`Node ${this.id}: Error processing received chain: ${error.message}`);
    }
  }

  /**
   * Broadcast a new block to all peers
   * @param {Object} block - The new block to broadcast
   */
  broadcastBlock(block) {
    console.log(`Node ${this.id}: Broadcasting new block to network`);
    this.broadcast('NEW_BLOCK', { block });
  }

  /**
   * Broadcast a new transaction to all peers
   * @param {Object} transaction - The new transaction to broadcast
   */
  broadcastTransaction(transaction) {
    console.log(`Node ${this.id}: Broadcasting new transaction to network`);
    this.broadcast('NEW_TRANSACTION', { transaction });
  }

  /**
   * Mine pending transactions and broadcast the new block
   * @param {string} minerAddress - Address to receive mining reward
   */
  minePendingTransactions(minerAddress) {
    console.log(`Node ${this.id}: Mining a new block...`);
    this.blockchain.minePendingTransactions(minerAddress);
    const newBlock = this.blockchain.chain[this.blockchain.chain.length - 1];
    this.broadcastBlock(newBlock);
  }
}

/**
 * Simulates a peer-to-peer network of blockchain nodes
 */
class Network {
  constructor() {
    this.nodes = new Map(); // Maps node IDs to node objects
  }

  /**
   * Create a new node in the network
   * @param {string} id - Unique identifier for the node
   * @returns {Node} - The created node
   */
  createNode(id) {
    if (this.nodes.has(id)) {
      throw new Error(`Node with ID ${id} already exists`);
    }
    
    const node = new Node(id);
    this.nodes.set(id, node);
    return node;
  }

  /**
   * Connect two nodes in the network
   * @param {string} nodeId1 - ID of the first node
   * @param {string} nodeId2 - ID of the second node
   * @returns {boolean} - True if connection was successful
   */
  connectNodes(nodeId1, nodeId2) {
    if (!this.nodes.has(nodeId1) || !this.nodes.has(nodeId2)) {
      console.log('One or both nodes do not exist');
      return false;
    }
    
    const node1 = this.nodes.get(nodeId1);
    const node2 = this.nodes.get(nodeId2);
    return node1.connect(node2);
  }

  /**
   * Get a node by its ID
   * @param {string} id - ID of the node to get
   * @returns {Node} - The requested node
   */
  getNode(id) {
    return this.nodes.get(id);
  }
}

export { Node, Network };
