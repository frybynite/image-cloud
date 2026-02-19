import { LayoutEngine } from '../engines/LayoutEngine';
import { RadialPlacementLayout } from './RadialPlacementLayout';

LayoutEngine.registerLayout('radial', RadialPlacementLayout);

export { RadialPlacementLayout };
