import { shallowMount, flushPromises } from '@vue/test-utils';
import { nextTick } from 'vue';
import ImageDetails from '../ImageDetails.vue';

// Mock child components
jest.mock('@components/BadgeState', () => ({ BadgeState: { template: '<div class="badge-state" />' } }));
jest.mock('../DistributionChart', () => ({ default: { template: '<div class="distribution-chart" />' } }));
jest.mock('@shell/components/form/LabeledSelect', () => ({ default: { template: '<select class="labeled-select"></select>' } }));
jest.mock('../common/RancherMeta.vue', () => ({ default: { template: '<div class="rancher-meta" />' } }));
jest.mock('../common/MostSevereVulnerabilities.vue', () => ({ default: { template: '<div class="most-severe" />' } }));
jest.mock('../common/VulnerabilityTable', () => ({ default: { template: '<div class="vulnerability-table" />' } }));
jest.mock('../common/DownloadSBOMBtn', () => ({ default: { template: '<button class="download-sbom" />' } }));
jest.mock('../common/DownloadFullReportBtn.vue', () => ({ default: { template: '<button class="download-report" />' } }));

// Mock constants
jest.mock('@sbomscanner-ui-ext/types', () => ({
  PRODUCT_NAME: 'mockProduct',
  RESOURCE:     {
    IMAGE:                'image',
    SBOM:                 'sbom',
    VULNERABILITY_REPORT: 'vulnerabilityReport',
    REGISTRY:             'registry'
  },
  PAGE: { IMAGES: 'images' }
}));

describe('ImageDetails.vue', () => {
  let wrapper: any;
  let mockStore: any;
  let mockT: any;

  beforeEach(async() => {
    mockT = jest.fn((key) => key);

    mockStore = {
      getters: {
        'cluster/all': jest.fn().mockImplementation((resource) => {
          if (resource === 'image') {
            return [
              {
                metadata:      { name: 'test-image', namespace: 'default' },
                imageMetadata: {
                  registry:    'demo-02',
                  registryURI: 'docker.io',
                  repository:  'nginx',
                  tag:         'latest',
                },
              },
            ];
          }

          return [];
        }),
      },
      dispatch: jest.fn(),
    };

    wrapper = shallowMount(ImageDetails, {
      global: {
        mocks: {
          $fetchState: { pending: false },
          $t:          mockT,
          t:           mockT,
          $store:      mockStore,
          $route:      { params: { id: 'test-image-route', cluster: 'test-cluster' } },
        },
        stubs: { RouterLink: { template: '<a><slot /></a>', props: ['to'] } }
      },
      data() {
        return { imageName: 'test-image' };
      },
    });

    await flushPromises();
  });

  it('gets registryDetailLink', async() => {
    const _registryDetailLink = wrapper.vm.registryDetailLink;

    // Assertions
    expect(_registryDetailLink.name).toBe('c-cluster-product-resource-namespace-id');
    expect(_registryDetailLink.params.cluster).toBe('test-cluster');
    expect(_registryDetailLink.params.product).toBe('mockProduct');
    expect(_registryDetailLink.params.resource).toBe('registry');
    expect(_registryDetailLink.params.namespace).toBe('default');
    expect(_registryDetailLink.params.id).toBe('demo-02');
  });

  it('calls loadImageData when route param id exists', async() => {
    const mockLoadImageData = jest.fn();

    // Override the component method so we can spy on it
    wrapper.vm.loadImageData = mockLoadImageData;
    // Run the fetch method
    await wrapper.vm.$options.fetch.call(wrapper.vm);

    // Assertions
    expect(wrapper.vm.imageName).toBe('test-image-route');
    expect(mockLoadImageData).toHaveBeenCalledTimes(1);
  });

  it('does not call loadImageData when no route param id', async() => {
    const mockLoadImageData = jest.fn();
    const wrapper = shallowMount(ImageDetails, {
      global: {
        mocks: {
          $fetchState: { pending: false },
          $t:          mockT,
          t:           mockT,
          $store:      mockStore,
          $route:      { params: { cluster: 'test-cluster' } },
        },
        stubs: { RouterLink: { template: '<a><slot /></a>', props: ['to'] } }
      },
      data() {
        return { imageName: 'test-image' };
      },
    });

    wrapper.vm.loadImageData = mockLoadImageData;
    // Run the fetch method
    await wrapper.vm.$options.fetch.call(wrapper.vm);

    expect(wrapper.vm.imageName).toBeUndefined();
    expect(mockLoadImageData).not.toHaveBeenCalled();
  });

  it('renders the page and basic structure', () => {
    expect(wrapper.exists()).toBe(true);
    expect(wrapper.find('.page').exists()).toBe(true);
    expect(wrapper.find('.header-section').exists()).toBe(true);
  });

  it('initializes reportMeta with csv and json filenames', () => {
    expect(wrapper.vm.reportMeta.csvReportFileName1).toMatch(/^test-image-route-image-detail-report_\d{8}_\d{6}\.csv$/);
    expect(wrapper.vm.reportMeta.csvReportFileName2).toMatch(/^test-image-route-workloads-report_\d{8}_\d{6}\.csv$/);
    expect(wrapper.vm.reportMeta.jsonReportFileName).toMatch(/^test-image-route-vulnerability-report_\d{8}_\d{6}\.json$/);
  });

  it('switches mainResourceIndex based on selected report tab', () => {
    wrapper.vm.onReportTabChanged({ selectedName: 'workloads' });
    expect(wrapper.vm.reportMeta.mainResourceIndex).toBe(2);

    wrapper.vm.onReportTabChanged({ selectedName: 'vulnerabilities' });
    expect(wrapper.vm.reportMeta.mainResourceIndex).toBe(1);
  });

  // it('initializes default data correctly', () => {
  //   const data = wrapper.vm.$data;

  //   expect(data.filters.cveSearch).toBe('');
  //   expect(data.filters.fixAvailable).toBe('any');
  //   expect(data.cachedFilteredVulnerabilities).toEqual([]);
  // });

  it('computes displayImageName correctly when metadata exists', async() => {
    await nextTick();
    expect(wrapper.vm.displayImageName).toBe('docker.io/nginx:latest');
  });

  it('computes displayImageName fallback to imageName', async() => {
    // Override store for this specific test
    const localStore = {
      getters: {
        'cluster/all': jest.fn().mockReturnValue([
          { metadata: { name: 'fallback' }, imageMetadata: {} },
        ]),
      },
    };

    const localWrapper = shallowMount(ImageDetails, {
      global: {
        mocks: {
          $fetchState: { pending: false },
          $t:          mockT,
          t:           mockT,
          $store:      localStore,
          $route:      { params: { id: 'fallback', cluster: 'test-cluster' } },
        },
        stubs: { RouterLink: { template: '<a><slot /></a>', props: ['to'] } }
      },
      data() {
        return { imageName: 'fallback' };
      },
    });

    await nextTick();
    expect(localWrapper.vm.displayImageName).toBe('fallback');
  });

  it('returns correct severityDistribution', () => {
    wrapper.vm.loadedVulnerabilityReport = {
      report: {
        summary: {
          critical: 1, high: 1, medium: 1, low: 1, unknown: 1
        },
        results: [
          {
            vulnerabilities: [
              { severity: 'Critical' },
              { severity: 'High' },
              { severity: 'Medium' },
              { severity: 'Low' },
              { severity: 'None' },
            ],
          },
        ],
      },
    };
    const result = wrapper.vm.severityDistribution;

    expect(result.critical).toBe(1);
    expect(result.high).toBe(1);
    expect(result.medium).toBe(1);
    expect(result.low).toBe(1);
    expect(result.unknown).toBe(1);
  });

  it('returns correct severityDistribution - vulnerabilities is empty', () => {
    wrapper.vm.loadedVulnerabilityReport = {
      report: {
        summary: {
          critical: 0, high: 0, medium: 0, low: 0, unknown: 0
        },
        results: [
          { vulnerabilities: [] },
        ],
      },
    };
    const result = wrapper.vm.severityDistribution;

    expect(result.critical).toBe(0);
    expect(result.high).toBe(0);
    expect(result.medium).toBe(0);
    expect(result.low).toBe(0);
    expect(result.unknown).toBe(0);
  });

  // it('updates cachedFilteredVulnerabilities when filters are applied', async() => {
  //   Object.defineProperty(wrapper.vm, 'vulnerabilityDetails', {
  //     get: () => [
  //       {
  //         cveId:          'CVE-2025-0001',
  //         score:          '9.8 (CVSS v3)',
  //         package:        'openssl',
  //         fixAvailable:   true,
  //         severity:       'high',
  //         exploitability: 'Affected',
  //       },
  //       {
  //         cveId:          'CVE-2025-0002',
  //         score:          '4.2 (CVSS v3)',
  //         package:        'bash',
  //         fixAvailable:   false,
  //         severity:       'low',
  //         exploitability: 'Suppressed',
  //       },
  //     ],
  //   });

  //   wrapper.vm.filters = {
  //     cveSearch:      '0001',
  //     scoreMin:       '5',
  //     scoreMax:       '9.9',
  //     fixAvailable:   'any',
  //     severity:       'any',
  //     exploitability: 'any',
  //     packageSearch:  'ssl',
  //   };

  //   wrapper.vm.updateFilteredVulnerabilities();
  //   await nextTick();

  //   expect(wrapper.vm.cachedFilteredVulnerabilities).toHaveLength(1);
  //   expect(wrapper.vm.cachedFilteredVulnerabilities[0].cveId).toBe('CVE-2025-0001');
  // });

  // it('updates cachedFilteredVulnerabilities when filters are applied - fixAvailable, severity, exploitability are not any', async() => {
  //   Object.defineProperty(wrapper.vm, 'vulnerabilityDetails', {
  //     get: () => [
  //       {
  //         cveId:          'CVE-2025-0001',
  //         score:          '9.8 (CVSS v3)',
  //         package:        'openssl',
  //         fixAvailable:   true,
  //         severity:       'high',
  //         exploitability: 'Affected',
  //       },
  //       {
  //         cveId:          'CVE-2025-0002',
  //         score:          '4.2 (CVSS v3)',
  //         package:        'bash',
  //         fixAvailable:   false,
  //         severity:       'low',
  //         exploitability: 'Suppressed',
  //       },
  //     ],
  //   });

  //   wrapper.vm.filters = {
  //     cveSearch:      '',
  //     scoreMin:       '',
  //     scoreMax:       '',
  //     fixAvailable:   'available',
  //     severity:       'high',
  //     exploitability: 'affected',
  //     packageSearch:  '',
  //   };

  //   wrapper.vm.updateFilteredVulnerabilities();
  //   await nextTick();

  //   expect(wrapper.vm.cachedFilteredVulnerabilities).toHaveLength(1);
  //   expect(wrapper.vm.cachedFilteredVulnerabilities[0].cveId).toBe('CVE-2025-0001');
  // });

  // it('filters by severity via filterBySeverity method', () => {
  //   wrapper.vm.filterBySeverity('critical');
  //   expect(wrapper.vm.filters.severity).toBe('critical');
  // });

  it('calls loadImageData without errors', async() => {
    mockStore.getters['cluster/all']
      .mockReturnValueOnce(() => [{ metadata: { name: 'test-image' }, imageMetadata: {} }])
      .mockReturnValueOnce(() => [])
      .mockReturnValueOnce(() => []);

    await wrapper.vm.loadImageData();
    expect(mockStore.dispatch).toHaveBeenCalled();
  });

  it('computes overallSeverity based on vulnerability distribution', () => {
    wrapper.vm.loadedVulnerabilityReport = {
      report: {
        summary: {
          critical: 1, high: 0, medium: 0, low: 0, unknown: 0
        },
        results: [{ vulnerabilities: [{ }] }]
      }
    };
    expect(wrapper.vm.overallSeverity).toBe('critical');
  });

  it('computes overallSeverity based on vulnerability distribution - severity is empty', () => {
    wrapper.vm.loadedVulnerabilityReport = {
      report: {
        summary: {
          critical: 0, high: 0, medium: 0, low: 0, unknown: 0
        },
        results: [{ vulnerabilities: [{ }] }]
      }
    };
    expect(wrapper.vm.overallSeverity).toBe('none');
  });

  it('computes overallSeverity based on vulnerability distribution - severity is empty', () => {
    wrapper.vm.loadedVulnerabilityReport = null;
    const result = wrapper.vm.severityDistribution;

    expect(result.critical).toBe(0);
    expect(result.high).toBe(0);
    expect(result.medium).toBe(0);
    expect(result.low).toBe(0);
    expect(result.unknown).toBe(0);
  });

  it('should generate CSV with correct headers', () => {
    const result = wrapper.vm.generateCSVFromVulnerabilityReport([]);

    expect(result.startsWith(
      'IMAGE REFERENCE,REGISTRY,REPOSITORY,PLATFORM,DIGEST,IN USE,WORKLOAD COUNT,CVE_ID,SCORE,SEVERITY,PACKAGE,FIX AVAILABLE,FIXED VERSION,EXPLOITABILITY,VEX STATEMENT,PACKAGE VERSION,PACKAGE PATH,DESCRIPTION'
    )).toBe(true);
  });

  it('should generate correct CSV row', () => {
    wrapper.vm.workloads = [{ name: 'w1' }, { name: 'w2' }];

    const data = [
      {
        cveId:            'CVE-2023-1234',
        score:            '9.8',
        package:          'test-package',
        fixVersion:       '1.2.4',
        severity:         'CRITICAL',
        exploitability:   'High',
        installedVersion: '1.2.3',
        packagePath:      '/usr/lib/test-package',
        description:      'Test vulnerability'
      }
    ];

    const result = wrapper.vm.generateCSVFromVulnerabilityReport(data);

    expect(result).toContain('"docker.io/nginx:latest"');
    expect(result).toContain('"demo-02"');
    expect(result).toContain('"nginx"');
    expect(result).toContain('"TRUE"');
    expect(result).toContain('""');
    expect(result).toContain('"2"');
    expect(result).toContain('"CVE-2023-1234"');
    expect(result).toContain('"9.8"');
    expect(result).toContain('"test-package"');
    expect(result).toContain('"1.2.4"');
    expect(result).toContain('"CRITICAL"');
    expect(result).toContain('"High"');
    expect(result).toContain('"1.2.3"');
    expect(result).toContain('"/usr/lib/test-package"');
    expect(result).toContain('"Test vulnerability"');
  });

  it('should replace double quotes in description with single quotes', () => {
    const data = [
      { description: 'A "critical" issue' }
    ];

    const result = wrapper.vm.generateCSVFromVulnerabilityReport(data);

    expect(result).toContain('"A \'critical\' issue"');
  });

  it('should replace newlines in description with spaces', () => {
    const data = [
      { description: 'Line1\nLine2\r\nLine3' }
    ];

    const result = wrapper.vm.generateCSVFromVulnerabilityReport(data);

    expect(result).toContain('"Line1 Line2 Line3"');
  });

  it('should fallback to empty string for missing fields', () => {
    const data = [{}];

    const result = wrapper.vm.generateCSVFromVulnerabilityReport(data);

    // Row still includes populated image/context fields; vulnerability fields fallback to empty strings
    expect(result).toContain('"docker.io/nginx:latest"');
    expect(result).toContain('"demo-02"');
    expect(result).toContain('"nginx"');
    expect(result).toContain('"FALSE"');
    expect(result).toContain('"0"');
    expect(result).toContain('"","","","","","","","","","",""');
  });

  it('should generate multiple rows correctly', () => {
    const data = [
      { cveId: 'CVE-1' },
      { cveId: 'CVE-2' }
    ];

    const result = wrapper.vm.generateCSVFromVulnerabilityReport(data);
    const rows = result.split('\n');

    expect(rows.length).toBe(3); // header + 2 rows
    expect(rows[1]).toContain('"CVE-1"');
    expect(rows[2]).toContain('"CVE-2"');
  });

  it('should generate workloads CSV with required headers', () => {
    const result = wrapper.vm.generateCSVFromWorkloadsReport([]);

    expect(result.startsWith(
      'IMAGE REFERENCE,REGISTRY,REPOSITORY,PLATFORM,DIGEST,WORKLOAD NAME,TYPE,NAMESPACE,IMAGES USED,AFFECTING CVEs,CVEs(Critical),CVEs(High),CVEs(Medium),CVEs(Low),CVEs(None)'
    )).toBe(true);
  });

  it('should generate workloads CSV row with summary counts', () => {
    const workloads = [
      {
        name:       'cert-manager',
        namespace:  'cert-manager',
        type:       'Deployment',
        imagesUsed: 14,
        summary:    {
          critical: 1,
          high:     3,
          medium:   5,
          low:      10,
          unknown:  0
        }
      }
    ];

    const result = wrapper.vm.generateCSVFromWorkloadsReport(workloads);

    expect(result).toContain('"docker.io/nginx:latest"');
    expect(result).toContain('"demo-02"');
    expect(result).toContain('"nginx"');
    expect(result).toContain('"cert-manager"');
    expect(result).toContain('"Deployment"');
    expect(result).toContain('"14"');
    expect(result).toContain('"19"');
    expect(result).toContain('"1"');
    expect(result).toContain('"3"');
    expect(result).toContain('"5"');
    expect(result).toContain('"10"');
    expect(result).toContain('"0"');
  });
});
