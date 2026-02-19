import { LayoutEngine } from '../engines/LayoutEngine';
import { GridPlacementLayout } from './GridPlacementLayout';

LayoutEngine.registerLayout('grid', GridPlacementLayout);

export { GridPlacementLayout };
