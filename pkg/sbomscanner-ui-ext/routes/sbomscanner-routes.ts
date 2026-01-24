import ImageOverview from '@sbomscanner-ui-ext/pages/c/_cluster/sbomscanner/ImageOverview.vue';
import ImageDetails from '@sbomscanner-ui-ext/components/ImageDetails.vue';
// import Vulnerabilities from "@sbomscanner-ui-ext/pages/c/_cluster/sbomscanner/Vulnerabilities.vue";
import Entry from '@sbomscanner-ui-ext/pages/c/_cluster/sbomscanner/index.vue';
import CveDetails from '@sbomscanner-ui-ext/components/CveDetails.vue';

import ListResource from '@shell/pages/c/_cluster/_product/_resource/index.vue';
import CreateResource from '@shell/pages/c/_cluster/_product/_resource/create.vue';
import ViewResource from '@shell/pages/c/_cluster/_product/_resource/_id.vue';
import ViewNamespacedResource from '@shell/pages/c/_cluster/_product/_resource/_namespace/_id.vue';

import {
  PRODUCT_NAME,
  PAGE,
} from '@sbomscanner-ui-ext/types';

const routes = [
  {
    name:      `c-cluster-${ PRODUCT_NAME }-${PAGE.DASHBOARD}`,
    path:      `/c/:cluster/${ PRODUCT_NAME }/${PAGE.DASHBOARD}`,
    component: Entry,
    meta:      { product: PRODUCT_NAME },
  },
  {
    path:     `/c/:cluster/${PRODUCT_NAME}/${PAGE.IMAGES}`,
    meta:     { product: PRODUCT_NAME },
    children: [
      {
        name:      `c-cluster-${PRODUCT_NAME}-${PAGE.IMAGES}`,
        path:      '',
        component: ImageOverview,
      },
      {
        name:      `c-cluster-${PRODUCT_NAME}-${PAGE.IMAGES}-id`,
        path:      `:id`,
        component: ImageDetails,
      },
      {
        name:      `c-cluster-${PRODUCT_NAME}-${PAGE.VULNERABILITIES}-id`,
        path:      `/c/:cluster/${PRODUCT_NAME}/${PAGE.VULNERABILITIES}/:id`,
        component: CveDetails,
      },
    ]
  },
  // {
  //   name: `c-cluster-${PRODUCT_NAME}-${PAGE.VULNERABILITIES}`,
  //   path: `/c/:cluster/${PRODUCT_NAME}/${PAGE.VULNERABILITIES}`,
  //   component: Vulnerabilities,
  // },
  // {
  //   name:      `c-cluster-${PRODUCT_NAME}-${PAGE.VULNERABILITIES}-id`,
  //   path:      `/c/:cluster/${PRODUCT_NAME}/${PAGE.VULNERABILITIES}/:id`,
  //   component: CveDetails,
  //   meta:      { product: PRODUCT_NAME },
  // },
  {
    name:      `c-cluster-${ PRODUCT_NAME }-resource-create`,
    path:      `/c/:cluster/${ PRODUCT_NAME }/:resource/create`,
    component: CreateResource,
    meta:      { product: PRODUCT_NAME },
  },
  {
    name:      `c-cluster-${ PRODUCT_NAME }-resource-id`,
    path:      `/c/:cluster/${ PRODUCT_NAME }/:resource/:id`,
    component: ViewResource,
    meta:      { product: PRODUCT_NAME },
  },
  {
    name:      `c-cluster-${ PRODUCT_NAME }-resource-namespace-id`,
    path:      `/c/:cluster/${ PRODUCT_NAME }/:resource/:namespace/:id`,
    component: ViewNamespacedResource,
    meta:      { product: PRODUCT_NAME },
  },
  {
    name:      `c-cluster-${ PRODUCT_NAME }-resource`,
    path:      `/c/:cluster/${ PRODUCT_NAME }/:resource`,
    component: ListResource,
    meta:      { product: PRODUCT_NAME },
  },
];

export default routes;
