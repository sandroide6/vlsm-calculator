import { ipToInt, intToIP } from './vlsm';

export function ipToBinary(ip) {
  return ip.split('.').map(o => parseInt(o, 10).toString(2).padStart(8, '0')).join('.');
}

export function ipToHex(ip) {
  return ip.split('.').map(o => parseInt(o, 10).toString(16).toUpperCase().padStart(2, '0')).join('.');
}

export function binaryToIP(bin) {
  const clean = bin.replace(/\./g, '');
  if (clean.length !== 32 || !/^[01]+$/.test(clean)) return null;
  const octets = [0, 8, 16, 24].map(i => parseInt(clean.slice(i, i + 8), 2));
  return octets.join('.');
}

export function hexToIP(hex) {
  const clean = hex.replace(/[.\s-]/g, '');
  if (clean.length !== 8 || !/^[0-9a-fA-F]+$/.test(clean)) return null;
  const octets = [0, 2, 4, 6].map(i => parseInt(clean.slice(i, i + 2), 16));
  return octets.join('.');
}

// True only for contiguous-ones masks (like 255.255.255.0)
export function isValidMask(ip) {
  const n = ipToInt(ip) >>> 0;
  if (n === 0) return true;
  const inv = (~n) >>> 0;
  return (inv & (inv + 1)) === 0;
}

export function maskToPrefix(mask) {
  const n = ipToInt(mask) >>> 0;
  let count = 0;
  for (let i = 31; i >= 0; i--) {
    if ((n >>> i) & 1) count++;
    else break;
  }
  return count;
}

export function prefixToDecimal(p) {
  const mask = p === 0 ? 0 : (0xffffffff << (32 - p)) >>> 0;
  return intToIP(mask);
}

// Detect input format and return all notations (null if unrecognized)
export function convertNotations(raw) {
  const value = (raw || '').trim();
  if (!value) return null;

  let decimalIP = null;

  // Decimal IP: 192.168.1.0
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(value)) {
    const parts = value.split('.').map(Number);
    if (parts.every(p => p >= 0 && p <= 255)) decimalIP = value;
  }

  // Binary with dots: 11000000.10101000.00000001.00000000
  if (!decimalIP && /^[01]{8}(\.[01]{8}){3}$/.test(value)) {
    decimalIP = binaryToIP(value);
  }

  // Binary without dots: 32 bits
  if (!decimalIP && /^[01]{32}$/.test(value)) {
    decimalIP = binaryToIP(value);
  }

  // Hex with dots: C0.A8.01.00
  if (!decimalIP && /^[0-9a-fA-F]{2}(\.[0-9a-fA-F]{2}){3}$/.test(value)) {
    decimalIP = hexToIP(value);
  }

  // Hex compact: C0A80100
  if (!decimalIP && /^[0-9a-fA-F]{8}$/.test(value)) {
    decimalIP = hexToIP(value);
  }

  // CIDR prefix: /24 or 24
  if (!decimalIP && /^\/?\d{1,2}$/.test(value)) {
    const p = parseInt(value.replace('/', ''), 10);
    if (p >= 0 && p <= 32) decimalIP = prefixToDecimal(p);
  }

  if (!decimalIP) return null;

  const isMask = isValidMask(decimalIP);
  const prefix = isMask ? maskToPrefix(decimalIP) : null;

  // 32 individual bits with position info
  const bits = decimalIP.split('.').flatMap((o, octetIdx) => {
    const num = parseInt(o, 10);
    return Array.from({ length: 8 }, (_, i) => ({
      value: (num >> (7 - i)) & 1,
      position: octetIdx * 8 + i,
      octet: octetIdx,
      bit: i,
    }));
  });

  return {
    decimal: decimalIP,
    binary:  ipToBinary(decimalIP),
    hex:     ipToHex(decimalIP),
    prefix,          // null if not a valid mask
    isMask,
    bits,
  };
}
