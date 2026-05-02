/**
 * Sanitizer module for Agent Audit Trail
 * Privacy-first: strip sensitive data before hashing or storing
 */

/** Default sensitive key patterns */
export const DEFAULT_SANITIZE_RULES = [
  'api[_-]?key', 'token', 'password', 'secret',
  'private[_-]?key', 'authorization', 'bearer', 'x-api-key',
  'credential', 'cookie', 'session[_-]?id'
];

/**
 * Sanitize an object by replacing sensitive values with ***
 * @param {*} obj - The object to sanitize
 * @param {string[]} rules - Regex patterns for sensitive keys
 * @returns {*} Sanitized copy
 */
export function sanitize(obj, rules = DEFAULT_SANITIZE_RULES) {
  if (obj === null || obj === undefined) return null;
  if (typeof obj === 'string') {
    let result = obj;
    for (const rule of rules) {
      try {
        const regex = new RegExp(rule, 'gi');
        result = result.replace(regex, '***');
      } catch (e) { /* skip invalid regex */ }
    }
    return result;
  }
  if (typeof obj === 'object') {
    if (Array.isArray(obj)) {
      return obj.map(item => sanitize(item, rules));
    }
    const result = {};
    for (const [key, value] of Object.entries(obj)) {
      let isSensitiveKey = false;
      for (const rule of rules) {
        try {
          if (new RegExp(rule, 'i').test(key)) {
            isSensitiveKey = true;
            break;
          }
        } catch (e) {}
      }
      if (isSensitiveKey && typeof value === 'string') {
        result[key] = '***';
      } else if (isSensitiveKey && typeof value === 'object') {
        result[key] = '[REDACTED]';
      } else {
        result[key] = sanitize(value, rules);
      }
    }
    return result;
  }
  return obj;
}
