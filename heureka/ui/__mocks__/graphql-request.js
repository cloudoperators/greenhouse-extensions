// TODO: Adjust mocked data after having new entities available in the API
module.exports = {
  gql: jest.fn(() => "mocked gql"),
  request: jest.fn(() => Promise.resolve({ data: "mocked data" })),
}
