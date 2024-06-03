export const listOfCommaSeparatedObjs = (objs) => {
  objs = objs?.edges || []
  return objs
    .filter((obj) => obj?.node?.name)
    .map((obj) => obj?.node?.name)
    .join(", ")
}
