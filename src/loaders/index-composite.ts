import { LoaderRegistry } from '@frybynite/image-cloud';
import { CompositeLoader } from './CompositeLoader';

LoaderRegistry.registerLoader('composite', CompositeLoader);

export { CompositeLoader };
export type { CompositeLoaderConfig } from './CompositeLoader';
