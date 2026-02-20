import { shallowMount, RouterLinkStub } from '@vue/test-utils';
import ImageInUsePoppedDetail from '../ImageInUsePoppedDetail.vue';

describe('ImageInUsePoppedDetail.vue', () => {
  const createWrapper = (props = {}) => {
    return shallowMount(ImageInUsePoppedDetail, {
      props: {
        count: 0,
        link: { name: 'test-route' },
        ...props
      },
      global: {
        mocks: {
          t: (key, params) => params ? `${key} count:${params.count}` : key
        },
        stubs: {
          RouterLink: RouterLinkStub,
          FixAspectRatio: true
        }
      }
    });
  };

  describe('When count is 0 (Not in use)', () => {
    let wrapper;

    beforeEach(() => {
      wrapper = createWrapper({ count: 0 });
    });

    it('renders the FixAvailableIcon with fixAvailable as false', () => {
      const fixIcon = wrapper.findComponent({ name: 'FixAvailableIcon' });

      expect(fixIcon.exists()).toBe(true);
      expect(fixIcon.props('fixAvailable')).toBe(false);
    });

    it('does not render the count number', () => {
      expect(wrapper.find('.count').exists()).toBe(false);
    });

    it('does not render the hover popup overlay', () => {
      expect(wrapper.find('.hover-overlay').exists()).toBe(false);
    });
  });

  describe('When count is 1 (In use - Singular)', () => {
    let wrapper;

    beforeEach(() => {
      wrapper = createWrapper({ count: 1, link: { path: '/test/workload' } });
    });

    it('renders the FixAvailableIcon with fixAvailable as true', () => {
      const fixIcon = wrapper.findComponent({ name: 'FixAvailableIcon' });

      expect(fixIcon.exists()).toBe(true);
      expect(fixIcon.props('fixAvailable')).toBe(true);
    });

    it('renders the count number', () => {
      const countSpan = wrapper.find('.count');
      expect(countSpan.exists()).toBe(true);
      expect(countSpan.text()).toBe('1');
    });

    it('renders the hover popup with the singular tooltip translation', () => {
      const popupText = wrapper.find('.popup-text');
      expect(popupText.exists()).toBe(true);
      expect(popupText.text()).toContain('imageScanner.images.listTable.popup.inUseTooltipSingle');
      expect(popupText.text()).toContain('count:1'); // Our mock t() appends this
    });

    it('passes the link prop to the RouterLink component', () => {
      const routerLink = wrapper.findComponent(RouterLinkStub);

      expect(routerLink.exists()).toBe(true);
      expect(routerLink.props('to')).toEqual({ path: '/test/workload' });
    });
  });

  describe('When count is greater than 1 (In use - Plural)', () => {
    it('renders the popup with the plural tooltip translation', () => {
      const wrapper = createWrapper({ count: 5 });
      const popupText = wrapper.find('.popup-text');

      expect(popupText.text()).toContain('imageScanner.images.listTable.popup.inUseTooltipPlural');
      expect(popupText.text()).toContain('count:5');
    });
  });

  describe('Hover and Positioning Logic (checkPosition)', () => {
    let wrapper;
    let originalInnerHeight;

    beforeAll(() => {
      originalInnerHeight = window.innerHeight;
      Object.defineProperty(window, 'innerHeight', { writable: true, configurable: true, value: 1000 });
    });

    afterAll(() => {
      Object.defineProperty(window, 'innerHeight', { writable: true, configurable: true, value: originalInnerHeight });
    });

    beforeEach(() => {
      wrapper = createWrapper({ count: 2 });
    });

    it('defaults to showOnTop = false', () => {
      expect(wrapper.vm.showOnTop).toBe(false);
      expect(wrapper.find('.hover-overlay').classes()).not.toContain('show-top');
    });

    it('sets showOnTop to true if space below trigger is less than 90px', async () => {
      wrapper.vm.$refs.trigger.getBoundingClientRect = () => ({ bottom: 950 }); // 1000 - 950 = 50px remaining

      await wrapper.trigger('mouseenter');

      expect(wrapper.vm.showOnTop).toBe(true);
      expect(wrapper.find('.hover-overlay').classes()).toContain('show-top');
    });

    it('keeps showOnTop as false if space below trigger is greater than or equal to 90px', async () => {
      wrapper.vm.$refs.trigger.getBoundingClientRect = () => ({ bottom: 500 }); // 1000 - 500 = 500px remaining

      await wrapper.trigger('mouseenter');

      expect(wrapper.vm.showOnTop).toBe(false);
      expect(wrapper.find('.hover-overlay').classes()).not.toContain('show-top');
    });

    it('resets showOnTop to false on mouseleave', async () => {
      wrapper.vm.showOnTop = true;
      await wrapper.vm.$nextTick();

      await wrapper.trigger('mouseleave');

      expect(wrapper.vm.showOnTop).toBe(false);
    });
  });
});