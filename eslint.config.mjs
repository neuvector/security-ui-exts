// eslint.config.mjs — migrated from .eslintrc.js + .eslintrc.default.js
import js from "@eslint/js";
import vue from "eslint-plugin-vue";
import typescript from "@typescript-eslint/eslint-plugin";
import cypress from "eslint-plugin-cypress";
import jest from "eslint-plugin-jest";
import globals from "globals";
import vueParser from "vue-eslint-parser";

export default [
  // Base ESLint recommended rules
  js.configs.recommended,

  // --- Core Vue / TS / Jest / Cypress setup ---
  {
    files: ["**/*.{js,ts,vue}"],

    languageOptions: {
      parser: vueParser,
      parserOptions: {
        parser: "@typescript-eslint/parser",
        ecmaVersion: "latest",
        sourceType: "module",
        ecmaFeatures: { jsx: true },
      },
      globals: {
        ...globals.browser,
        ...globals.node,
        NodeJS: true,
        Timer: true,
      },
    },

    plugins: {
      vue,
      "@typescript-eslint": typescript,
      cypress,
      jest,
    },

    rules: {
      // === General JS/TS style ===
      "no-console": "warn",
      "no-debugger": "warn",
      "no-unused-vars": "warn",
      "semi": ["warn", "always"],
      "quotes": ["warn", "single", { avoidEscape: true, allowTemplateLiterals: true }],
      "indent": ["warn", 2],
      "comma-dangle": ["warn", "only-multiline"],
      "arrow-parens": "warn",
      "arrow-spacing": ["warn", { before: true, after: true }],
      "keyword-spacing": "warn",
      "space-before-function-paren": ["warn", "never"],
      "object-curly-spacing": ["warn", "always"],
      "no-trailing-spaces": "warn",
      "block-spacing": ["warn", "always"],
      "brace-style": ["warn", "1tbs"],
      "newline-per-chained-call": ["warn", { ignoreChainWithDepth: 4 }],
      "lines-between-class-members": [
        "warn",
        "always",
        { exceptAfterSingleLine: true },
      ],
      "padding-line-between-statements": [
        "warn",
        { blankLine: "always", prev: "*", next: "return" },
        { blankLine: "always", prev: "function", next: "function" },
        {
          blankLine: "always",
          prev: ["const", "let", "var"],
          next: "*",
        },
        {
          blankLine: "any",
          prev: ["const", "let", "var"],
          next: ["const", "let", "var"],
        },
      ],
      "object-curly-newline": [
        "warn",
        {
          ObjectExpression: { multiline: true, minProperties: 3 },
          ObjectPattern: { multiline: true, minProperties: 4 },
          ImportDeclaration: { multiline: true, minProperties: 5 },
          ExportDeclaration: { multiline: true, minProperties: 3 },
        },
      ],
      "key-spacing": [
        "warn",
        {
          align: {
            beforeColon: false,
            afterColon: true,
            on: "value",
            mode: "strict",
          },
          multiLine: { beforeColon: false, afterColon: true },
        },
      ],

      // === Vue specific ===
      "vue/no-unused-components": "warn",
      "vue/no-v-html": "error",
      "vue/require-explicit-emits": "error",
      "vue/one-component-per-file": "off",
      "vue/no-deprecated-slot-attribute": "off",
      "vue/v-on-event-hyphenation": "off",
      "vue/html-self-closing": "off",
      "vue/order-in-components": "off",
      "vue/no-lone-template": "off",
      "vue/v-slot-style": "off",
      "vue/component-tags-order": "off",
      "vue/no-mutating-props": "off",

      // === TypeScript ===
      "@typescript-eslint/no-unused-vars": "off",
      "@typescript-eslint/no-empty-function": "off",
      "@typescript-eslint/ban-types": "off",
      "@typescript-eslint/explicit-module-boundary-types": "off",

      // === Cypress / Jest ===
      "jest/prefer-expect-assertions": "off",
    },
  },

  // --- Jest test overrides ---
  {
    files: [
      "**/__tests__/**/*.{js,ts,vue}",
      "**/*.spec.{js,ts}",
      "**/*.test.{js,ts}",
      "jest.setup.{js,ts}",
    ],
    languageOptions: {
      globals: {
        ...globals.jest,
      },
    },
    plugins: { jest },
    rules: {
      "@typescript-eslint/no-empty-function": "off",
      "@typescript-eslint/no-non-null-assertion": "off",
      "@typescript-eslint/explicit-module-boundary-types": "off",
      "jest/prefer-expect-assertions": "off",
      "no-undef": "off",
    },
  },

  // --- Cypress environment ---
  {
    files: ["cypress/**/*.{js,ts,vue}"],
    languageOptions: { globals: globals.browser },
    plugins: { cypress },
    ...cypress.configs.recommended,
  },

  // --- Ignored paths (replaces .eslintignore) ---
  {
    ignores: [
      "dist/**",
      "node_modules/**",
      "coverage/**",
      "cypress/videos/**",
      "cypress/screenshots/**",
      "**/vendor/**",
    ],
  },
];
