/*
 * SPDX-FileCopyrightText: 2024 SAP SE or an SAP affiliate company and Greenhouse contributors
 * SPDX-License-Identifier: Apache-2.0
 */

module.exports = {
  presets: ["@babel/preset-env", "@babel/preset-react"],
  env: {
    test: {
      plugins: [["babel-plugin-transform-import-meta", { module: "ES6" }]],
    },
  },
}
