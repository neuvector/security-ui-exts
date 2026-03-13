export const NVD_BASE_URL = 'https://nvd.nist.gov/vuln/detail/';
export const CVSS_VECTOR_BASE_URL = 'https://www.first.org/cvss/calculator/';
export const SCAN_INTERVALS = {
  ONE_HOUR:          '1h0m0s',
  THREE_HOURS:       '3h0m0s',
  SIX_HOURS:         '6h0m0s',
  TWELVE_HOURS:      '12h0m0s',
  TWENTY_FOUR_HOURS: '24h0m0s',
  MANUAL:            '0s'
};

export const SCAN_INTERVAL_OPTIONS = [
  { label: 'Every 1 hour', value: SCAN_INTERVALS.ONE_HOUR },
  { label: 'Every 3 hours', value: SCAN_INTERVALS.THREE_HOURS },
  { label: 'Every 6 hours', value: SCAN_INTERVALS.SIX_HOURS },
  { label: 'Every 12 hours', value: SCAN_INTERVALS.TWELVE_HOURS },
  { label: 'Every 24 hours', value: SCAN_INTERVALS.TWENTY_FOUR_HOURS },
  { label: 'Manual', value: SCAN_INTERVALS.MANUAL } // backend disables auto-scan
];

export const REGISTRY_TYPE = {
  OCI_DISTRIBUTION: 'OCIDistribution',
  NO_CATALOG:       'NoCatalog'
};

export const REGISTRY_TYPE_OPTIONS = [
  { label: 'OCI Distribution', value: REGISTRY_TYPE.OCI_DISTRIBUTION },
  { label: 'No Catalog', value: REGISTRY_TYPE.NO_CATALOG }
];

export const WORKLOAD_ANNOTATION_PREFIX = 'sbomscanner.kubewarden.io/workloadscan';

export const VALID_PLATFORMS = {
  linux:     ['amd64', 'arm', 'arm64', 's390x','386', 'loong64', 'mips', 'mipsle', 'mips64', 'mips64le', 'ppc64', 'ppc64le', 'riscv64'],
  aix:       ['ppc64'],
  android:   ['amd64', 'arm', 'arm64','386'],
  darwin:    ['amd64', 'arm64'],
  dragonfly: ['amd64'],
  freebsd:   ['amd64', 'arm', '386'],
  illumos:   ['amd64'],
  ios:       ['arm64'],
  js:        ['wasm'],
  netbsd:    ['amd64', 'arm', '386'],
  openbsd:   ['amd64', 'arm', 'arm64', '386'],
  plan9:     ['amd64', 'arm', '386'],
  solaris:   ['amd64'],
  wasip1:    ['wasm'],
  windows:   ['amd64', 'arm', 'arm64', '386']
};

export const ALLOWED_VARIANTS = {
  arm:   ['v6', 'v7', 'v8'],
  arm64: ['v8']
};

export const WORKLOAD_SCAN_DOCS_URL = 'https://github.com/kubewarden/sbomscanner/blob/main/docs/user-guide/scanning-workloads.md';