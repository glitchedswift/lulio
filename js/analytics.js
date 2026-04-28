export function trackPageView(path) {
  window.goatcounter?.count({ path, event: false });
}

export function trackEvent(name) {
  window.goatcounter?.count({ path: name, event: true });
}
