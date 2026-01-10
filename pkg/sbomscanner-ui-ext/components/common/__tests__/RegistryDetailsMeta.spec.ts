import { mount } from '@vue/test-utils';
import RegistryDetailsMeta from '../RegistryDetailsMeta.vue';

// Mock PreviewableButton since it's child component
jest.mock('../PreviewableButton.vue', () => ({
  name: 'PreviewableButton',
  props: ['repository'],
  template: '<div class="preview-btn-mock">{{ repository.name }}</div>',
}));

describe('RegistryDetailsMeta.vue', () => {
  const baseProps = {
    namespace: {
      label: 'Namespace',
      value: 'default',
    },
    uri: {
      label: 'URI',
      value: 'docker.io',
    },
    schedule: {
      label: 'Schedule',
      value: '5m',
    },
    repositories: {
      label: 'Repositories',
      value: 2,
      list: [
        { name: 'library/alpine' },
        { name: 'nginx' },
      ],
    },
    platforms: {
      label: 'Platforms',
      value: 2,
      list: [
        { os: 'linux', arch: 'amd64' },                          // no variant
        { os: 'linux', arch: 'arm64', variant: 'v8' },          // with variant
      ],
    },
  };

  it('renders namespace, uri, and schedule correctly', () => {
    const wrapper = mount(RegistryDetailsMeta, {
      propsData: { properties: baseProps }
    });

    expect(wrapper.text()).toContain('Namespace');
    expect(wrapper.text()).toContain('default');

    expect(wrapper.text()).toContain('URI');
    expect(wrapper.text()).toContain('docker.io');

    expect(wrapper.text()).toContain('Schedule');
    expect(wrapper.text()).toContain('5m');
  });

  it('renders repository count and list with PreviewableButton', () => {
    const wrapper = mount(RegistryDetailsMeta, {
      propsData: { properties: baseProps }
    });

    // count
    expect(wrapper.text()).toContain('Repositories');
    expect(wrapper.text()).toContain('2');

    // list
    const repoButtons = wrapper.findAll('.preview-btn-mock');
    expect(repoButtons.length).toBe(2);

    expect(repoButtons.at(0).text()).toBe('library/alpine');
    expect(repoButtons.at(1).text()).toBe('nginx');
  });

  it('does not render platform tags when value=0', () => {
    const propsNoPlatforms = JSON.parse(JSON.stringify(baseProps));
    propsNoPlatforms.platforms.value = 0;
    propsNoPlatforms.platforms.list = [];

    const wrapper = mount(RegistryDetailsMeta, {
      propsData: { properties: propsNoPlatforms }
    });

    const platformWrapper = wrapper.find('[test-id="platforms"]');
    expect(platformWrapper.exists()).toBe(false);
  });

  it('renders platform tags when value > 0', () => {
    const wrapper = mount(RegistryDetailsMeta, {
      propsData: { properties: baseProps }
    });

    const platformTags = wrapper.findAll('.vendor-tag.active');

    expect(platformTags.length).toBe(2);

    expect(platformTags.at(0).text()).toBe('linux / amd64');
    expect(platformTags.at(1).text()).toBe('linux / arm64 / v8');
  });

  it('getPlatformTag returns correct format (variant missing)', () => {
    const wrapper = mount(RegistryDetailsMeta, {
      propsData: { properties: baseProps }
    });

    const tag = wrapper.vm.getPlatformTag({
      os: 'linux',
      arch: 'amd64'
      // no variant
    });

    expect(tag).toBe('linux / amd64');
  });

  it('getPlatformTag returns correct format (variant present)', () => {
    const wrapper = mount(RegistryDetailsMeta, {
      propsData: { properties: baseProps }
    });

    const tag = wrapper.vm.getPlatformTag({
      os: 'linux',
      arch: 'arm64',
      variant: 'v7'
    });

    expect(tag).toBe('linux / arm64 / v7');
  });
});
