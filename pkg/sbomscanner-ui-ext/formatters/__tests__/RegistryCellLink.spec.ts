import { jest } from '@jest/globals';
import { shallowMount, RouterLinkStub } from '@vue/test-utils';
import RegistryCellLink from '../RegistryCellLink.vue';

jest.mock('@sbomscanner-ui-ext/types', () => ({
  PRODUCT_NAME: 'mocked-product',
  PAGE:         { REGISTRIES: 'mocked-registries-page' },
  RESOURCE:     { REGISTRY: 'mocked-registries-resource' }
}));

describe('RegistryCellLink.vue', () => {
  it('should render a link with the correct text and "to" prop', () => {
    const mockValue = 'my-registry';
    const mockRow = { metadata: { namespace: 'my-namespace' } };
    const mockClusterId = 'c-m-xyz123';

    const wrapper = shallowMount(RegistryCellLink, {
      props: {
        value: mockValue,
        row:   mockRow
      },
      global: {
        mocks: { $route: { params: { cluster: mockClusterId } } },
        stubs: { RouterLink: RouterLinkStub }
      }
    });

    const linkStub = wrapper.findComponent(RouterLinkStub);

    expect(linkStub.exists()).toBe(true);

    const expectedText = 'my-namespace/my-registry';

    expect(linkStub.text()).toBe(expectedText);

    const expectedLink = {
      'name':   'c-cluster-product-resource-namespace-id',
      'params': {
        'cluster':   'c-m-xyz123',
        'id':        'my-registry',
        'namespace': 'my-namespace',
        'product':   'mocked-product',
        'resource':  'mocked-registries-resource'
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
