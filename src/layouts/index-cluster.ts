import { LayoutEngine } from '../engines/LayoutEngine';
import { ClusterPlacementLayout } from './ClusterPlacementLayout';

LayoutEngine.registerLayout('cluster', ClusterPlacementLayout);

export { ClusterPlacementLayout };
