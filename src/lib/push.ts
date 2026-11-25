import type { Sub } from './db'

export type Payload = { title: string; body: string; url?: string | null }

/** Sends Web Push messages. Does nothing (safely) when VAPID keys are not configured. */
export async function sendPush(subs: Sub[], payload: Payload) {
  const pub = process.env.VAPID_PUBLIC_KEY, priv = process.env.VAPID_PRIVATE_KEY
  if (!pub || !priv || !subs.length) return { sent: 0, failed: 0, gone: [] as string[] }
  const mod: any = await import('web-push'); const webpush = mod.default ?? mod
  webpush.setVapidDetails(process.env.VAPID_SUBJECT || 'mailto:laichisland@gmail.com', pub, priv)
  const gone: string[] = []; let sent = 0, failed = 0
  await Promise.all(subs.map(async (s) => {
    try {
      await webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, JSON.stringify(payload), { TTL: 86400 })
      sent++
    } catch (e: any) {
      failed++; if (e?.statusCode === 404 || e?.statusCode === 410) gone.push(s.endpoint)   // subscription expired
    }
  }))
  return { sent, failed, gone }
}
