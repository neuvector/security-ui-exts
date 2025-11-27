import RegistryDetails from '@sbomscanner-ui-ext/components/RegistryDetails.vue';
import ImageOverview from '@sbomscanner-ui-ext/pages/c/_cluster/sbomscanner/ImageOverview.vue';
import ImageDetails from '@sbomscanner-ui-ext/components/ImageDetails.vue';
import RegistriesConfiguration from '@sbomscanner-ui-ext/pages/c/_cluster/sbomscanner/RegistriesConfiguration.vue';
// import Vulnerabilities from "@sbomscanner-ui-ext/pages/c/_cluster/sbomscanner/Vulnerabilities.vue";
import CreateResource from '@sbomscanner-ui-ext/pages/c/_cluster/sbomscanner/_resource/create.vue';
import ListResource from '@sbomscanner-ui-ext/pages/c/_cluster/sbomscanner/_resource/index.vue';
import Entry from '@sbomscanner-ui-ext/pages/c/_cluster/sbomscanner/index.vue';
import VexManagement from '@sbomscanner-ui-ext/pages/c/_cluster/sbomscanner/VexManagement.vue';
import CveDetails from '@sbomscanner-ui-ext/components/CveDetails.vue';
import VexDetails from '@sbomscanner-ui-ext/components/VexDetails.vue';
import {
  PRODUCT_NAME,
  PAGE,
  RESOURCE,
} from '@sbomscanner-ui-ext/types';

const routes = [
  {
    name:      `c-cluster-${ PRODUCT_NAME }-${PAGE.DASHBOARD}`,
    path:      `/c/:cluster/${ PRODUCT_NAME }/${PAGE.DASHBOARD}`,
    component: Entry,
  },
  {
    name:      `c-cluster-${PRODUCT_NAME}-${PAGE.IMAGES}`,
    path:      `/c/:cluster/${PRODUCT_NAME}/${PAGE.IMAGES}`,
    component: ImageOverview,
  },
  {
    name:      `c-cluster-${PRODUCT_NAME}-${PAGE.IMAGES}-id`,
    path:      `/c/:cluster/${PRODUCT_NAME}/${PAGE.IMAGES}/:id`,
    component: ImageDetails,
  },
  // {
  //   name: `c-cluster-${PRODUCT_NAME}-${PAGE.VULNERABILITIES}`,
  //   path: `/c/:cluster/${PRODUCT_NAME}/${PAGE.VULNERABILITIES}`,
  //   component: Vulnerabilities,
  // },
  {
    name:      `c-cluster-${PRODUCT_NAME}-${PAGE.REGISTRIES}`,
    path:      `/c/:cluster/${PRODUCT_NAME}/${PAGE.REGISTRIES}`,
    component: RegistriesConfiguration,
  },
  {
    name:      `c-cluster-${PRODUCT_NAME}-${PAGE.REGISTRIES}-id`,
    path:      `/c/:cluster/${PRODUCT_NAME}/${PAGE.REGISTRIES}/:ns/:id`,
    component: RegistryDetails,
  },
  {
    name:      `c-cluster-${PRODUCT_NAME}-${PAGE.VEX_MANAGEMENT}`,
    path:      `/c/:cluster/${PRODUCT_NAME}/${PAGE.VEX_MANAGEMENT}`,
    component: VexManagement,
  },
  {
    name:      `c-cluster-${PRODUCT_NAME}-${PAGE.VEX_MANAGEMENT}-id`,
    path:      `/c/:cluster/${PRODUCT_NAME}/${PAGE.VEX_MANAGEMENT}/:id`,
    component: VexDetails,
  },
  {
    name:      `c-cluster-${PRODUCT_NAME}-${PAGE.VULNERABILITIES}-id`,
    path:      `/c/:cluster/${PRODUCT_NAME}/${PAGE.VULNERABILITIES}/:id`,
    component: CveDetails,
  },
  {
    name:      `${ PRODUCT_NAME }-c-cluster-resource-create`,
    path:      `/${ PRODUCT_NAME }/c/:cluster/:resource/create`,
    component: CreateResource,
    meta:      { product: PRODUCT_NAME },
  },
  {
    name:        `${ PRODUCT_NAME }-c-cluster-resource`,
    path:        `/${ PRODUCT_NAME }/c/:cluster/:resource`,
    component:   ListResource,
    meta:        { product: PRODUCT_NAME },
    beforeEnter: (to: any, from: any, next: any) => {
      // Redirect VexHub resource to custom VexManagement page
      if (to.params.resource === RESOURCE.VEX_HUB) {
        next({
          name:   `c-cluster-${PRODUCT_NAME}-${PAGE.VEX_MANAGEMENT}`,
          params: {
            cluster: to.params.cluster,
            product: PRODUCT_NAME
          }
        });
      } else {
        next();
      }
    }
  },
];

export default routes;
