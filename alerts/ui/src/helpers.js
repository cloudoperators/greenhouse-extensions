export const parseError = (error) => {
  let errMsg = JSON.stringify(error)
  if (error?.message) {
    errMsg = error?.message
    try {
      errMsg = JSON.parse(error?.message).msg
    } catch (error) {}
  }
  return errMsg
}
