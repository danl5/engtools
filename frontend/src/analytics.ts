const COLLECT = (import.meta as any).env?.VITE_ANALYTICS_COLLECT || ''
const SITE_ID = (import.meta as any).env?.VITE_ANALYTICS_SITE_ID || ''
const enabled = () => !!COLLECT && !!SITE_ID && localStorage.getItem('analytics_optout') !== '1'
const send = (type: 'pageview' | 'event', payload: any) => {
  if (!enabled()) return
  const body = JSON.stringify({ type, payload })
  if (navigator.sendBeacon) {
    const blob = new Blob([body], { type: 'application/json' })
    navigator.sendBeacon(COLLECT, blob)
    return
  }
  fetch(COLLECT, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body, keepalive: true }).catch(() => {})
}
export const trackPageView = (url: string) => {
  try {
    const ref = typeof document !== 'undefined' ? document.referrer : ''
    send('pageview', { website: SITE_ID, url, referrer: ref })
  } catch {}
}
export const trackEvent = (name: string, props?: Record<string, any>) => {
  try {
    const url = typeof window !== 'undefined' ? window.location.pathname + window.location.search : ''
    send('event', { website: SITE_ID, url, name, data: props || {} })
  } catch {}
}
export const setAnalyticsOptOut = (optout: boolean) => {
  localStorage.setItem('analytics_optout', optout ? '1' : '0')
}
