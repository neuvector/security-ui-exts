import NetworkOverview from '../pages/NetworkOverview.vue';

const networkName = 'network';
const routes = [
  {
    name:      `c-cluster-${ networkName }-overview`,
    path:      `/c/:cluster/${ networkName }/overview`,
    component: NetworkOverview
  }
];

export default routes;
