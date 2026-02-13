import { shallowMount } from '@vue/test-utils';
import VulnerabilityHoverCell from '../AmountBarBySeverityPoppedDetail.vue';

const AmountBarBySeverityStub = {
  template: '<div class="amount-bar-stub"></div>',
  props: ['cveAmount', 'isCollapsed']
};

describe('VulnerabilityHoverCell.vue', () => {
  const defaultCve = {
    critical: 10,
    high: 20,
    medium: 10,
    low: 10,
    unknown: 0
  };

  const createWrapper = (props = {}) => {
    return shallowMount(VulnerabilityHoverCell, {
      props: {
        cveAmount: defaultCve,
        ...props
      },
      global: {
        stubs: {
          AmountBarBySeverity: AmountBarBySeverityStub
        }
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
        cveAmount: { critical: 1, high: 2, medium: 3, low: 4, unknown: 0 } // Sum = 10
      });
      expect((wrapper.vm as any).totalVulnerabilities).toBe(10);
    });

    it('handles string inputs in cveAmount gracefully', () => {
      const wrapper = createWrapper({
        cveAmount: { critical: "5", high: "5", medium: 0, low: 0, unknown: 0 } // Sum = 10
      });
      expect((wrapper.vm as any).totalVulnerabilities).toBe(10);
    });

    it('getPercentage() calculates correct width %', () => {
      const wrapper = createWrapper({ cveAmount: defaultCve }); // Total 50
      const vm = wrapper.vm as any;

      expect(vm.getPercentage('critical')).toBe(20);
      expect(vm.getPercentage('high')).toBe(40);
      expect(vm.getPercentage('unknown')).toBe(0);
    });

    it('getPercentage() returns 0 if total is 0 (avoids NaN)', () => {
      const wrapper = createWrapper({
        cveAmount: { critical: 0, high: 0, medium: 0, low: 0, unknown: 0 }
      });
      expect((wrapper.vm as any).getPercentage('critical')).toBe(0);
    });
  });

  describe('Rendering Content', () => {
    it('displays default header title with count when no title prop provided', () => {
      const wrapper = createWrapper();
      const title = wrapper.find('.title');
      expect(title.text()).toContain('50 %imageScanner.images.listTable.headers.vulnerabilities%');
    });

    it('displays custom headerTitle when provided', () => {
      const wrapper = createWrapper({ headerTitle: 'Custom Report' });
      expect(wrapper.find('.title').text()).toBe('Custom Report');
    });

    it('renders "View all" link only when viewAllLink prop exists', () => {
      const wrapper = createWrapper({ viewAllLink: '/details' });
      const link = wrapper.find('a.view-all');

      expect(link.exists()).toBe(true);
      expect(link.attributes('href')).toBe('/details');
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
      expect(rows[4].find('.label').text()).toBe('None'); // Maps to 'unknown'
    });

    it('applies correct width style to progress bars', () => {
      const wrapper = createWrapper();
      const criticalBar = wrapper.find('.progress-bar.critical');
      expect(criticalBar.attributes('style')).toContain('width: 20%;');
    });
  });

  describe('Interactions & Logic', () => {
    it('emits "view-all" event when View All link is clicked', async () => {
      const wrapper = createWrapper({ viewAllLink: '#' });
      await wrapper.find('.view-all').trigger('click');

      expect(wrapper.emitted('view-all')).toBeTruthy();
      expect(wrapper.emitted('view-all')).toHaveLength(1);
    });

    it('toggles "showOnTop" (CSS class) based on viewport calculation', async () => {
      const wrapper = createWrapper();
      const vm = wrapper.vm as any;
      Object.defineProperty(window, 'innerHeight', {
        writable: true,
        configurable: true,
        value: 1000
      });
      Element.prototype.getBoundingClientRect = jest.fn(() => ({
        bottom: 100, // 900px remaining space ( > 300 threshold)
        top: 0, left: 0, right: 0, width: 0, height: 0
      } as DOMRect));

      await wrapper.find('.vulnerability-hover-cell').trigger('mouseenter');
      expect(vm.showOnTop).toBe(false);
      expect(wrapper.find('.hover-overlay').classes()).not.toContain('show-top');
      Element.prototype.getBoundingClientRect = jest.fn(() => ({
        bottom: 900, // 100px remaining space ( < 300 threshold)
        top: 0, left: 0, right: 0, width: 0, height: 0
      } as DOMRect));

      await wrapper.find('.vulnerability-hover-cell').trigger('mouseenter');
      expect(vm.showOnTop).toBe(true);

      await wrapper.vm.$nextTick();
      expect(wrapper.find('.hover-overlay').classes()).toContain('show-top');
    });
  });
});