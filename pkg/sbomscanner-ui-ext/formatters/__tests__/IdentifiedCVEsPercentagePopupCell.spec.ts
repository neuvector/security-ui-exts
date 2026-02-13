import { shallowMount } from '@vue/test-utils';
import IdentifiedCVEsPercentagePopupCell from '../IdentifiedCVEsPercentagePopupCell.vue';
import AmountBarBySeverityPoppedDetail from '@sbomscanner-ui-ext/components/common/AmountBarBySeverityPoppedDetail.vue';

describe('IdentifiedCVEsPercentagePopupCell.vue', () => {
  it('renders AmountBarBySeverityPoppedDetail and passes the correct props', () => {
    const mockValue = {
      cveAmount: {
        critical: 5,
        high:     10,
        medium:   1,
        low:      0,
        unknown:  3
      },
      link: '/c/local/explorer/workload/my-deployment#vulnerabilities'
    };

    const wrapper = shallowMount(IdentifiedCVEsPercentagePopupCell, {
      propsData: {
        value: mockValue
      }
    });

    const childComponent = wrapper.findComponent(AmountBarBySeverityPoppedDetail);

    expect(childComponent.exists()).toBe(true);

    expect(childComponent.props('cveAmount')).toEqual(mockValue.cveAmount);

    expect(childComponent.props('viewAllLink')).toBe(mockValue.link);
  });

  it('renders successfully with default empty values', () => {
    const wrapper = shallowMount(IdentifiedCVEsPercentagePopupCell, {
      propsData: {
        value: {}
      }
    });

    const childComponent = wrapper.findComponent(AmountBarBySeverityPoppedDetail);
    expect(childComponent.exists()).toBe(true);
    expect(childComponent.props('viewAllLink')).toBe( "" );
  });
});