import { LayoutEngine } from '../engines/LayoutEngine';
import { SpiralPlacementLayout } from './SpiralPlacementLayout';

LayoutEngine.registerLayout('spiral', SpiralPlacementLayout);

export { SpiralPlacementLayout };
