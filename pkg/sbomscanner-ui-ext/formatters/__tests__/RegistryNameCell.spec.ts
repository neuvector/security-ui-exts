import { jest } from '@jest/globals';
import { shallowMount, RouterLinkStub } from '@vue/test-utils';
import RegistryNameCell from '../RegistryNameCell.vue';

jest.mock('@sbomscanner-ui-ext/types', () => ({
  PRODUCT_NAME: 'mocked-product',
  PAGE:         { REGISTRIES: 'mocked-registries-page' },
  RESOURCE:     { REGISTRY: 'mocked-registries-resource' }
}));

describe('RegistryNameCell.vue', () => {
  it('should render a link with the correct text and "to" prop', () => {
    const mockRow = {
      metadata: {
        name:      'my-test-registry',
        namespace: 'my-test-namespace'
      }
    };
    const mockClusterId = 'c-m-abc123';

    const wrapper = shallowMount(RegistryNameCell, {
      props:  { row: mockRow },
      global: {
        mocks: { $route: { params: { cluster: mockClusterId } } },
        stubs: { RouterLink: RouterLinkStub }
      }
    });

    const linkStub = wrapper.findComponent(RouterLinkStub);

    expect(linkStub.exists()).toBe(true);

    const expectedText = 'my-test-registry';

    expect(linkStub.text()).toBe(expectedText);

    const expectedLink = {
      "name": "c-cluster-product-resource-namespace-id",
      "params": {
        "cluster": "c-m-abc123",
        "id": "my-test-registry",
        "namespace": "my-test-namespace",
        "product": "mocked-product",
        "resource": "mocked-registries-resource"
      }
    };

    const receivedLink = linkStub.props('to');

    expect(receivedLink.name).toBe(expectedLink.name);
    expect(receivedLink.params.cluster).toBe(expectedLink.params.cluster);
    expect(receivedLink.params.id).toBe(expectedLink.params.id);
    expect(receivedLink.params.namespace).toBe(expectedLink.params.namespace);
    expect(receivedLink.params.product).toBe(expectedLink.params.product);
    expect(receivedLink.params.resource).toBe(expectedLink.params.resource);
  });
});
