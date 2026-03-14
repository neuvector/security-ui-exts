import { shallowMount } from '@vue/test-utils';
import WorkloadVulnerabilities from '../WorkloadVulnerabilities.vue';
import { RESOURCE } from '@sbomscanner-ui-ext/types';

const mockUpdateTabCount = jest.fn();

jest.mock('@shell/components/form/ResourceTabs/composable', () => ({ useTabCountUpdater: () => ({ updateTabCount: mockUpdateTabCount }) }));

jest.mock('@sbomscanner-ui-ext/utils/image', () => ({
  constructImageName: jest.fn((metadata) => {
    if (!metadata) {
      return '';
    }

    return `${ metadata.registryURI || '' }/${ metadata.repository || '' }:${ metadata.tag || '' }`;
  }),
}));

jest.mock('@sbomscanner-ui-ext/utils/report', () => ({
  getHighestScore: jest.fn((cvss) => {
    const score = cvss?.nvd?.v3score;

    return score ? `${ score } (v3)` : '';
  }),
  getPackagePath: jest.fn((purl) => {
    if (typeof purl !== 'string') {
      return '';
    }

    const match = purl.match(/(?<=:)([^@]+?)(?=@)/);

    return match?.[0] || '';
  }),
  getScoreNum(score) {
    return score ? parseFloat(String(score).split(' ')[0]) : 0;
  },
  getSeverityNum: jest.fn((severity) => {
    const map = {
      critical: 5,
      high:     4,
      medium:   3,
      low:      2,
      none:     1,
    };

    return map[String(severity || '').toLowerCase()] || 0;
  }),
}));

jest.mock('dayjs', () => jest.fn(() => ({
  format: (fmt) => {
    if (fmt === 'MMDDYYYY_HHmmss') return '03092026_121212';

    return 'FORMATTED';
  }
})));

describe('WorkloadVulnerabilities.vue', () => {
  const mountComponent = (opts: any = {}) => {
    const route = opts.route || {
      params: { namespace: 'prod', id: 'orders' },
      query:  {},
      hash:   '',
      path:   '/test',
    };

    const store = opts.store || { dispatch: jest.fn(), getters: {} };
    const router = opts.router || { replace: jest.fn() };

    return shallowMount(WorkloadVulnerabilities, {
      global: {
        stubs: {
          Banner:                true,
          DownloadFullReportBtn: true,
          ImageTableSet:         true,
          VulnerabilityTableSet: true,
          Tabbed:                true,
          Tab:                   true,
        },
        mocks: {
          t:       (key: string) => key,
          $t:      (key: string) => key,
          $store:  store,
          $router: router,
          $route:  route,
        },
      },
    });
  };

  const baseContainers = [
    {
      name:                 'orders-api',
      vulnerabilityReports: [
        {
          imageMetadata: {
            registryURI: 'docker.io',
            repository:  'org/orders',
            tag:         '1.0.0',
            platform:    'linux/amd64',
            digest:      'sha256:abc123',
          },
          report: {
            results: [
              {
                vulnerabilities: [
                  {
                    cve:              'CVE-2026-0001',
                    cvss:             { nvd: { v3score: 9.8 } },
                    severity:         'HIGH',
                    packageName:      'openssl',
                    fixedVersions:    ['3.0.1'],
                    installedVersion: '3.0.0',
                    purl:             'pkg:apk/alpine/openssl@3.0.0',
                    description:      'description with "quotes"',
                  },
                ],
              },
            ],
          },
        },
      ],
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('initializes default state from route query', () => {
    const wrapper = mountComponent({
      route: {
        params: { namespace: 'prod', id: 'orders' },
        query:  { defaultTab: 'affectingCVEs' },
        hash:   '',
        path:   '/workload/orders',
      },
    });

    expect(wrapper.vm.defaultTab).toBe('affectingCVEs');
    expect(wrapper.vm.activeTab).toBe('images');
    expect(wrapper.vm.showSubTabs).toBe(false);
    expect(wrapper.vm.filters.severity).toBe(null);
  });

  it('flattenWorkloadDetails maps workload vulnerability fields correctly', () => {
    const wrapper = mountComponent();

    wrapper.vm.workloadName = 'orders';
    wrapper.vm.workloadType = 'Deployment';
    wrapper.vm.containerMap.set('orders-api', { namespace: 'prod' });

    const rows = wrapper.vm.flattenWorkloadDetails(baseContainers);

    expect(rows).toHaveLength(1);
    expect(rows[0]).toEqual(expect.objectContaining({
      workloadName:   'orders',
      namespace:      'prod',
      kind:           'Deployment',
      container:      'orders-api',
      imageReference: 'docker.io/org/orders:1.0.0',
      cveId:          'CVE-2026-0001',
      score:          '9.8 (v3)',
      severity:       'high',
      package:        'openssl',
      fixAvailable:   'Yes',
      fixedVersion:   '3.0.1',
      packageVersion: '3.0.0',
      packagePath:    'apk/alpine/openssl',
    }));
  });

  it('parseImagesData maps container namespace and pushes image rows', () => {
    const wrapper = mountComponent();

    wrapper.vm.containerSpec = [
      {
        name:     'orders-api',
        imageRef: { namespace: 'prod' },
      },
    ];

    const containers = [
      {
        name:                 'orders-api',
        vulnerabilityReports: [{ imageMetadata: { repository: 'orders' }, report: { summary: {} } }],
      },
      {
        name:                 'unknown-container',
        vulnerabilityReports: [{ imageMetadata: { repository: 'other' }, report: { summary: {} } }],
      },
    ];

    wrapper.vm.parseImagesData(containers);

    expect(wrapper.vm.images).toHaveLength(2);
    expect(wrapper.vm.images[0].metadata.namespace).toBe('prod');
    expect(wrapper.vm.images[1].metadata.namespace).toBe('imageScanner.general.unknown');
  });

  it('parseVulnerabilitiesData handles dedupe, suppression filter, and fallback fields', () => {
    const wrapper = mountComponent();

    wrapper.vm.workloadName = 'orders';
    wrapper.vm.workloadType = 'Deployment';
    wrapper.vm.containerMap.set('orders-api', { namespace: 'prod' });

    const containers = [
      {
        name:                 'orders-api',
        vulnerabilityReports: [
          {
            imageMetadata: {
              registryURI: 'docker.io',
              repository:  'org/orders',
              tag:         '1.0.0',
              platform:    'linux/amd64',
              digest:      'sha256:111',
            },
            report: {
              results: [
                {
                  vulnerabilities: [
                    {
                      cve:              'CVE-DUP',
                      packageName:      'openssl',
                      installedVersion: '3.0.0',
                      fixedVersions:    ['3.0.1'],
                      severity:         'HIGH',
                      cvss:             { nvd: { v3score: 9.8 } },
                      purl:             'pkg:apk/alpine/openssl@3.0.0',
                      description:      'dup',
                      suppressed:       false,
                    },
                    {
                      cve:              'CVE-SUPP',
                      packageName:      'pkg-s',
                      installedVersion: '1.0.0',
                      fixedVersions:    [],
                      severity:         'LOW',
                      cvss:             { nvd: { v3score: 2.1 } },
                      purl:             'pkg:apk/alpine/pkg-s@1.0.0',
                      description:      'suppressed',
                      suppressed:       true,
                    },
                  ],
                },
              ],
            },
          },
          {
            imageMetadata: {
              registryURI: 'docker.io',
              repository:  'org/orders',
              tag:         '2.0.0',
              platform:    'linux/amd64',
              digest:      'sha256:222',
            },
            report: {
              results: [
                {
                  vulnerabilities: [
                    {
                      cve:              'CVE-DUP',
                      packageName:      'openssl',
                      installedVersion: '3.0.0',
                      fixedVersions:    ['3.0.2'],
                      severity:         'HIGH',
                      cvss:             { nvd: { v3score: 9.8 } },
                      purl:             'pkg:apk/alpine/openssl@3.0.0',
                      description:      'dup2',
                      suppressed:       false,
                    },
                    {
                      cve:              'CVE-NOSEV',
                      packageName:      'pkg-x',
                      installedVersion: '2.0.0',
                      fixedVersions:    [],
                      severity:         undefined,
                      cvss:             {},
                      purl:             undefined,
                      description:      'no severity',
                      suppressed:       false,
                    },
                  ],
                },
              ],
            },
          },
        ],
      },
    ];

    wrapper.vm.parseVulnerabilitiesData(containers);

    expect(wrapper.vm.vulnerabilities).toHaveLength(2);
    const dup = wrapper.vm.vulnerabilities.find((v) => v.cveId === 'CVE-DUP');
    const noSev = wrapper.vm.vulnerabilities.find((v) => v.cveId === 'CVE-NOSEV');

    expect(dup.occurrences).toBe(2);
    expect(dup.images).toHaveLength(2);
    expect(dup.fixAvailable).toBe('Yes');
    expect(noSev.severity).toBe('imageScanner.general.unknown');
    expect(noSev.fixAvailable).toBe('No');
  });

  it('getWorkloadDetailReport returns workload CSV with header and rows', () => {
    const wrapper = mountComponent();

    wrapper.vm.workloadName = 'orders';
    wrapper.vm.workloadType = 'Deployment';
    wrapper.vm.containerMap.set('orders-api', { namespace: 'prod' });

    const csv = wrapper.vm.getWorkloadDetailReport(baseContainers);

    expect(csv.startsWith(
      'WORKLOAD NAME,NAMESPACE,KIND,CONTAINER,IMAGE REFERENCE,PLATFORM,DIGEST,CVE_ID,SCORE,SEVERITY,PACKAGE,FIX AVAILABLE,FIXED VERSION,PACKAGE VERSION,PACKAGE PATH,DESCRIPTION'
    )).toBe(true);
    expect(csv).toContain('"orders"');
    expect(csv).toContain('"CVE-2026-0001"');
    expect(csv).toContain('"Yes"');
  });

  it('getWorkloadDetailReport escapes double quotes in description', () => {
    const wrapper = mountComponent();

    wrapper.vm.workloadName = 'orders';
    wrapper.vm.workloadType = 'Deployment';
    wrapper.vm.containerMap.set('orders-api', { namespace: 'prod' });

    const csv = wrapper.vm.getWorkloadDetailReport(baseContainers);

    expect(csv).toContain('"description with ""quotes"""');
    expect(csv).not.toContain('"description with "quotes""');
  });

  it('getImagesReport returns CSV rows with computed totals', () => {
    const wrapper = mountComponent();

    const images = [
      {
        imageMetadata: {
          registryURI: 'docker.io',
          repository:  'org/orders',
          tag:         '1.0.0',
          platform:    'linux/amd64',
          digest:      'sha256:abc',
        },
        metadata: {
          container: 'orders-api',
          namespace: 'prod',
          images:    ['docker.io/org/orders:1.0.0'],
        },
        report: {
          summary: {
            critical: 1,
            high:     2,
            medium:   3,
            low:      4,
            unknown:  5,
          },
        },
      },
    ];

    const csv = wrapper.vm.getImagesReport(images, 'Deployment');

    expect(csv.startsWith('IMAGE REFERENCE,REGISTRY,REPOSITORY,PLATFORM,DIGEST,WORKLOAD NAME,TYPE,NAMESPACE,IMAGES USED,AFFECTING CVEs,CVEs(Critical),CVEs(High),CVEs(Medium),CVEs(Low),CVEs(None)')).toBe(true);
    expect(csv).toContain('"docker.io/org/orders:1.0.0"');
    expect(csv).toContain('"15"');
  });

  it('getVulnerabilityJsonReport maps containers to vulnerabilityReports arrays', () => {
    const wrapper = mountComponent();
    const containers = [
      { vulnerabilityReports: [{ id: 'a' }] },
      { vulnerabilityReports: [{ id: 'b' }, { id: 'c' }] },
    ];

    const result = wrapper.vm.getVulnerabilityJsonReport(containers);

    expect(result).toEqual([
      [{ id: 'a' }],
      [{ id: 'b' }, { id: 'c' }],
    ]);
  });

  it('onTabChanged updates activeTab and pushes route query', () => {
    const router = { replace: jest.fn() };
    const route = {
      params: { namespace: 'prod', id: 'orders' },
      query:  { existing: '1' },
      hash:   '',
      path:   '/workloads/orders',
    };
    const wrapper = mountComponent({ router, route });

    wrapper.vm.onTabChanged({ selectedName: 'affectingCVEs', name: 'affectingCVEs' });

    expect(wrapper.vm.activeTab).toBe('affectingCVEs');
    expect(router.replace).toHaveBeenCalledWith({
      path:  '/workloads/orders',
      query: { existing: '1', defaultTab: 'affectingCVEs' },
      hash:  '#vulnerabilities',
    });
  });

  it('severity watcher sets filter and clears query when severity exists', () => {
    const router = { replace: jest.fn() };
    const route = {
      params: { namespace: 'prod', id: 'orders' },
      query:  { severity: 'high' },
      hash:   '',
      path:   '/workloads/orders',
    };
    const wrapper = mountComponent({ router, route });
    const severityWatcher = wrapper.vm.$options.watch['$route.query.severity'].handler;

    severityWatcher.call(wrapper.vm, 'high');

    expect(wrapper.vm.filters.severity).toBe('high');
    expect(router.replace).toHaveBeenCalledWith({
      path:  '/workloads/orders',
      hash:  '',
      query: { severity: 'high' },
    });
  });

  it('severity watcher does nothing when severity missing', () => {
    const router = { replace: jest.fn() };
    const wrapper = mountComponent({ router });
    const severityWatcher = wrapper.vm.$options.watch['$route.query.severity'].handler;

    severityWatcher.call(wrapper.vm, undefined);

    expect(wrapper.vm.filters.severity).toBe(null);
    expect(router.replace).not.toHaveBeenCalled();
  });

  it('hash watcher toggles tabs visibility and default tab', () => {
    const route = {
      params: { namespace: 'prod', id: 'orders' },
      query:  { defaultTab: 'affectingCVEs' },
      hash:   '#vulnerabilities',
      path:   '/workloads/orders',
    };
    const wrapper = mountComponent({ route });
    const hashWatcher = wrapper.vm.$options.watch['$route.hash'].handler;

    hashWatcher.call(wrapper.vm, '#vulnerabilities');
    jest.runAllTimers();

    expect(wrapper.vm.defaultTab).toBe('affectingCVEs');
    expect(wrapper.vm.showSubTabs).toBe(true);

    hashWatcher.call(wrapper.vm, '#other');
    expect(wrapper.vm.showSubTabs).toBe(false);
  });

  it('fetch loads workload data and updates computed reports and counts', async() => {
    const matchedReport: any = {
      metadata: {
        namespace:       'prod',
        name:            'orders',
        ownerReferences: [{ name: 'orders', kind: 'Deployment' }],
      },
      summary: {
        critical: 1,
        high:     2,
        medium:   3,
        low:      4,
        unknown:  5,
      },
      containers: baseContainers,
    };
    const ignoredReport: any = {
      metadata: {
        namespace:       'dev',
        name:            'ignored',
        ownerReferences: [{ name: 'ignored', kind: 'Deployment' }],
      },
      summary:    {},
      containers: [],
    };

    matchedReport.spec = { containers: [{ name: 'orders-api', imageRef: { namespace: 'prod' } }] };
    ignoredReport.spec = { containers: [] };

    const reports = [matchedReport, ignoredReport];
    const dispatch = jest.fn().mockResolvedValue(reports);
    const store = { dispatch, getters: {} };
    const route = {
      params: { namespace: 'prod', id: 'orders' },
      query:  {},
      hash:   '',
      path:   '/workloads/orders',
    };
    const wrapper = mountComponent({ store, route });

    await wrapper.vm.$options.fetch.call(wrapper.vm);

    expect(dispatch).toHaveBeenCalledWith('cluster/findAll', { type: RESOURCE.WORKLOAD });
    expect(wrapper.vm.workloadName).toBe('orders');
    expect(wrapper.vm.workloadType).toBe('Deployment');
    expect(wrapper.vm.imagesReportFileName).toBe('workload-images-report_03092026_121212.csv');
    expect(wrapper.vm.affactingCvesReportFileName).toBe('workload-affecting-cves-report_03092026_121212.csv');
    expect(wrapper.vm.workloadVulnerabilityReportFileName).toBe('orders-vulnerability-report_03092026_121212.json');
    expect(wrapper.vm.totalCveCount).toBe(15);
    expect(wrapper.vm.images.length).toBeGreaterThan(0);
    expect(wrapper.vm.vulnerabilities.length).toBeGreaterThan(0);
    expect(mockUpdateTabCount).toHaveBeenNthCalledWith(1, undefined);
    expect(mockUpdateTabCount).toHaveBeenNthCalledWith(2, 15);
  });
});
