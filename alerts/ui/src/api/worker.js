import AlertsService from "./alertsService"

const alertsService = new AlertsService({
  initialFetch: true,
  watch: true,
  watchInterval: 300000, // 5 min
  onChange: ({ alerts }) =>
    self.postMessage({ action: "ALERTS_UPDATE", items: alerts }),
  onFetchStart: () => self.postMessage({ action: "ALERTS_FETCH_START" }),
  onFetchEnd: () => self.postMessage({ action: "ALERTS_FETCH_END" }),
})
// alertsService.watch((alerts) => self.postMessage({ alerts }))

self.onmessage = (e) => {
  const action = e.data.action

  switch (action) {
    case "ALERTS_CONFIGURE":
      alertsService.configure(e.data)
      break
  }
}
