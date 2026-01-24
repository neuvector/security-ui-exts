import { shallowMount, RouterLinkStub } from '@vue/test-utils';
import VexNameLink from '../VexNameLink.vue';

describe('VexNameLink.vue', () => {
  it('should render a link with the correct text and "to" prop', () => {
    const mockValue = 'My VEX Document';
    const mockRow = { id: 'vex-doc-id-456' };
    const mockClusterId = 'c-m-xyz123';

    const wrapper = shallowMount(VexNameLink, {
      props: {
        value: mockValue,
        row:   mockRow,
      },
      global: {
        mocks: { $route: { params: { cluster: mockClusterId } } },
        stubs: { RouterLink: RouterLinkStub },
      },
    });

    const linkStub = wrapper.findComponent(RouterLinkStub);

    const expectedLink = {
      "name": "c-cluster-product-resource-id",
      "params": {
        "cluster": mockClusterId,
        "id": mockValue,
        "product": "imageScanner",
        "resource": "sbomscanner.kubewarden.io.vexhub"
      }
    };

    const receivedLink = linkStub.props('to');

    expect(receivedLink.name).toBe(expectedLink.name);
    expect(receivedLink.params.cluster).toBe(expectedLink.params.cluster);
    expect(receivedLink.params.id).toBe(expectedLink.params.id);
    expect(receivedLink.params.product).toBe(expectedLink.params.product);
    expect(receivedLink.params.resource).toBe(expectedLink.params.resource);

    expect(linkStub.exists()).toBe(true);

    expect(linkStub.text()).toBe(mockValue);

  });
});
