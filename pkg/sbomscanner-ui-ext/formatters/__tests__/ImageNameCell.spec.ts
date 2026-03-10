import { jest } from '@jest/globals';
import { shallowMount, RouterLinkStub } from '@vue/test-utils';
import ImageNameCell from '../ImageNameCell.vue'; // Adjust this path as needed

jest.mock('@sbomscanner-ui-ext/types', () => ({
  PRODUCT_NAME: 'mocked-product',
  PAGE:         { IMAGES: 'mocked-images-page' }
}));

describe('ImageNameCell.vue', () => {
  const mockClusterId = 'c-m-xyz123';

  const mountComponent = (row) => {
    return shallowMount(ImageNameCell, {
      props:  { row },
      global: {
        mocks: { $route: { params: { cluster: mockClusterId } } },
        stubs: { RouterLink: RouterLinkStub }
      }
    });
  };

  it('should render a link with the correct display name and URL', () => {
    const mockRow = {
      metadata:      { name: 'my-image-resource-name', namespace: 'sbomscanner' },
      imageMetadata: {
        registryURI: 'docker.io',
        repository:  'my-repo/my-app',
        tag:         'v1.0.0'
      }
    };
    const expectedDisplayName = 'docker.io/my-repo/my-app:v1.0.0';

    const wrapper = mountComponent(mockRow);
    const linkStub = wrapper.findComponent(RouterLinkStub);

    const expectedLink = {
      'name':   'c-cluster-mocked-product-mocked-images-page-namespace-id',
      'params': {
        'cluster':   mockClusterId,
        'namespace': mockRow.metadata.namespace,
        'id':        mockRow.metadata.name,
      }
    };

    const receivedLink = linkStub.props('to');

    expect(linkStub.exists()).toBe(true);
    expect(linkStub.text()).toBe(expectedDisplayName);
    expect(receivedLink.name).toBe(expectedLink.name);
    expect(receivedLink.params.cluster).toBe(expectedLink.params.cluster);
    expect(receivedLink.params.namespace).toBe(expectedLink.params.namespace);
    expect(receivedLink.params.id).toBe(expectedLink.params.id);
  });

  it('should handle missing imageMetadata gracefully', () => {
    const mockRow = {
      metadata: { name: 'my-image-resource-name-2', namespace: 'sbomscanner' }
    };

    const expectedDisplayName = '';

    const wrapper = mountComponent(mockRow);
    const linkStub = wrapper.findComponent(RouterLinkStub);

    const expectedLink = {
      'name':   'c-cluster-mocked-product-mocked-images-page-namespace-id',
      'params': {
        'cluster':   mockClusterId,
        'namespace': mockRow.metadata.namespace,
        'id':        mockRow.metadata.name,
      }
    };

    const receivedLink = linkStub.props('to');

    expect(linkStub.exists()).toBe(true);
    expect(linkStub.text()).toBe(expectedDisplayName);
    expect(receivedLink.name).toBe(expectedLink.name);
    expect(receivedLink.params.cluster).toBe(expectedLink.params.cluster);
    expect(receivedLink.params.namespace).toBe(expectedLink.params.namespace);
    expect(receivedLink.params.id).toBe(expectedLink.params.id);
  });
});
