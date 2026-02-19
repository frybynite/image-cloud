import { LayoutEngine } from '../engines/LayoutEngine';
import { RandomPlacementLayout } from './RandomPlacementLayout';

LayoutEngine.registerLayout('random', RandomPlacementLayout);

export { RandomPlacementLayout };
