export function ipToInt(ip) {
  return ip.split('.').reduce((acc, o) => ((acc << 8) | parseInt(o, 10)) >>> 0, 0);
}

export function intToIP(n) {
  const u = n >>> 0;
  return [(u >>> 24) & 0xff, (u >>> 16) & 0xff, (u >>> 8) & 0xff, u & 0xff].join('.');
}

export function prefixToMask(prefix) {
  const mask = prefix === 0 ? 0 : (0xffffffff << (32 - prefix)) >>> 0;
  return intToIP(mask);
}

export function validateIP(ip) {
  const parts = (ip || '').trim().split('.');
  if (parts.length !== 4) return false;
  return parts.every(p => /^\d+$/.test(p) && parseInt(p, 10) >= 0 && parseInt(p, 10) <= 255);
}

// Minimum prefix that provides at least `hosts` usable addresses (2^n - 2 >= hosts)
export function neededPrefix(hosts) {
  for (let p = 30; p >= 1; p--) {
    if (Math.pow(2, 32 - p) - 2 >= hosts) return p;
  }
  return 1;
}

export function classifyIP(ip) {
  const parts = ip.split('.').map(Number);
  const [a, b] = parts;
  const cls = a < 128 ? 'A' : a < 192 ? 'B' : a < 224 ? 'C' : 'D/E';
  const isPrivate =
    a === 10 ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168);
  return { cls, isPrivate };
}

export function getSubnetDetails(networkInt, prefix) {
  const size = Math.pow(2, 32 - prefix);
  const broadcastInt = (networkInt + size - 1) >>> 0;
  const usable = Math.max(0, size - 2);
  return {
    networkInt,
    prefix,
    network: intToIP(networkInt),
    mask: prefixToMask(prefix),
    broadcast: intToIP(broadcastInt),
    firstHost: usable > 0 ? intToIP((networkInt + 1) >>> 0) : '—',
    lastHost: usable > 0 ? intToIP((broadcastInt - 1) >>> 0) : '—',
    totalHosts: size,
    usableHosts: usable,
  };
}

export function vlsmCalculate(baseIP, basePrefix, requirements) {
  if (!validateIP(baseIP)) return { error: 'IP base inválida.' };
  const p = parseInt(basePrefix, 10);
  if (isNaN(p) || p < 1 || p > 30) return { error: 'El prefijo debe estar entre /1 y /30.' };

  const validReqs = requirements.filter(r => r.name.trim() && parseInt(r.hosts, 10) > 0);
  if (validReqs.length === 0) return { error: 'Agrega al menos una subred con hosts > 0.' };

  // Align base IP to network boundary
  const maskInt = (0xffffffff << (32 - p)) >>> 0;
  const networkBaseInt = (ipToInt(baseIP) & maskInt) >>> 0;
  const baseSize = Math.pow(2, 32 - p);
  const baseEndInt = (networkBaseInt + baseSize - 1) >>> 0;

  const sorted = validReqs
    .map((r, i) => ({ ...r, hosts: parseInt(r.hosts, 10), _orig: i }))
    .sort((a, b) => b.hosts - a.hosts);

  let cursor = networkBaseInt;
  const errors = [];
  const subnets = [];

  for (const req of sorted) {
    const prefix = neededPrefix(req.hosts);
    const blockSize = Math.pow(2, 32 - prefix);

    // Align cursor up to block boundary
    if (cursor % blockSize !== 0) {
      cursor = (Math.floor(cursor / blockSize) + 1) * blockSize;
    }

    const networkInt = cursor >>> 0;

    if (networkInt + blockSize - 1 > baseEndInt) {
      errors.push(`"${req.name}": espacio insuficiente en el bloque base`);
      continue;
    }

    subnets.push({
      ...getSubnetDetails(networkInt, prefix),
      name: req.name,
      requestedHosts: req.hosts,
      wasted: Math.max(0, Math.pow(2, 32 - prefix) - 2 - req.hosts),
      _orig: req._orig,
      color: '',
    });

    cursor = (networkInt + blockSize) >>> 0;
  }

  // Restore display order matching input order
  subnets.sort((a, b) => a._orig - b._orig);

  const totalAllocated = subnets.reduce((s, r) => s + r.totalHosts, 0);
  const totalRequested = validReqs.reduce((s, r) => s + parseInt(r.hosts, 10), 0);
  const efficiency = totalAllocated > 0
    ? ((totalRequested / totalAllocated) * 100).toFixed(1)
    : '0.0';

  return {
    subnets,
    baseNetwork: intToIP(networkBaseInt),
    basePrefix: p,
    baseSize,
    baseEndInt,
    networkBaseInt,
    totalAllocated,
    totalRequested,
    efficiency,
    errors,
  };
}

export function generateCiscoCommands(subnets) {
  return subnets
    .map((s, i) => {
      const ifName = `GigabitEthernet0/${i}`;
      const addr = s.firstHost !== '—' ? s.firstHost : s.network;
      return `! --- ${s.name} ---\ninterface ${ifName}\n description ${s.name}\n ip address ${addr} ${s.mask}\n no shutdown\n!\n`;
    })
    .join('');
}

export function checkSameSubnet(ip1, ip2, prefix) {
  if (!validateIP(ip1) || !validateIP(ip2)) return null;
  const mask = prefix === 0 ? 0 : (0xffffffff << (32 - prefix)) >>> 0;
  return (ipToInt(ip1) & mask) === (ipToInt(ip2) & mask);
}

// entries: [{id, network, prefix}] — checks all pairs for overlap
export function detectOverlaps(entries) {
  const valid = entries
    .filter(e => validateIP(e.network) && parseInt(e.prefix, 10) >= 1 && parseInt(e.prefix, 10) <= 32)
    .map(e => {
      const ni = ipToInt(e.network) >>> 0;
      const p = parseInt(e.prefix, 10);
      const size = Math.pow(2, 32 - p);
      return { ...e, prefix: p, networkInt: ni, broadcastInt: (ni + size - 1) >>> 0, mask: prefixToMask(p) };
    });

  const overlaps = [];
  for (let i = 0; i < valid.length; i++) {
    for (let j = i + 1; j < valid.length; j++) {
      const a = valid[i];
      const b = valid[j];
      if (a.networkInt <= b.broadcastInt && b.networkInt <= a.broadcastInt) {
        overlaps.push({ a, b });
      }
    }
  }
  return { valid, overlaps };
}

// Build CSV string from subnet results
export function toCSV(subnets, baseNetwork, basePrefix) {
  const header = ['Nombre', 'Red/CIDR', 'Máscara', 'Broadcast', 'Primer Host', 'Último Host', 'Hosts Útiles', 'Hosts Pedidos', 'Desperdicio'];
  const rows = subnets.map(s => [
    s.name,
    `${s.network}/${s.prefix}`,
    s.mask,
    s.broadcast,
    s.firstHost,
    s.lastHost,
    s.usableHosts,
    s.requestedHosts,
    s.wasted,
  ]);
  return [
    `# Plan VLSM — Red base: ${baseNetwork}/${basePrefix}`,
    header.join(','),
    ...rows.map(r => r.map(v => `"${v}"`).join(',')),
  ].join('\r\n');
}
