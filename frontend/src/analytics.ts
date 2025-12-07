const SITE_ID = (import.meta as any).env?.VITE_ANALYTICS_SITE_ID || ''
const enabled = () => !!SITE_ID && localStorage.getItem('analytics_optout') !== '1'
export const trackPageView = (url: string) => {
  try {
    const ref = typeof document !== 'undefined' ? document.referrer : ''
    if (!enabled()) return
    const u: any = (window as any).umami
    if (u && typeof u.track === 'function') {
      u.track((props: any) => ({ ...props, url, referrer: ref }))
    }
  } catch {}
}
export const trackEvent = (name: string, props?: Record<string, any>) => {
  try {
    const url = typeof window !== 'undefined' ? window.location.pathname + window.location.search : ''
    if (!enabled()) return
    const u: any = (window as any).umami
    if (u && typeof u.track === 'function') {
      if (props) u.track(name, props)
      else u.track(name)
    }
  } catch {}
}
export const setAnalyticsOptOut = (optout: boolean) => {
  localStorage.setItem('analytics_optout', optout ? '1' : '0')
}
