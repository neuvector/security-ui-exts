import { mount, flushPromises } from '@vue/test-utils';
import Vue from 'vue';
import PreviewableButton from '../PreviewableButton.vue';

jest.mock('node_modules/@rancher/shell/utils/clipboard.js', () => ({
  copyToClipboard: jest.fn(),
}));

// Stub Preview component
const PreviewStub = {
  name: 'Preview',
  template: '<div class="preview-mock" :data-value="value"><slot /></div>',
  props: ['id', 'value', 'anchorElement'],
};

describe('PreviewableButton.vue', () => {
  it('opens Preview when repository has matchConditions', async () => {
    const wrapper = mount(PreviewableButton, {
      props: {
        repository: { name: 'repo1', matchConditions: [{}] },
        type: 'primary',
      },
      global: {
        stubs: { Preview: PreviewStub },
      },
    });

    // Initially Preview is not visible
    expect(wrapper.find('.preview-mock').exists()).toBe(false);

    // Click the button
    await wrapper.find('[test-id="previewable-button"]').trigger('click');
    await flushPromises();

    const previewEl = wrapper.find('.preview-mock');
    expect(previewEl.exists()).toBe(true);

    // YAML string contains repository name
    expect(previewEl.attributes('data-value')).toContain('repo1');
  });

  it('does not open Preview when repository has no matchConditions', async () => {
    const wrapper = mount(PreviewableButton, {
      props: {
        repository: { name: 'repo2' },
        type: 'primary',
      },
      global: {
        stubs: { Preview: PreviewStub },
      },
    });

    await wrapper.find('[test-id="previewable-button"]').trigger('click');
    await flushPromises();

    expect(wrapper.find('.preview-mock').exists()).toBe(false);
  });

  it('yamlValue computed returns empty string on invalid repository', () => {
    const wrapper = mount(PreviewableButton, {
      props: {
        repository: { name: 'repo1', matchConditions: [{ name: 'test', expression: 'x > 1' }] },
        type: 'primary',
      },
      global: {
        stubs: { Preview: PreviewStub },
      },
    });

    // Access the computed property
    expect(wrapper.vm.yamlValue).toBe(`name: repo1
matchConditions:
  - name: test
    expression: x > 1
`);
  });

  it('sets showPreview to false when called', async () => {
    const wrapper = mount(PreviewableButton, {
      props: {
        repository: { name: 'repo1', matchConditions: [{}] },
        type: 'primary',
      },
      global: { stubs: { Preview: PreviewStub } },
    });

    // Open the preview first
    wrapper.vm.showPreview = true;

    // Call onClose without keyboard exit
    wrapper.vm.onClose(false);

    expect(wrapper.vm.showPreview).toBe(false);
  });

  it('focuses the button if keyboardExit is true', async () => {
    const wrapper = mount(PreviewableButton, {
      props: {
        repository: { name: 'repo1', matchConditions: [{}] },
        type: 'primary',
      },
      attachTo: document.body, // needed for focus to work
      global: { stubs: { Preview: PreviewStub } },
    });

    // Open the preview first
    wrapper.vm.showPreview = true;

    // Spy on button.focus
    const buttonEl = wrapper.vm.button as HTMLButtonElement;
    buttonEl.focus = jest.fn();

    // Call onClose with keyboardExit=true
    wrapper.vm.onClose(true);

    expect(wrapper.vm.showPreview).toBe(false);
  });
});
