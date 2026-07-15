// eslint.config.js - flat config for ESLint v9
export default [
  {
    files: ["**/*.{js,ts,tsx,jsx}"] ,
    languageOptions: {
      parser: require("@typescript-eslint/parser"),
      ecmaVersion: 2022,
      sourceType: "module",
      parserOptions: {
        project: "./tsconfig.json",
        ecmaFeatures: { jsx: true }
      }
    },
    plugins: {
      "@typescript-eslint": require("@typescript-eslint/eslint-plugin")
    },
    rules: {
      "no-console": "error",
      "@typescript-eslint/no-unused-vars": ["error", { "args": "after-used", "ignoreRestSiblings": true }],
      "no-debugger": "error",
      "no-duplicate-imports": "error",
      // warn about large blocks of commented-out code (TODO/FIXME/HACK are already warnings)
      "no-warning-comments": ["warn", { "terms": ["TODO", "FIXME", "HACK"], "location": "anywhere" }]
    }
  }
];
