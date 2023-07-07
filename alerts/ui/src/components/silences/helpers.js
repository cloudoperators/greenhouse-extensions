export const DEFAULT_DURATION_OPTIONS = [
  { label: "2 hours", value: "2" },
  { label: "12 hours", value: "12" },
  { label: "1 day", value: "24" },
  { label: "3 days", value: "72" },
  { label: "7 days", value: "168" },
]

// get the "latest" expiration date from the given silences
export const latestExpirationDate = (silences) => {
  if (silences?.length > 0) {
    const sortedSilences = silences.sort((a, b) => {
      return new Date(b.endsAt) - new Date(a.endsAt)
    })
    return sortedSilences[0].endsAt
  }
}

// returns options for duration select dropdown. Options with which exceeds the expiration date are marked as "covered"
// return also the first option which is not covered by the expiration date
export const getSelectOptions = (expirationDate) => {
  if (!expirationDate) return { items: DEFAULT_DURATION_OPTIONS }
  const now = new Date()
  const expiration = new Date(expirationDate)
  const diff = expiration - now
  const diffInHours = diff / (1000 * 60 * 60)
  const options = DEFAULT_DURATION_OPTIONS.map((o) => {
    if (o.value <= diffInHours) {
      return {
        ...o,
        label: o.label + " (covered with the existing silence)",
        covered: true,
      }
    }
    return o
  })
  // find the first option which is not covered by the expiration date
  const firstNotCovered = options.find((o) => !o?.covered)

  return { items: options, firstNotCovered }
}
