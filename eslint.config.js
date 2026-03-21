import compat from 'eslint-plugin-compat';
import tsParser from '@typescript-eslint/parser';

export default [
  {
    ...compat.configs['flat/recommended'],
    files: ['src/**/*.ts'],
    languageOptions: {
      parser: tsParser,
    },
  },
];
