import { shallowMount } from '@vue/test-utils';
import VulnerabilityHoverCell from '../AmountBarBySeverityPoppedDetail.vue';

const AmountBarBySeverityStub = {
  template: '<div class="amount-bar-stub"></div>',
  props:    ['cveAmount', 'isCollapsed']
};

const RouterLinkStub = {
  template: '<a class="router-link-stub"><slot /></a>',
  props:    ['to']
};

describe('VulnerabilityHoverCell.vue', () => {
  const defaultCve = {
    critical: 10,
    high:     20,
    medium:   10,
    low:      10,
    unknown:  0
  };

  const createWrapper = (props = {}) => {
    return shallowMount(VulnerabilityHoverCell, {
      props: {
        cveAmount: defaultCve,
        ...props
      },
      global: {
        stubs: {
          AmountBarBySeverity: AmountBarBySeverityStub,
          RouterLink:          RouterLinkStub
        },
        mocks: { t: (key: string) => key } // simple i18n mock
      }
    });
  };

  it('renders correctly', () => {
    const wrapper = createWrapper();

    expect(wrapper.exists()).toBe(true);
    expect(wrapper.find('.trigger-bar').exists()).toBe(true);
  });

  describe('Computed Properties', () => {
    it('calculates totalVulnerabilities correctly', () => {
      const wrapper = createWrapper({
        cveAmount: {
          critical: 1, high: 2, medium: 3, low: 4, unknown: 0
        }
      });

      expect((wrapper.vm as any).totalVulnerabilities).toBe(10);
    });

    it('handles string inputs in cveAmount gracefully', () => {
      const wrapper = createWrapper({
        cveAmount: {
          critical: '5', high: '5', medium: 0, low: 0, unknown: 0
        }
      });

      expect((wrapper.vm as any).totalVulnerabilities).toBe(10);
    });

    it('getPercentage() calculates correct width %', () => {
      const wrapper = createWrapper();
      const vm = wrapper.vm as any;

      expect(vm.getPercentage('critical')).toBe(20);
      expect(vm.getPercentage('high')).toBe(40);
      expect(vm.getPercentage('unknown')).toBe(0);
    });

    it('getPercentage() returns 0 if total is 0', () => {
      const wrapper = createWrapper({
        cveAmount: {
          critical: 0, high: 0, medium: 0, low: 0, unknown: 0
        }
      });

      expect((wrapper.vm as any).getPercentage('critical')).toBe(0);
    });
  });

  describe('Rendering Content', () => {
    it('displays default header title with count when no title prop provided', () => {
      const wrapper = createWrapper();
      const title = wrapper.find('.title');

      expect(title.text()).toBe(
        '50 imageScanner.images.listTable.filters.placeholder.affectedCVEs'
      );
    });

    it('displays custom headerTitle when provided', () => {
      const wrapper = createWrapper({ headerTitle: 'Custom Report' });

      expect(wrapper.find('.title').text()).toBe('Custom Report');
    });

    it('renders "View all" link only when viewAllLink prop exists', () => {
      const wrapper = createWrapper({ viewAllLink: '/details#vulnerabilitites' });

      const link = wrapper.findComponent(RouterLinkStub);

      expect(link.exists()).toBe(true);

      expect(link.props('to')).toEqual({
        path:  '/details',
        hash:  '#vulnerabilitites',
        query: { defaultTab: 'affectingCVEs' }
      });
    });

    it('does NOT render "View all" link if prop is missing', () => {
      const wrapper = createWrapper({ viewAllLink: '' });

      expect(wrapper.find('.view-all').exists()).toBe(false);
    });

    it('renders the footer provider name', () => {
      const wrapper = createWrapper({ footerProvider: 'My Scanner' });

      expect(wrapper.find('.provider-name').text()).toBe('My Scanner');
    });

    it('renders exactly 5 severity rows with correct labels', () => {
      const wrapper = createWrapper();
      const rows = wrapper.findAll('.severity-row');

      expect(rows.length).toBe(5);
      expect(rows[0].find('.label').text()).toBe('Critical');
      expect(rows[4].find('.label').text()).toBe('None');
    });

    it('applies disabled-link class when severity count is 0', () => {
      const wrapper = createWrapper();
      const rows = wrapper.findAll('.severity-row');

      expect(rows[4].find('.label').classes()).toContain('disabled-link');
      expect(rows[0].find('.label').classes()).not.toContain('disabled-link');
    });

    it('applies disabled-link class to all severities when all values are 0', () => {
      const wrapper = createWrapper({
        cveAmount: {
          critical: 0,
          high:     0,
          medium:   0,
          low:      0,
          unknown:  0
        }
      });

      const labels = wrapper.findAll('.severity-row .label');

      expect(labels).toHaveLength(5);
      labels.forEach((label) => {
        expect(label.classes()).toContain('disabled-link');
      });
    });

    it('applies correct width style to progress bars', () => {
      const wrapper = createWrapper();
      const criticalBar = wrapper.find('.progress-bar.critical');

      expect(criticalBar.attributes('style')).toContain('width: 20%');
    });
  });

  describe('Interactions & Logic', () => {
    it('emits "view-all" event when View All link is clicked', async() => {
      const wrapper = createWrapper({ viewAllLink: '#' });

      await wrapper.find('.view-all').trigger('click');

      expect(wrapper.emitted('view-all')).toBeTruthy();
      expect(wrapper.emitted('view-all')).toHaveLength(1);
    });

    it('toggles "showOnTop" based on viewport calculation', async() => {
      const wrapper = createWrapper();
      const vm = wrapper.vm as any;

      Object.defineProperty(window, 'innerHeight', {
        writable:     true,
        configurable: true,
        value:        1000
      });

      Element.prototype.getBoundingClientRect = jest.fn(() => ({
        bottom: 100,
        top:    0,
        left:   0,
        right:  0,
        width:  0,
        height: 0
      } as DOMRect));

      await wrapper.find('.vulnerability-hover-cell').trigger('mouseenter');

      expect(vm.showOnTop).toBe(false);
      expect(wrapper.find('.hover-overlay').classes()).not.toContain('show-top');

      Element.prototype.getBoundingClientRect = jest.fn(() => ({
        bottom: 900,
        top:    0,
        left:   0,
        right:  0,
        width:  0,
        height: 0
      } as DOMRect));

      await wrapper.find('.vulnerability-hover-cell').trigger('mouseenter');
      await wrapper.vm.$nextTick();

      expect(vm.showOnTop).toBe(true);
      expect(wrapper.find('.hover-overlay').classes()).toContain('show-top');
    });
  });

  describe('getSeverityLink() method', () => {
    it('returns empty string when viewAllLink is not provided', () => {
      const wrapper = createWrapper({ viewAllLink: '' });
      const result = (wrapper.vm as any).getSeverityLink('Critical');

      expect(result).toBe('');
    });

    it('returns route object with path, hash, and query for link with hash', () => {
      const wrapper = createWrapper({ viewAllLink: '/path/to/page#vulnerabilities' });
      const result = (wrapper.vm as any).getSeverityLink('Critical');

      expect(result).toEqual({
        path:  '/path/to/page',
        hash:  '#vulnerabilities',
        query: {
          defaultTab: 'affectingCVEs',
          severity:   'Critical'
        }
      });
    });

    it('returns route object with path and query but no hash', () => {
      const wrapper = createWrapper({ viewAllLink: '/path/to/page' });
      const result = (wrapper.vm as any).getSeverityLink('High');

      expect(result).toEqual({
        path:  '/path/to/page',
        hash:  undefined,
        query: {
          defaultTab: 'affectingCVEs',
          severity:   'High'
        }
      });
    });

    it('preserves the hash fragment correctly', () => {
      const wrapper = createWrapper({ viewAllLink: '/workload/deployment#vulnerabilities' });
      const result = (wrapper.vm as any).getSeverityLink('Medium');

      expect(result.hash).toBe('#vulnerabilities');
    });

    it('creates correct query param for each severity level', () => {
      const wrapper = createWrapper({ viewAllLink: '/test#tab' });

      expect((wrapper.vm as any).getSeverityLink('Critical').query.severity).toBe('Critical');
      expect((wrapper.vm as any).getSeverityLink('High').query.severity).toBe('High');
      expect((wrapper.vm as any).getSeverityLink('Medium').query.severity).toBe('Medium');
      expect((wrapper.vm as any).getSeverityLink('Low').query.severity).toBe('Low');
      expect((wrapper.vm as any).getSeverityLink('None').query.severity).toBe('None');
    });

    it('handles complex paths with multiple segments', () => {
      const wrapper = createWrapper({ viewAllLink: '/c/local/explorer/apps.deployment/cert-manager/cert-manager#vulnerabilities' });

      const result = (wrapper.vm as any).getSeverityLink('Critical');

      expect(result.path).toBe('/c/local/explorer/apps.deployment/cert-manager/cert-manager');
      expect(result.hash).toBe('#vulnerabilities');
      expect(result.query).toEqual({
        defaultTab: 'affectingCVEs',
        severity:   'Critical'
      });
    });
  });
});
