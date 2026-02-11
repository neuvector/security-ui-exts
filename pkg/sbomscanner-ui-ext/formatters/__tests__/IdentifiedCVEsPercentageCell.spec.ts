import { shallowMount } from '@vue/test-utils';
import IdentifiedCVEsPercentageCell from '../IdentifiedCVEsPercentageCell.vue';
import VulnerabilityHoverCell from '@sbomscanner-ui-ext/components/common/VulnerabilityHoverCell.vue';

describe('IdentifiedCVEsPercentageCell.vue', () => {
  it('should render VulnerabilityHoverCell and pass the correctly formatted props', () => {
    const mockValue = {
      cveAmount: {
        critical: 5,
        high:     10,
        medium:   1,
        low:      0,
        unknown:  3
      },
      total: 19,
      link: '/c/local/explorer/apps.deployment/cattle-fleet-system/gitjob#affectingCVEs'
    };

    const wrapper = shallowMount(IdentifiedCVEsPercentageCell, {
      propsData: {
        value: mockValue
      },
    });

    const hoverCellComponent = wrapper.findComponent(VulnerabilityHoverCell);

    expect(hoverCellComponent.exists()).toBe(true);
    expect(hoverCellComponent.props('cveAmount')).toEqual(mockValue.cveAmount);
    expect(hoverCellComponent.props('viewAllLink')).toBe(mockValue.link);
    expect(hoverCellComponent.props('headerTitle')).toBe('19 %imageScanner.images.listTable.headers.vulnerabilities%');
  });
});