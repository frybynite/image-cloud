import { LoaderRegistry } from '@frybynite/image-cloud';
import { GoogleDriveLoader } from './GoogleDriveLoader';

LoaderRegistry.registerLoader('google-drive', GoogleDriveLoader);

export { GoogleDriveLoader };
