import { LayoutEngine } from '../engines/LayoutEngine';
import { WavePlacementLayout } from './WavePlacementLayout';

LayoutEngine.registerLayout('wave', WavePlacementLayout);

export { WavePlacementLayout };
