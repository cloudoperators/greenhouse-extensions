/*
 * SPDX-FileCopyrightText: 2024 SAP SE or an SAP affiliate company and Greenhouse contributors
 * SPDX-License-Identifier: Apache-2.0
 */

// TODO: Adjust mocked data after having new entities available in the API
module.exports = {
  gql: jest.fn(() => "mocked gql"),
  request: jest.fn(() => Promise.resolve({ data: "mocked data" })),
}
