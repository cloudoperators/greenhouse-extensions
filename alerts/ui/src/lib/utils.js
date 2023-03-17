export const severityToSemanticName = (severity) => {
  switch (severity) {
    case "critical":
      return "danger"
    case "warning":
      return "warning"
    case "info":
      return "info"
    default:
      return severity
  }
}