import { shallowMount } from '@vue/test-utils';
import AffectingCVEsCell from '../AffectingCVEsCell.vue';
import { getWorkloadLink } from '@sbomscanner-ui-ext/utils/app';

jest.mock('@sbomscanner-ui-ext/utils/app', () => ({
  getWorkloadLink: jest.fn()
}));

const RouterLinkStub = {
  template: '<a class="router-link-stub"><slot /></a>',
  props: ['to']
};

describe('AffectingCVEsCell.vue', () => {
  const defaultRow = {
    summary: {
      critical: 1,
      high: 2,
      medium: 3,
      low: 4,
      unknown: 0
    }
  };

  const createWrapper = (rowOverride = {}) => {
    return shallowMount(AffectingCVEsCell, {
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
    expect(wrapper.find('.workload-affecting-cves-cell').exists()).toBe(true);
  });

  describe('affectingCVEs computed', () => {
    it('calculates total correctly', () => {
      const wrapper = createWrapper();
      expect((wrapper.vm as any).affectingCVEs).toBe(10);
    });

    it('returns 0 if all values are 0', () => {
      const wrapper = createWrapper({
        summary: {
          critical: 0,
          high: 0,
          medium: 0,
          low: 0,
          unknown: 0
        }
      });

      expect((wrapper.vm as any).affectingCVEs).toBe(0);
    });

    it('handles missing summary gracefully (defensive test)', () => {
      const wrapper = shallowMount(AffectingCVEsCell, {
        props: {
          row: { summary: {} }
        },
        global: {
          stubs: { RouterLink: RouterLinkStub },
          mocks: {
            $route: { params: { cluster: 'local' } }
          }
        }
      });

      expect((wrapper.vm as any).affectingCVEs).toBe(0);
    });
  });

  describe('affectingCVEsLink computed', () => {
    it('calls getWorkloadLink with correct arguments', () => {
      (getWorkloadLink as jest.Mock).mockReturnValue('/mocked-link');

      const wrapper = createWrapper();

      expect(getWorkloadLink).toHaveBeenCalledWith(
        wrapper.props('row'),
        'local',
        'vulnerabilities',
        'defaultTab=affectingCVEs'
      );
    });

    it('returns value from getWorkloadLink', () => {
      (getWorkloadLink as jest.Mock).mockReturnValue('/mocked-link');

      const wrapper = createWrapper();

      expect((wrapper.vm as any).affectingCVEsLink).toBe('/mocked-link');
    });
  });

  describe('rendered link', () => {
    it('renders the total inside router-link', () => {
      (getWorkloadLink as jest.Mock).mockReturnValue('/mocked-link');

      const wrapper = createWrapper();

      const link = wrapper.findComponent(RouterLinkStub);

      expect(link.exists()).toBe(true);
      expect(link.text()).toBe('10');
    });

    it('passes correct "to" prop to router-link', () => {
      (getWorkloadLink as jest.Mock).mockReturnValue('/mocked-link');

      const wrapper = createWrapper();
      const link = wrapper.findComponent(RouterLinkStub);

      expect(link.props('to')).toBe('/mocked-link');
    });
  });
});
