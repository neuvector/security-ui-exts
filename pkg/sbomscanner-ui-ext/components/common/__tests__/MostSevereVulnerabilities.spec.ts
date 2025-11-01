import { shallowMount, RouterLinkStub } from '@vue/test-utils';
import MostSevereVulnerabilities from '../MostSevereVulnerabilities.vue';
import { PRODUCT_NAME, PAGE } from '@pkg/types';

const mockReport = {
  report: {
    results: [
      {
        vulnerabilities: [
          {
            cve: 'CVE-LOW', packageName: 'pkg-low', severity: 'low', cvss: {}, fixedVersions: []
          },
          {
            cve: 'CVE-CRIT-1', packageName: 'pkg-crit-1', severity: 'critical', cvss: { nvd: { v3score: '9.8' } }, fixedVersions: ['1.1']
          },
          {
            cve: 'CVE-MED', packageName: 'pkg-med', severity: 'medium', cvss: { ghsa: { v3score: '5.0' } }, fixedVersions: null
          },
          {
            cve: 'CVE-CRIT-2', packageName: 'pkg-crit-2', severity: 'critical', cvss: { nvd: { v3score: '7.5' } }, fixedVersions: []
          },
          {
            cve: 'CVE-HIGH', packageName: 'pkg-high', severity: 'high', cvss: { redhat: { v3score: '8.0' } }, fixedVersions: ['2.0']
          },
          {
            cve: 'CVE-NONE', packageName: 'pkg-none', severity: 'none', cvss: {}, fixedVersions: []
          },
          {
            cve: 'CVE-CRIT-3', packageName: 'pkg-crit-3', severity: 'critical', cvss: { nvd: { v3score: '9.0' } }, fixedVersions: []
          },
          {
            cve: 'CVE-NULL-SEV', packageName: 'pkg-null-sev', severity: null, cvss: {}, fixedVersions: []
          }
        ]
      }
    ]
  }
};

const fallbackReport = {
  vulnerabilities: [
    {
      cve: 'CVE-FB-1', packageName: 'pkg-fb-1', severity: 'high', cvss: { nvd: { v3score: '8.8' } }, fixedVersions: ['1.0']
    },
  ]
};

const reportWithNoScore = {
  report: {
    results: [{
      vulnerabilities: [{
        cve: 'CVE-NO-SCORE', packageName: 'pkg-no-score', severity: 'low', cvss: {}, fixedVersions: []
      }]
    }]
  }
};

const createWrapper = (propsData) => {
  return shallowMount(MostSevereVulnerabilities, {
    propsData,
    global: {
      mocks: {
        t:      (key) => key,
        $route: { params: { cluster: 'c-12345' } }
      },
      stubs: {
        RouterLink:       RouterLinkStub,
        ScoreBadge:       true,
        InfoTooltip:      true,
        FixAvailableIcon: true,
      }
    }
  });
};

describe('MostSevereVulnerabilities.vue', () => {
  describe('computed: mostSevereVulnerabilities', () => {
    it('should return an empty array if report is null or empty', () => {
      const wrapperNull = createWrapper({ vulnerabilityReport: null });

      expect(wrapperNull.vm.mostSevereVulnerabilities).toEqual([]);

      const wrapperEmpty = createWrapper({ vulnerabilityReport: {} });

      expect(wrapperEmpty.vm.mostSevereVulnerabilities).toEqual(
        [
          {
            cveId:        '',
            fixAvailable: null,
            package:      '',
            score:        '',
            severity:     null,
          },
          {
            cveId:        '',
            fixAvailable: null,
            package:      '',
            score:        '',
            severity:     null,
          },
          {
            cveId:        '',
            fixAvailable: null,
            package:      '',
            score:        '',
            severity:     null,
          },
          {
            cveId:        '',
            fixAvailable: null,
            package:      '',
            score:        '',
            severity:     null,
          },
          {
            cveId:        '',
            fixAvailable: null,
            package:      '',
            score:        '',
            severity:     null,
          },

        ]
      );

      const wrapperEmptyResults = createWrapper({ vulnerabilityReport: { report: { results: [] } } });

      expect(wrapperEmptyResults.vm.mostSevereVulnerabilities).toEqual([
        {
          cveId:        '',
          fixAvailable: null,
          package:      '',
          score:        '',
          severity:     null,
        },
        {
          cveId:        '',
          fixAvailable: null,
          package:      '',
          score:        '',
          severity:     null,
        },
        {
          cveId:        '',
          fixAvailable: null,
          package:      '',
          score:        '',
          severity:     null,
        },
        {
          cveId:        '',
          fixAvailable: null,
          package:      '',
          score:        '',
          severity:     null,
        },
        {
          cveId:        '',
          fixAvailable: null,
          package:      '',
          score:        '',
          severity:     null,
        },
      ]);
    });

    it('should use fallback vulnerabilities if report.results is empty', () => {
      const wrapper = createWrapper({ vulnerabilityReport: fallbackReport });
      const computed = wrapper.vm.mostSevereVulnerabilities;

      expect(computed.length).toBe(5);
      expect(computed[0].cveId).toBe('CVE-FB-1');
      expect(computed[0].package).toBe('pkg-fb-1');
      expect(computed[0].score).toBe('8.8 (CVSS v3)');
      expect(computed[0].fixAvailable).toBe(true);

      expect(computed[1].cveId).toBe('');
      expect(computed[2].cveId).toBe('');
      expect(computed[3].cveId).toBe('');
      expect(computed[4].cveId).toBe('');
    });

    it('should sort vulnerabilities by severity and then by score', () => {
      const wrapper = createWrapper({ vulnerabilityReport: mockReport });
      const computed = wrapper.vm.mostSevereVulnerabilities;
      const cveIds = computed.map((v) => v.cveId);

      expect(cveIds).toEqual([
        'CVE-CRIT-1',
        'CVE-CRIT-3',
        'CVE-CRIT-2',
        'CVE-HIGH',
        'CVE-MED'
      ]);
    });

    it('should limit the list to 5 vulnerabilities', () => {
      const wrapper = createWrapper({ vulnerabilityReport: mockReport });
      const computed = wrapper.vm.mostSevereVulnerabilities;

      expect(computed.length).toBe(5);
      expect(wrapper.findAll('.row').length).toBe(5);
    });

    it('should correctly format the UI data object', () => {
      const wrapper = createWrapper({ vulnerabilityReport: mockReport });
      const firstVuln = wrapper.vm.mostSevereVulnerabilities[0];

      expect(firstVuln).toEqual({
        cveId:        'CVE-CRIT-1',
        score:        '9.8 (CVSS v3)',
        severity:     'critical',
        package:      'pkg-crit-1',
        fixAvailable: true
      });

      const secondVuln = wrapper.vm.mostSevereVulnerabilities[2];

      expect(secondVuln.fixAvailable).toBe(false);

      const thirdVuln = wrapper.vm.mostSevereVulnerabilities[4];

      expect(thirdVuln.fixAvailable).toBe(null);
    });

    it('should correctly determine score string from nvd, redhat, or ghsa', () => {
      const wrapper = createWrapper({ vulnerabilityReport: mockReport });
      const computed = wrapper.vm.mostSevereVulnerabilities;

      expect(computed[0].score).toBe('9.8 (CVSS v3)');
      expect(computed[3].score).toBe('8.0 (CVSS v3)');
      expect(computed[4].score).toBe('5.0 (CVSS v3)');
    });

    it('should return an empty score string if no score is present', () => {
      const wrapper = createWrapper({ vulnerabilityReport: reportWithNoScore });
      const computed = wrapper.vm.mostSevereVulnerabilities;

      expect(computed[0].score).toBe('');
    });

    it('should use the default prop and render nothing if no report is provided', () => {
      const wrapper = createWrapper(undefined);

      expect(wrapper.vm.vulnerabilityReport).toEqual({});

      expect(wrapper.vm.mostSevereVulnerabilities).toEqual([
        {
          cveId:        '',
          fixAvailable: null,
          package:      '',
          score:        '',
          severity:     null,
        },
        {
          cveId:        '',
          fixAvailable: null,
          package:      '',
          score:        '',
          severity:     null,
        },
        {
          cveId:        '',
          fixAvailable: null,
          package:      '',
          score:        '',
          severity:     null,
        },
        {
          cveId:        '',
          fixAvailable: null,
          package:      '',
          score:        '',
          severity:     null,
        },
        {
          cveId:        '',
          fixAvailable: null,
          package:      '',
          score:        '',
          severity:     null,
        },
      ]);

      expect(wrapper.findAll('.row').length).toBe(5);
    });
  });

  describe('rendering', () => {
    let wrapper: any;

    beforeEach(() => {
      wrapper = createWrapper({ vulnerabilityReport: mockReport });
    });

    it('should render the correct CVE and link', () => {
      const link = wrapper.findComponent(RouterLinkStub);

      expect(link.exists()).toBe(true);
      expect(link.text()).toBe('CVE-CRIT-1');
      const expectedPath = `/c/c-12345/${ PRODUCT_NAME }/${ PAGE.VULNERABILITIES }/CVE-CRIT-1`;

      expect(link.props('to')).toBe(expectedPath);
    });

    it('should render the ScoreBadge with correct props', () => {
      const scoreBadge = wrapper.findComponent('score-badge-stub');

      expect(scoreBadge.exists()).toBe(true);
      expect(scoreBadge.props('score')).toBe('9.8');
      expect(scoreBadge.props('scoreType')).toBe('CVSS');
      expect(scoreBadge.props('severity')).toBe('critical');
    });

    it('should render the package name', () => {
      const firstRow = wrapper.find('.row');

      expect(firstRow.find('.col.span-4:nth-of-type(3)').text()).toBe('pkg-crit-1');
    });

    it('should render FixAvailableIcon with fixAvailable=true', () => {
      const icon = wrapper.findComponent('fix-available-icon-stub');

      expect(icon.exists()).toBe(true);
      expect(icon.props('fixAvailable')).toBe(true);
    });

    it('should render FixAvailableIcon with fixAvailable=false', () => {
      const allIcons = wrapper.findAllComponents('fix-available-icon-stub');
      const icon = allIcons.at(2);

      expect(icon.props('fixAvailable')).toBe(false);
    });

    it('should render n/a badge when no score is present', () => {
      const noScoreWrapper = createWrapper({ vulnerabilityReport: reportWithNoScore });
      const row = noScoreWrapper.find('.row');

      expect(row.find('score-badge-stub').exists()).toBe(false);
      expect(row.find('.na-badge').exists()).toBe(true);
      expect(row.find('.na-badge').text()).toBe('n/a');
    });

    it('should render for severity is null', () => {
      const noScoreWrapper = createWrapper({
        vulnerabilityReport: {report: {
    results: [{
      vulnerabilities: [{
          cve: 'CVE-CRIT-3', packageName: 'pkg-crit-3', cvss: { nvd: { v3score: '9.0' } }, fixedVersions: []
        }]}]
      }}});
      const row = noScoreWrapper.find('.row');

      expect(row.find('score-badge-stub').exists()).toBe(true);
      expect(row.find('.na-badge').exists()).toBe(false);
    });
  });
});
