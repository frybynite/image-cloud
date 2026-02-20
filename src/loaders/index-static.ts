import { LoaderRegistry } from '../engines/LoaderRegistry';
import { StaticImageLoader } from './StaticImageLoader';

LoaderRegistry.registerLoader('static', StaticImageLoader);

export { StaticImageLoader };
