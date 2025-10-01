import RuntimeOverview from '../pages/RuntimeOverview.vue';

const runtimeProcessProfileName = 'runtime_process_profile';
const routes = [
  {
    name:      `c-cluster-${ runtimeProcessProfileName }-overview`,
    path:      `/c/:cluster/${ runtimeProcessProfileName }/overview`,
    component: RuntimeOverview
  }
];

export default routes;
