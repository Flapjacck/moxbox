// Re-export module split into schema + helper to keep single import path
export * from './files.helper';
export * from './files.schema';
import helper from './files.helper';
import schema from './files.schema';

export default { ...helper, ...schema };
