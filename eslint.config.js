import fs from "fs";
import path from "path";

export default [
  {
    files: ["*.ts", "*.tsx"],
    languageOptions: { parser: "@typescript-eslint/parser" },
    plugins: { "@typescript-eslint": {} },
    rules: {
      semi: ["error", "always"],
      // your rules here
    },
  },
];
