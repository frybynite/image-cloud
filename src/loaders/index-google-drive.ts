import { LoaderRegistry } from '../engines/LoaderRegistry';
import { GoogleDriveLoader } from './GoogleDriveLoader';

LoaderRegistry.registerLoader('google-drive', GoogleDriveLoader);

export { GoogleDriveLoader };
