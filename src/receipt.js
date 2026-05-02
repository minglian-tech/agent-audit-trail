/**
 * Receipt module for Agent Audit Trail
 * Generate and verify audit receipts
 */

import { randomUUID } from 'crypto';

/**
 * Generate a receipt for a batch of anchored actions
 * @param {Object[]} records - Array of action records
 * @param {string} merkleRoot - Merkle root of the batch
 * @param {Object} proofs - Map of leaf hash -> proof array
 * @param {Object} [bsvTxData] - BSV transaction data (if anchored)
 * @returns {Object} Receipt object
 */
export function generateReceipt(records, merkleRoot, proofs, bsvTxData = null) {
  const anchorId = randomUUID();

  const receipt = {
    anchorId,
    timestamp: new Date().toISOString(),
    actionCount: records.length,
    merkleRoot,
    bsvTxId: bsvTxData?.txId || null,
    bsvTxHex: bsvTxData?.unsignedHex || null,
    bsvPayload: bsvTxData?.payload || null,
    status: bsvTxData?.txId ? 'anchored' : 'pending_signature',
    actions: records.map((r, i) => {
      const leafKey = Object.keys(proofs).find(k => proofs[k] !== undefined && i < records.length);
      return {
        id: r.id,
        type: r.type,
        tool: r.tool || null,
        paramHash: r.paramHash,
        resultHash: r.resultHash,
        proof: (proofs[leafKey] || []).map(p => ({
          side: p.side,
          hash: p.hash
        }))
      };
    })
  };

  return receipt;
}
