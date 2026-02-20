import { shallowMount } from '@vue/test-utils';
import ImagesUsedCell from '../ImagesUsedCell.vue';
import { getWorkloadLink } from '@sbomscanner-ui-ext/utils/app';

jest.mock('@sbomscanner-ui-ext/utils/app', () => ({
  getWorkloadLink: jest.fn()
}));

const RouterLinkStub = {
  template: '<a class="router-link-stub"><slot /></a>',
  props: ['to']
};

describe('ImagesUsedCell.vue', () => {
  const defaultRow = {
    imagesUsed: 5
  };

  const createWrapper = (rowOverride = {}) => {
    return shallowMount(ImagesUsedCell, {
      props: {
        row: {
          ...defaultRow,
          ...rowOverride
        }
      },
      global: {
        stubs: {
          RouterLink: RouterLinkStub
        },
        mocks: {
          $route: {
            params: { cluster: 'local' }
          }
        }
      }
    });
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly', () => {
    const wrapper = createWrapper();

    expect(wrapper.exists()).toBe(true);
    expect(wrapper.find('.images-used-cell').exists()).toBe(true);
  });

  describe('imagesUsed computed', () => {
    it('returns imagesUsed value from row', () => {
      const wrapper = createWrapper({ imagesUsed: 8 });

      expect((wrapper.vm as any).imagesUsed).toBe(8);
    });

    it('returns 0 if imagesUsed is undefined', () => {
      const wrapper = createWrapper({ imagesUsed: undefined });

      expect((wrapper.vm as any).imagesUsed).toBe(0);
    });

    it('returns 0 if imagesUsed is null', () => {
      const wrapper = createWrapper({ imagesUsed: null });

      expect((wrapper.vm as any).imagesUsed).toBe(0);
    });
  });

  describe('imagesUsedLink computed', () => {
    it('calls getWorkloadLink with correct arguments', () => {
      (getWorkloadLink as jest.Mock).mockReturnValue('/mocked-link');

      const wrapper = createWrapper();

      expect(getWorkloadLink).toHaveBeenCalledWith(
        wrapper.props('row'),
        'local',
        'vulnerabilities',
        'defaultTab=imagesUsed'
      );
    });

    it('returns value from getWorkloadLink', () => {
      (getWorkloadLink as jest.Mock).mockReturnValue('/mocked-link');

      const wrapper = createWrapper();

      expect((wrapper.vm as any).imagesUsedLink).toBe('/mocked-link');
    });
  });

  describe('rendered router-link', () => {
    it('renders imagesUsed inside router-link', () => {
      (getWorkloadLink as jest.Mock).mockReturnValue('/mocked-link');

      const wrapper = createWrapper({ imagesUsed: 12 });
      const link = wrapper.findComponent(RouterLinkStub);

      expect(link.exists()).toBe(true);
      expect(link.text()).toBe('12');
    });

    it('passes correct "to" prop to router-link', () => {
      (getWorkloadLink as jest.Mock).mockReturnValue('/mocked-link');

      const wrapper = createWrapper();
      const link = wrapper.findComponent(RouterLinkStub);

      expect(link.props('to')).toBe('/mocked-link');
    });
  });
});
