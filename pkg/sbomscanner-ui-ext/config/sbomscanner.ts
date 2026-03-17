import {
  PRODUCT_NAME,
  PAGE,
  RESOURCE
} from '@sbomscanner-ui-ext/types';

export function init($plugin: any, store: any) {
  const {
    product, virtualType, basicType, weightType, configureType, ignoreType,
  } = $plugin.DSL(store, PRODUCT_NAME);

  product({
    icon:                'pod_security',
    inStore:             'cluster',
    showNamespaceFilter: true,
  });

  virtualType({
    labelKey:   'imageScanner.dashboard.title',
    name:       PAGE.DASHBOARD,
    weight:     98,
    namespaced: false,
    route:      {
      name:   `c-cluster-${PRODUCT_NAME}-${PAGE.DASHBOARD}`,
      params: { product: PRODUCT_NAME },
      meta:   { pkg: PRODUCT_NAME, product: PRODUCT_NAME }
    },
    overview: true
  });

  virtualType({
    labelKey:   'imageScanner.images.title',
    name:       PAGE.IMAGES,
    weight:     97,
    ifHaveType: RESOURCE.REGISTRY,
    namespaced: false,
    route:      {
      name:   `c-cluster-${PRODUCT_NAME}-${PAGE.IMAGES}`,
      params: { product: PRODUCT_NAME },
      meta:   { pkg: PRODUCT_NAME, product: PRODUCT_NAME }
    }
  });

  // virtualType({
  //   labelKey: "imageScanner.vulnerabilities.title",
  //   name: PAGE.VULNERABILITIES,
  //   namespaced: false,
  //   route: {
  //     name: `c-cluster-${PRODUCT_NAME}-${PAGE.VULNERABILITIES}`,
  //     params: {
  //       product: PRODUCT_NAME,
  //     },
  //     meta: { pkg: PRODUCT_NAME, product: PRODUCT_NAME },
  //   },
  // });

  const WORKLOAD_SCAN_CRD = RESOURCE.WORKLOAD_SCAN_CONFIGURATION;
  const VIRTUAL_WORKLOAD_SCAN = "virtual-workloads-scan"

  ignoreType(WORKLOAD_SCAN_CRD);

  virtualType({
    labelKey: 'imageScanner.workloads.configuration.menu.title',
    name: VIRTUAL_WORKLOAD_SCAN,
    weight: 96,
    route: {
      // Use whatever route you previously used to navigate to your singleton CR page
      name: 'c-cluster-product-resource',
      params: {
        product: PRODUCT_NAME,
        resource: WORKLOAD_SCAN_CRD,
      }
    }
  });

  configureType(RESOURCE.WORKLOAD_SCAN_CONFIGURATION, {
    resourceEditMasthead: false
  })

  // weightType(PAGE.VULNERABILITIES, 96, true);
  weightType(RESOURCE.REGISTRY, 95, true);
  weightType(RESOURCE.VEX_HUB, 94, true);

  basicType([
    PAGE.DASHBOARD,
    PAGE.IMAGES,
    // PAGE.VULNERABILITIES,
  ]);

  basicType([VIRTUAL_WORKLOAD_SCAN, RESOURCE.REGISTRY, RESOURCE.VEX_HUB], 'Advanced');
}