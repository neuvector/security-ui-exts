import { shallowMount } from '@vue/test-utils';
import ImageInUsePopupCell from '../ImageInUsePopupCell.vue';
import ImageInUsePoppedDetail from '@sbomscanner-ui-ext/components/common/ImageInUsePoppedDetail.vue';
import { PRODUCT_NAME, PAGE } from '@sbomscanner-ui-ext/types';

describe('ImageInUsePopupCell.vue', () => {
  const mockRow = {
    metadata: {
      name: 'test-image-id'
    }
  };

  const createWrapper = (routeMock = {}, storeMock = {}) => {
    return shallowMount(ImageInUsePopupCell, {
      props: {
        value: 5,
        row: mockRow
      },
      global: {
        mocks: {
          $route: routeMock,
          $store: storeMock
        }
      }
    });
  };

  it('renders ImageInUsePoppedDetail and passes the count prop correctly', () => {
    const wrapper = createWrapper(
      { params: { cluster: 'test-cluster' } },
      { getters: { currentCluster: null } }
    );

    const childComponent = wrapper.findComponent(ImageInUsePoppedDetail);

    expect(childComponent.exists()).toBe(true);
    expect(childComponent.props('count')).toBe(5);
  });

  it('constructs workloadTabLink using $route.params.cluster', () => {
    const wrapper = createWrapper(
      { params: { cluster: 'route-cluster-id' } },
      { getters: { currentCluster: { id: 'store-cluster-id' } } }
    );

    const childComponent = wrapper.findComponent(ImageInUsePoppedDetail);

    expect(childComponent.props('link')).toEqual({
      name: `c-cluster-${PRODUCT_NAME}-${PAGE.IMAGES}-id`,
      params: {
        cluster: 'route-cluster-id',
        id: 'test-image-id'
      },
      hash: '#workloads'
    });
  });

  it('constructs workloadTabLink using $store.getters if $route params are missing', () => {
    const wrapper = createWrapper(
      { params: {} }, // Route exists but has no cluster param
      { getters: { currentCluster: { id: 'store-cluster-id' } } }
    );

    const childComponent = wrapper.findComponent(ImageInUsePoppedDetail);

    expect(childComponent.props('link').params.cluster).toBe('store-cluster-id');
  });

  it('constructs workloadTabLink with "local" fallback if both route and store lack cluster info', () => {
    const wrapper = createWrapper(
      {}, // Route exists but is empty
      { getters: { currentCluster: null } }
    );

    const childComponent = wrapper.findComponent(ImageInUsePoppedDetail);

    expect(childComponent.props('link').params.cluster).toBe('local');
  });

  it('handles missing image ID safely without crashing', () => {
    const wrapper = shallowMount(ImageInUsePopupCell, {
      props: {
        value: 1,
        row: {}
      },
      global: {
        mocks: {
          $route: { params: { cluster: 'local' } },
          $store: { getters: {} }
        }
      }
    });

    const childComponent = wrapper.findComponent(ImageInUsePoppedDetail);

    expect(childComponent.props('link').params.id).toBe('');
  });
});