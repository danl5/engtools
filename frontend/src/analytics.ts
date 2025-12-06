const COLLECT = (import.meta as any).env?.VITE_ANALYTICS_COLLECT || ''
const SITE_ID = (import.meta as any).env?.VITE_ANALYTICS_SITE_ID || ''
const enabled = () => !!COLLECT && !!SITE_ID && localStorage.getItem('analytics_optout') !== '1'
const send = (payload: any) => {
  if (!enabled()) return
  const body = JSON.stringify(payload)
  if (navigator.sendBeacon) {
    const blob = new Blob([body], { type: 'application/json' })
    navigator.sendBeacon(COLLECT, blob)
    return
  }
  fetch(COLLECT, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body, keepalive: true }).catch(() => {})
}
export const trackPageView = (page: string) => {
  try {
    send({ type: 'page_view', siteId: SITE_ID, page, url: typeof window !== 'undefined' ? window.location.href : '', referrer: typeof document !== 'undefined' ? document.referrer : '', ts: Date.now() })
  } catch {}
}
export const trackEvent = (name: string, props?: Record<string, any>) => {
  try {
    send({ type: 'event', siteId: SITE_ID, name, props: props || {}, url: typeof window !== 'undefined' ? window.location.href : '', ts: Date.now() })
  } catch {}
}
export const setAnalyticsOptOut = (optout: boolean) => {
  localStorage.setItem('analytics_optout', optout ? '1' : '0')
}
