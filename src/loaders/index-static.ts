import { LoaderRegistry } from '@frybynite/image-cloud';
import { StaticImageLoader } from './StaticImageLoader';

LoaderRegistry.registerLoader('static', StaticImageLoader);

export { StaticImageLoader };
