/** @type { import("eslint").Linter.Config } */
module.exports = {
  extends: [
    "./base.js",
    "next/core-web-vitals",
    "plugin:@typescript-eslint/recommended",
  ],
};
