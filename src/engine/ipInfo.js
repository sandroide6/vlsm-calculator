import { ipToInt, intToIP } from './vlsm';

// Special / reserved IPv4 ranges with RFC references
const SPECIAL_RANGES = [
  { cidr: '0.0.0.0/8',          name: 'Red actual ("This Network")',        type: 'special',       rfc: 'RFC 1122 §3.2.1.3',  color: '#64748b' },
  { cidr: '10.0.0.0/8',         name: 'Privada — Clase A completa',         type: 'private',       rfc: 'RFC 1918',            color: '#059669' },
  { cidr: '100.64.0.0/10',      name: 'CGNAT / Rango compartido',           type: 'special',       rfc: 'RFC 6598',            color: '#0891b2' },
  { cidr: '127.0.0.0/8',        name: 'Loopback',                           type: 'loopback',      rfc: 'RFC 5735',            color: '#7c3aed' },
  { cidr: '169.254.0.0/16',     name: 'Link-local (APIPA)',                 type: 'link-local',    rfc: 'RFC 3927',            color: '#d97706' },
  { cidr: '172.16.0.0/12',      name: 'Privada — Rango medio',             type: 'private',       rfc: 'RFC 1918',            color: '#059669' },
  { cidr: '192.0.0.0/24',       name: 'IETF Protocol Assignments',          type: 'special',       rfc: 'RFC 6890',            color: '#64748b' },
  { cidr: '192.0.2.0/24',       name: 'Documentación TEST-NET-1',           type: 'documentation', rfc: 'RFC 5737',            color: '#0891b2' },
  { cidr: '192.168.0.0/16',     name: 'Privada — Clase C',                 type: 'private',       rfc: 'RFC 1918',            color: '#059669' },
  { cidr: '198.18.0.0/15',      name: 'Benchmarking de rendimiento',        type: 'special',       rfc: 'RFC 2544',            color: '#64748b' },
  { cidr: '198.51.100.0/24',    name: 'Documentación TEST-NET-2',           type: 'documentation', rfc: 'RFC 5737',            color: '#0891b2' },
  { cidr: '203.0.113.0/24',     name: 'Documentación TEST-NET-3',           type: 'documentation', rfc: 'RFC 5737',            color: '#0891b2' },
  { cidr: '224.0.0.0/4',        name: 'Multicast',                          type: 'multicast',     rfc: 'RFC 5771 / RFC 1112', color: '#ea580c' },
  { cidr: '233.252.0.0/24',     name: 'Documentación multicast (MCAST-TEST)',type: 'documentation', rfc: 'RFC 6676',            color: '#0891b2' },
  { cidr: '240.0.0.0/4',        name: 'Reservada para uso futuro',          type: 'reserved',      rfc: 'RFC 1112',            color: '#dc2626' },
  { cidr: '255.255.255.255/32', name: 'Broadcast limitado',                 type: 'broadcast',     rfc: 'RFC 919',             color: '#dc2626' },
];

function parseCIDR(cidr) {
  const [ip, prefix] = cidr.split('/');
  const p = parseInt(prefix, 10);
  const mask = p === 0 ? 0 : (0xffffffff << (32 - p)) >>> 0;
  const ni = (ipToInt(ip) & mask) >>> 0;
  const bi = (ni + Math.pow(2, 32 - p) - 1) >>> 0;
  return { networkInt: ni, broadcastInt: bi, prefix: p };
}

const PARSED_RANGES = SPECIAL_RANGES.map(r => ({ ...r, ...parseCIDR(r.cidr) }));

export function classifyIPFull(ip) {
  const n = ipToInt(ip) >>> 0;
  const a = (n >>> 24) & 0xff;

  let cls, clsRange, defaultMask, defaultPrefix, clsDescription;
  if (a < 128) {
    cls = 'A'; defaultPrefix = 8; defaultMask = '255.0.0.0';
    clsRange = '1.0.0.0 – 126.255.255.255';
    clsDescription = 'Redes muy grandes (hasta 16 millones de hosts por red)';
  } else if (a < 192) {
    cls = 'B'; defaultPrefix = 16; defaultMask = '255.255.0.0';
    clsRange = '128.0.0.0 – 191.255.255.255';
    clsDescription = 'Redes medianas (hasta 65 534 hosts por red)';
  } else if (a < 224) {
    cls = 'C'; defaultPrefix = 24; defaultMask = '255.255.255.0';
    clsRange = '192.0.0.0 – 223.255.255.255';
    clsDescription = 'Redes pequeñas (hasta 254 hosts por red)';
  } else if (a < 240) {
    cls = 'D'; defaultPrefix = null; defaultMask = null;
    clsRange = '224.0.0.0 – 239.255.255.255';
    clsDescription = 'Multicast — no asignable a hosts individuales';
  } else {
    cls = 'E'; defaultPrefix = null; defaultMask = null;
    clsRange = '240.0.0.0 – 255.255.255.255';
    clsDescription = 'Reservada — no usable en redes convencionales';
  }

  // Most specific matching range first
  const match = PARSED_RANGES
    .filter(r => n >= r.networkInt && n <= r.broadcastInt)
    .sort((a, b) => b.prefix - a.prefix)[0] || null;

  return {
    ip,
    cls,
    clsRange,
    clsDescription,
    defaultMask,
    defaultPrefix,
    type:         match?.type    || 'public',
    typeName:     match?.name    || 'Pública (enrutable en Internet)',
    rfc:          match?.rfc     || null,
    specialRange: match?.cidr    || null,
    badgeColor:   match?.color   || '#2563eb',
  };
}

export const TYPE_LABELS = {
  public:        'Pública',
  private:       'Privada',
  loopback:      'Loopback',
  'link-local':  'Link-local',
  multicast:     'Multicast',
  broadcast:     'Broadcast',
  documentation: 'Documentación',
  reserved:      'Reservada',
  special:       'Especial / IETF',
};

export const RFC_URLS = {
  'RFC 1918':   'https://www.rfc-editor.org/rfc/rfc1918',
  'RFC 5735':   'https://www.rfc-editor.org/rfc/rfc5735',
  'RFC 3927':   'https://www.rfc-editor.org/rfc/rfc3927',
  'RFC 5771':   'https://www.rfc-editor.org/rfc/rfc5771',
  'RFC 1122 §3.2.1.3': 'https://www.rfc-editor.org/rfc/rfc1122',
  'RFC 6598':   'https://www.rfc-editor.org/rfc/rfc6598',
  'RFC 5737':   'https://www.rfc-editor.org/rfc/rfc5737',
  'RFC 2544':   'https://www.rfc-editor.org/rfc/rfc2544',
  'RFC 1112':   'https://www.rfc-editor.org/rfc/rfc1112',
  'RFC 919':    'https://www.rfc-editor.org/rfc/rfc919',
  'RFC 6890':   'https://www.rfc-editor.org/rfc/rfc6890',
};
