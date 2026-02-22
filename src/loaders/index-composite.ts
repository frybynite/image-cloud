import { LoaderRegistry } from '../engines/LoaderRegistry';
import { CompositeLoader } from './CompositeLoader';

LoaderRegistry.registerLoader('composite', CompositeLoader);

export { CompositeLoader };
export type { CompositeLoaderConfig } from './CompositeLoader';
