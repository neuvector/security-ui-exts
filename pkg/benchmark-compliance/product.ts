import { IPlugin } from '@shell/core/types';

export function init($plugin: IPlugin, store: any) {
    const productName = 'benchmark';

    const {
        product,
        virtualType,
        basicType
    } = $plugin.DSL(store, productName);

    // registering a top-level product
    product({
        icon: 'pod_security',
        inStore: 'cluster',
    });

    // => => => creating a custom page
    virtualType({
        label: 'Overview',
        name:   'overview',
        namespaced: false,
        route:    {
            name:   `c-cluster-${productName}-overview`,
            params: {
                product: productName
            },
            meta: { pkg: "benchmark-compliance", product: productName }
        }
    });

    basicType([
        "overview"
    ]);
}