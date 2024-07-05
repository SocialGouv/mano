module.exports = {
  env: {
    browser: true,
    node: true,
    es2021: true,
    jest: true,
  },
  globals: {
    React: true,
    JSX: true,
    NodeJS: true,
    Function: true,
    HTMLInputElement: true,
  },
  ignorePatterns: ["build", ".eslintrc.cjs"],
  extends: ["eslint:recommended", "plugin:react/recommended", "plugin:@typescript-eslint/recommended", "plugin:react-hooks/recommended"],
  overrides: [
    {
      files: ["*.jsx", "*.js", "*.ts", "*.tsx"],
      rules: {
        "react/no-unescaped-entities": "off",
        "react/prop-types": "off",
      },
    },
  ],
  parser: "@typescript-eslint/parser",
  parserOptions: {
    ecmaVersion: "latest",
    sourceType: "module",
  },
  plugins: ["react", "@typescript-eslint"],
  rules: {
    "no-undef": "error",
    "no-extra-boolean-cast": "warn",
    "@typescript-eslint/no-explicit-any": "warn",
    "react/react-in-jsx-scope": "off",
    "react/display-name": "warn",
    "@typescript-eslint/no-unused-vars": [
      "warn",
      {
        args: "all",
        argsIgnorePattern: "^_",
        caughtErrors: "all",
        caughtErrorsIgnorePattern: "^_",
        destructuredArrayIgnorePattern: "^_",
        varsIgnorePattern: "^_",
        ignoreRestSiblings: true,
      },
    ],
  },
};
