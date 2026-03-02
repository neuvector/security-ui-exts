import { shallowMount } from '@vue/test-utils';
import ListWorkloadScanConfiguration from '../sbomscanner.kubewarden.io.workloadscanconfiguration.vue';
import { PRODUCT_NAME, RESOURCE } from '@sbomscanner-ui-ext/types';

describe('ListWorkloadScanConfiguration.vue', () => {
  let wrapper;
  let mockDispatch;
  let mockReplace;

  beforeEach(() => {
    // 1. Setup Jest mock functions
    mockDispatch = jest.fn();
    mockReplace = jest.fn();

    // 2. Mount the component with mocked global objects
    wrapper = shallowMount(ListWorkloadScanConfiguration, {
      // FIX: In Vue Test Utils v2, mocks and stubs must be wrapped in "global"
      global: {
        mocks: {
          $store: {
            getters: {
              currentProduct: { inStore: 'cluster' }
            },
            dispatch: mockDispatch
          },
          $route: {
            params: { cluster: 'local' }
          },
          $router: {
            replace: mockReplace
          }
        },
        stubs: {
          Loading: { template: '<div class="loading-stub"></div>' }
        }
      }
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders the Loading component by default', () => {
    expect(wrapper.find('.loading-stub').exists()).toBe(true);
  });

  it('fetches the workload scan configurations from the correct store', async () => {
    mockDispatch.mockResolvedValue([]);

    // Manually trigger the Nuxt fetch hook
    await wrapper.vm.$options.fetch.call(wrapper.vm);

    expect(mockDispatch).toHaveBeenCalledWith('cluster/findAll', {
      type: RESOURCE.WORKLOAD_SCAN_CONFIGURATION
    });
  });

  it('redirects to the EDIT page when a configuration already exists', async () => {
    // Mock the store returning an existing configuration
    mockDispatch.mockResolvedValue([{ id: 'default' }]);

    await wrapper.vm.$options.fetch.call(wrapper.vm);

    // Verify it replaces the route to the edit page targeting 'default'
    expect(mockReplace).toHaveBeenCalledWith({
      name: 'c-cluster-product-resource-id',
      params: {
        cluster:  'local',
        product:  PRODUCT_NAME,
        resource: RESOURCE.WORKLOAD_SCAN_CONFIGURATION,
        id:       'default'
      },
      query: { mode: 'edit' }
    });
  });

  it('redirects to the CREATE page when no configuration exists (empty array)', async () => {
    // Mock the store returning an empty array
    mockDispatch.mockResolvedValue([]);

    await wrapper.vm.$options.fetch.call(wrapper.vm);

    // Verify it replaces the route to the create page
    expect(mockReplace).toHaveBeenCalledWith({
      name: 'c-cluster-product-resource-create',
      params: {
        cluster:  'local',
        product:  PRODUCT_NAME,
        resource: RESOURCE.WORKLOAD_SCAN_CONFIGURATION
      }
    });
  });

  it('redirects to the CREATE page when the fetch returns null or undefined', async () => {
    // Mock the store returning null (safety check)
    mockDispatch.mockResolvedValue(null);

    await wrapper.vm.$options.fetch.call(wrapper.vm);

    expect(mockReplace).toHaveBeenCalledWith({
      name: 'c-cluster-product-resource-create',
      params: {
        cluster:  'local',
        product:  PRODUCT_NAME,
        resource: RESOURCE.WORKLOAD_SCAN_CONFIGURATION
      }
    });
  });
});