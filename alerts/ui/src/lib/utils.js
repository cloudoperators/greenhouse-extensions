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

export const descriptionParsed = (text) => {
  if (!text) return ""
  // urls in descriptions follow the schema: <URL|URL-NAME>
  // Parse description and replace urls with a-tags
  const regexUrl = /<(http[^>|]+)\|([^>]+)>/g
  const urlParsed = text.replace(regexUrl, `<a href="$1">$2</a>`)

  // replace text wrapped in *..* by strong tags
  const regexBold = /\*(.*)\*/g
  const boldParsed = urlParsed.replace(regexBold, `<strong>$1</strong>`)

  const regexCode = /`(.*)`/g
  return boldParsed.replace(regexCode, `<code class="inline-code">$1</code>`)
}