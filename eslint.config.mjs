import js from "@eslint/js";
import nextPlugin from "@next/eslint-plugin-next";
import tsPlugin from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";
import reactHooks from "eslint-plugin-react-hooks";

const browserGlobals = {
  BarcodeDetector: "readonly",
  CanvasImageSource: "readonly",
  document: "readonly",
  HTMLVideoElement: "readonly",
  MediaStream: "readonly",
  navigator: "readonly",
  React: "readonly",
  TextEncoder: "readonly",
  window: "readonly"
};

export default [
  {
    ignores: [".next/**", "node_modules/**", "next-env.d.ts"]
  },
  js.configs.recommended,
  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaFeatures: { jsx: true },
        project: "./tsconfig.json",
        sourceType: "module"
      },
      globals: browserGlobals
    },
    plugins: {
      "@next/next": nextPlugin,
      "@typescript-eslint": tsPlugin,
      "react-hooks": reactHooks
    },
    rules: {
      ...nextPlugin.configs.recommended.rules,
      ...nextPlugin.configs["core-web-vitals"].rules,
      ...reactHooks.configs.recommended.rules,
      "no-undef": "off",
      "no-unused-vars": "off",
      "@next/next/no-img-element": "off",
      "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }]
    }
  }
];
