import { jest } from '@jest/globals';
import { shallowMount, flushPromises } from '@vue/test-utils';
import CveDetails from '../CveDetails.vue';
import { BadgeState } from '@components/BadgeState';
import { PRODUCT_NAME, RESOURCE, PAGE } from '@pkg/types';
import { NVD_BASE_URL, CVSS_VECTOR_BASE_URL } from '@pkg/constants';

jest.mock('@pkg/types', () => ({
  PRODUCT_NAME: 'test-product',
  RESOURCE:     { VULNERABILITY_REPORT: 'vuln.report' },
  PAGE:         { VULNERABILITIES: 'test-vulns' }
}));

jest.mock('@pkg/constants', () => ({
  NVD_BASE_URL:         'https://nvd.nist.gov/vuln/detail/',
  CVSS_VECTOR_BASE_URL: 'https://www.first.org/cvss/calculator/'
}));

const mockCveId = 'CVE-2023-1234';

const mockVulReports = [
  {
    report: {
      results: [
        {
          vulnerabilities: [
            { cve: 'CVE-2023-0001', severity: 'LOW' },
            {
              cve:        mockCveId,
              severity:   'CRITICAL',
              title:      'A very bad bug',
              references: [
                'https://nvd.nist.gov/some-link',
                'https://www.redhat.com/security/advisories/RHSA-2023-1234',
                'https://github.com/advisory/GHSA-1234'
              ],
              cvss: {
                nvd: {
                  v3score:  9.8,
                  v3vector: 'CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H',
                  v2score:  7.5
                },
                redhat: {
                  v3score:  8.1,
                  v3vector: 'CVSS:3.0/AV:L/AC:L/PR:N/UI:R/S:U/C:H/I:H/A:H',
                  v2score:  6.8
                }
              }
            }
          ]
        }
      ]
    }
  },
  { report: { results: [] } }
];

describe('CveDetails.vue', () => {
  let wrapper;
  let mockDispatch;
  let mockRoute;
  let mockT;
  let loadDataSpy;

  const safeLoadData = async function() {
    const vulReport = await this.$store.dispatch('cluster/findAll', { type: RESOURCE.VULNERABILITY_REPORT });
    const cveId = this.$route.params.id;
    const { cveMetaData, totalScanned } = this.getCveMetaData(vulReport, cveId);

    this.totalScanned = totalScanned;

    this.cveDetail = {
      id:              cveId,
      severity:        'unknown',
      title:           '',
      score:           'n/a',
      totalImages:     totalScanned,
      sources:         [],
      advisoryVendors: [],
      cvssScores:      [],
      ...cveMetaData,
    };
  };

  const mountComponent = async(routeId = mockCveId, reports = mockVulReports) => {
    mockDispatch = jest.fn().mockResolvedValue(reports);
    mockRoute = { params: { id: routeId } };
    mockT = jest.fn((key) => {
      if (key === 'imageScanner.general.unknown') {
        return 'Unknown';
      }
      if (key.startsWith('imageScanner.enum.cve.')) {
        return key.split('.').pop();
      }

      return key;
    });

    loadDataSpy = jest.spyOn(CveDetails.methods, 'loadData').mockImplementation(safeLoadData);

    wrapper = shallowMount(CveDetails, {
      global: {
        mocks: {
          $store:  { dispatch: mockDispatch },
          $route:  mockRoute,
          t:       mockT,
        },
        stubs: { BadgeState: true }
      }
    });

    await flushPromises();
  };

  afterEach(() => {
    if (loadDataSpy) {
      loadDataSpy.mockRestore();
    }
    jest.clearAllMocks();
  });

  describe('Data Loading and Parsing', () => {
    beforeEach(async() => {
      await mountComponent();
    });

    it('should call findAll for VulnerabilityReports on load', () => {
      expect(mockDispatch).toHaveBeenCalledWith('cluster/findAll', { type: RESOURCE.VULNERABILITY_REPORT });
    });

    it('should set totalScanned correctly', () => {
      expect(wrapper.vm.totalScanned).toBe(mockVulReports.length);
    });

    it('should populate cveDetail with processed data', () => {
      const detail = wrapper.vm.cveDetail;

      expect(detail).toBeDefined();
      expect(detail.id).toBe(mockCveId);
      expect(detail.totalImages).toBe(2);
      expect(detail.severity).toBe('CRITICAL');
      expect(detail.title).toBe('A very bad bug');
      expect(detail.score).toBe('9.8 (v3)');
    });

    it('should handle CVE not found', async() => {
      await mountComponent('CVE-NOT-FOUND');

      const detail = wrapper.vm.cveDetail;

      expect(detail.id).toBe('CVE-NOT-FOUND');
      expect(detail.totalImages).toBe(2);
      expect(detail.severity).toBe('unknown');
      expect(detail.title).toBe('');
      expect(detail.score).toBe('n/a');
      expect(detail.sources).toEqual([]);
    });

    it('should handle empty reports', async() => {
      await mountComponent(mockCveId, []);
      const detail = wrapper.vm.cveDetail;

      expect(detail.id).toBe(mockCveId);
      expect(detail.totalImages).toBe(0);
      expect(detail.severity).toBe('unknown');
    });
  });

  describe('Helper Methods', () => {
    let vm;

    beforeEach(async() => {
      await mountComponent();
      vm = wrapper.vm;
    });

    describe('getV3Score', () => {
      it('should prioritize nvd', () => {
        const cvss = {
          nvd: { v3score: 9.8 }, redhat: { v3score: 8.1 }, ghsa: { v3score: 7.0 }
        };

        expect(vm.getV3Score(cvss)).toBe('9.8 (v3)');
      });
      it('should prioritize redhat if nvd is missing', () => {
        const cvss = { redhat: { v3score: 8.1 }, ghsa: { v3score: 7.0 } };

        expect(vm.getV3Score(cvss)).toBe('8.1 (v3)');
      });
      it('should prioritize ghsa if nvd/redhat are missing', () => {
        const cvss = { ghsa: { v3score: 7.0 } };

        expect(vm.getV3Score(cvss)).toBe('7 (v3)');
      });
      it('should return n/a if no v3score is found', () => {
        const cvss = { nvd: { v2score: 7.5 } };

        expect(vm.getV3Score(cvss)).toBe('n/a');
      });
    });

    describe('convertCvssToSources', () => {
      it('should create source list and link NVD', () => {
        const cvss = {
          nvd: {}, redhat: {}, ghsa: {}
        };
        const sources = vm.convertCvssToSources(cvss, 'CVE-123');

        expect(sources).toEqual([
          { name: 'NVD', link: `${ NVD_BASE_URL }CVE-123` },
          { name: 'REDHAT', link: '' },
          { name: 'GHSA', link: '' },
        ]);
      });
    });

    describe('convertCvss', () => {
      it('should convert cvss object to scores array with vector links', () => {
        const cvss = {
          nvd:    {
            v3score: 9.8, v2score: 7.5, v3vector: 'CVSS:3.1/AV:N'
          },
          redhat: { v3score: 8.1, v3vector: 'CVSS:3.0/AV:L' }
        };
        const scores = vm.convertCvss(cvss);

        expect(scores).toEqual([
          {
            source: 'Nvd v3score', score: 9.8, link: `${ CVSS_VECTOR_BASE_URL }3-1#CVSS:3.1/AV:N`
          },
          {
            source: 'Nvd v2score', score: 7.5, link: `${ CVSS_VECTOR_BASE_URL }3-1#CVSS:3.1/AV:N`
          },
          {
            source: 'Redhat v3score', score: 8.1, link: `${ CVSS_VECTOR_BASE_URL }3-0#CVSS:3.0/AV:L`
          },
        ]);
      });

      it('should handle missing vector', () => {
        const cvss = { nvd: { v3score: 9.8 } };
        const scores = vm.convertCvss(cvss);

        expect(scores[0].link).toBe('');
      });
    });

    describe('groupReferencesByDomain', () => {
      it('should group, strip www/subdomains, and capitalize', () => {
        const urls = [
          'https://www.redhat.com/a',
          'https://security.redhat.com/b',
          'https://nvd.nist.gov/c',
          'https://github.com/d'
        ];
        const groups = vm.groupReferencesByDomain(urls);

        expect(groups).toEqual(
          expect.arrayContaining([
            expect.objectContaining({ name: 'Redhat', references: ['https://www.redhat.com/a', 'https://security.redhat.com/b'] }),
            expect.objectContaining({ name: 'Nist', references: ['https://nvd.nist.gov/c'] }),
            expect.objectContaining({ name: 'Github', references: ['https://github.com/d'] })
          ])
        );
        expect(groups.length).toBe(3);
      });
    });
  });

  describe('Template Rendering', () => {
    beforeEach(async() => {
      await mountComponent();
    });

    it('should render the title and severity', () => {
      expect(wrapper.find('.resource-header-name').text()).toContain(mockCveId);
      const badge = wrapper.findComponent(BadgeState);

      expect(badge.exists()).toBe(true);
      expect(badge.props('label')).toBe('critical');
      expect(badge.props('color')).toBe('critical');
    });

    it('should render the description', () => {
      expect(wrapper.find('.description').text()).toBe('A very bad bug');
    });

    it('should render stats (score, images, sources)', () => {
      const values = wrapper.findAll('.value');

      expect(values.at(0).text()).toBe('9.8 (v3)');
      expect(values.at(1).text()).toBe('2');
      expect(values.at(2).text()).toContain('NVD');
      expect(values.at(2).text()).toContain('REDHAT');
      expect(values.at(2).find('a').attributes('href')).toBe(wrapper.vm.cveDetail.sources[0].link);
    });

    it('should render advisory vendors', () => {
      const values = wrapper.findAll('.value');

      expect(values.at(3).text()).toBe(String(wrapper.vm.cveDetail.advisoryVendors.length));
      const tags = wrapper.findAll('.vendor-tag');

      expect(tags.length).toBe(3);
      expect(tags.at(0).text()).toBe('Nist');
    });

    it('should render CVSS scores', () => {
      const values = wrapper.findAll('.value');

      expect(values.at(4).text()).toBe(String(wrapper.vm.cveDetail.cvssScores.length));
      const links = wrapper.findAll('.cvss-link');

      expect(links.length).toBe(4);
      expect(links.at(0).text()).toContain('Nvd v3score 9.8');
      expect(links.at(0).attributes('href')).toBe(wrapper.vm.cveDetail.cvssScores[0].link);
    });
  });

  describe('Template Rendering (Empty State)', () => {
    it('should render unknown for missing fields', async() => {
      await mountComponent('CVE-NOT-FOUND');
      const values = wrapper.findAll('.value');

      expect(wrapper.find('.description').text()).toBe('Unknown');
      expect(values.at(0).text()).toBe('n/a');
      expect(values.at(1).text()).toBe('2');
      expect(values.at(2).text()).toBe('Unknown');
      expect(values.at(3).text()).toBe('Unknown');
      expect(values.at(4).text()).toBe('Unknown');
    });
  });

  describe('User Interaction (Hover)', () => {
    beforeEach(async() => {
      await mountComponent();
    });

    it('should show hover panel on mouseenter vendor tag', async() => {
      expect(wrapper.vm.hoverVendor).toBe(null);
      expect(wrapper.find('.hover-panel').exists()).toBe(false);

      await wrapper.find('.vendor-tags-wrapper').trigger('mouseenter');
      expect(wrapper.vm.inside).toBe(true);

      await wrapper.find('.vendor-tag').trigger('mouseenter');

      expect(wrapper.vm.hoverVendor).toBe(wrapper.vm.cveDetail.advisoryVendors[0]);
      expect(wrapper.find('.hover-panel').exists()).toBe(true);
      expect(wrapper.find('.hover-panel h4').text()).toContain(mockCveId);
      expect(wrapper.find('.ref-url').attributes('href')).toBe(wrapper.vm.cveDetail.advisoryVendors[0].references[0]);
    });

    it('should hide hover panel on mouseleave wrapper', async() => {
      await wrapper.find('.vendor-tags-wrapper').trigger('mouseenter');
      await wrapper.find('.vendor-tag').trigger('mouseenter');
      expect(wrapper.find('.hover-panel').exists()).toBe(true);

      await wrapper.find('.vendor-tags-wrapper').trigger('mouseleave');

      expect(wrapper.vm.inside).toBe(false);
      expect(wrapper.vm.hoverVendor).toBe(null);
      expect(wrapper.find('.hover-panel').exists()).toBe(false);
    });
  });
});
