module.exports = {
  root: true,
  env: {
    node: true,
    es2021: true,
  },
  extends: [],
  parserOptions: {
    ecmaVersion: 2021,
    sourceType: 'module',
  },
  rules: {},
  overrides: [
    {
      files: ['*.js'],
      env: {
        node: true,
      },
    },
  ],
};

