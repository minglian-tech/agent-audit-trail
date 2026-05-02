/**
 * Agent Audit Trail - Main Entry
 * Immutable AI Agent action logging on BSV blockchain
 */

export { sha256, buildMerkleTree, verifyMerkleProof } from './merkle.js';
export { sanitize, DEFAULT_SANITIZE_RULES } from './sanitizer.js';
export { buildBSVOpReturnTx } from './bsv-anchor.js';
export { generateReceipt } from './receipt.js';

import { randomUUID } from 'crypto';
import { writeFileSync, appendFileSync, existsSync, mkdirSync, readFileSync } from 'fs';
import { join, dirname } from 'path';
import { sha256 } from './merkle.js';
import { buildMerkleTree, verifyMerkleProof } from './merkle.js';
import { sanitize, DEFAULT_SANITIZE_RULES } from './sanitizer.js';
import { buildBSVOpReturnTx } from './bsv-anchor.js';
import { generateReceipt } from './receipt.js';

/**
 * AuditLogger - Main class for recording and anchoring agent actions
 */
export class AuditLogger {
  /**
   * @param {Object} [options]
   * @param {boolean} [options.sanitize=true] - Enable sanitization
   * @param {string[]} [options.sanitizeRules] - Custom sanitize patterns
   * @param {number} [options.bufferSize=100] - Actions before auto-flush
   * @param {number} [options.flushIntervalMs=600000] - Max time between flushes (10 min)
   * @param {string} [options.bsvWallet] - BSV wallet for anchoring
   * @param {boolean} [options.anchorEnabled=true] - Enable BSV anchoring
   * @param {string} [options.dataDir] - Directory for buffer and receipts
   */
  constructor(options = {}) {
    this.options = {
      sanitize: true,
      sanitizeRules: DEFAULT_SANITIZE_RULES,
      bufferSize: 100,
      flushIntervalMs: 600000,
      bsvWallet: '1HQTm7L2KXTmNTecedhFRnQqP98yU1GAD7',
      anchorEnabled: true,
      dataDir: './audit-data',
      ...options
    };

    this.buffer = [];
    this.receipts = [];
    this._flushTimer = null;

    // Ensure data directory exists
    mkdirSync(join(this.options.dataDir, 'receipts'), { recursive: true });

    if (this.options.flushIntervalMs > 0) {
      this._flushTimer = setInterval(() => this.flush(), this.options.flushIntervalMs);
    }
  }

  /**
   * Record an agent action
   * @param {Object} event
   * @param {string} event.type - Action type (tool_call, agent_reply, etc.)
   * @param {string} [event.tool] - Tool name (if tool_call)
   * @param {Object} [event.params] - Tool parameters (will be sanitized)
   * @param {Object} [event.result] - Tool result (will be sanitized)
   * @param {number} [event.duration] - Duration in ms
   * @param {string} [event.sessionId] - Session identifier
   * @returns {Object} The recorded action with hash
   */
  onAction(event) {
    const rules = this.options.sanitizeRules;
    const cleanParams = this.options.sanitize ? sanitize(event.params, rules) : event.params;
    const cleanResult = this.options.sanitize ? sanitize(event.result, rules) : event.result;

    const record = {
      id: randomUUID(),
      timestamp: new Date().toISOString(),
      sessionId: event.sessionId || 'default',
      type: event.type,
      tool: event.tool || null,
      paramHash: sha256(cleanParams),
      resultHash: cleanResult ? sha256(cleanResult) : null,
      duration: event.duration || 0
    };

    this.buffer.push(record);

    // Persist to buffer file
    const bufferPath = join(this.options.dataDir, 'buffer.jsonl');
    appendFileSync(bufferPath, JSON.stringify(record) + '\n', 'utf8');

    // Auto-flush if buffer full
    if (this.buffer.length >= this.options.bufferSize) {
      return this.flush();
    }

    return record;
  }

  /**
   * Flush buffer: build Merkle tree, generate receipt, optionally anchor to BSV
   * @returns {Object|null} Receipt object, or null if buffer empty
   */
  flush() {
    if (this.buffer.length === 0) return null;

    const records = [...this.buffer];
    this.buffer = [];

    // Build Merkle tree
    const leaves = records.map(r => sha256(r));
    const { root, proofs } = buildMerkleTree(leaves);

    // BSV anchoring
    let bsvTxData = null;
    if (this.options.anchorEnabled) {
      bsvTxData = buildBSVOpReturnTx(root, this.options.bsvWallet, {
        anchorId: randomUUID(),
        count: records.length
      });
    }

    // Generate receipt with proper proofs
    const receipt = {
      anchorId: randomUUID(),
      timestamp: new Date().toISOString(),
      actionCount: records.length,
      merkleRoot: root,
      bsvTxId: bsvTxData?.txId || null,
      bsvTxHex: bsvTxData?.unsignedHex || null,
      bsvPayload: bsvTxData?.payload || null,
      status: bsvTxData?.txId ? 'anchored' : 'pending_signature',
      actions: records.map((r, i) => ({
        id: r.id,
        type: r.type,
        tool: r.tool,
        paramHash: r.paramHash,
        resultHash: r.resultHash,
        proof: (proofs[leaves[i]] || []).map(p => ({ side: p.side, hash: p.hash }))
      }))
    };

    // Save receipt
    const date = new Date().toISOString().split('T')[0];
    const receiptPath = join(this.options.dataDir, 'receipts', `${date}.jsonl`);
    appendFileSync(receiptPath, JSON.stringify(receipt) + '\n', 'utf8');
    this.receipts.push(receipt);

    return receipt;
  }

  /**
   * Verify a receipt's Merkle proofs
   * @param {Object} receipt - The receipt to verify
   * @returns {{ valid: boolean, details: Array<{id: string, valid: boolean}> }}
   */
  verify(receipt) {
    const details = receipt.actions.map(a => {
      const leafHash = sha256({ id: a.id, type: a.type, tool: a.tool, paramHash: a.paramHash, resultHash: a.resultHash });
      const isValid = verifyMerkleProof(leafHash, a.proof, receipt.merkleRoot);
      return { id: a.id, valid: isValid };
    });
    return { valid: details.every(d => d.valid), details };
  }

  /**
   * Get current status
   * @returns {Object}
   */
  status() {
    return {
      bufferSize: this.buffer.length,
      receiptCount: this.receipts.length,
      bsvWallet: this.options.bsvWallet,
      anchorEnabled: this.options.anchorEnabled
    };
  }

  /**
   * Stop the flush timer
   */
  destroy() {
    if (this._flushTimer) {
      clearInterval(this._flushTimer);
      this._flushTimer = null;
    }
    // Final flush
    return this.flush();
  }
}
