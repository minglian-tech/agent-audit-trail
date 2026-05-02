/**
 * BSV Anchor module for Agent Audit Trail
 * Build OP_RETURN transactions for Merkle root anchoring on BSV
 */

/**
 * Build an unsigned BSV OP_RETURN transaction hex
 * @param {string} merkleRoot - The Merkle root to anchor
 * @param {string} walletAddress - BSV wallet address
 * @param {Object} [metadata] - Additional metadata to include
 * @returns {{ unsignedHex: string, payload: Object, merkleRoot: string, walletAddress: string }}
 */
export function buildBSVOpReturnTx(merkleRoot, walletAddress, metadata = {}) {
  const payload = {
    m: 'agent-audit',
    v: '1.0',
    r: merkleRoot,
    t: new Date().toISOString(),
    ...metadata
  };

  const payloadHex = Buffer.from(JSON.stringify(payload), 'utf8').toString('hex');

  // Simplified unsigned tx structure (requires private key signing before broadcast)
  const addrHex = Buffer.from(walletAddress).toString('hex');

  let hex = '01000000'; // version
  hex += '01'; // 1 input
  hex += '00'.repeat(32); // prev tx id (placeholder - needs UTXO)
  hex += 'ffffffff'; // output index
  hex += '76a914' + addrHex.substring(0, 40) + '88ac'; // scriptSig placeholder
  hex += 'ffffffff'; // sequence
  hex += '02'; // 2 outputs
  hex += '0000000000000000'; // 0 sat (OP_RETURN output)
  hex += '6a' + (payloadHex.length / 2).toString(16).padStart(2, '0') + payloadHex; // OP_RETURN
  hex += '0000000000000000'; // change amount (placeholder)
  hex += '76a914' + addrHex.substring(0, 40) + '88ac'; // change script
  hex += '00000000'; // locktime

  return { unsignedHex: hex, payload, merkleRoot, walletAddress };
}
