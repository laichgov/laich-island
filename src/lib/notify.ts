import * as db from './db'
import { sendPush, type Payload } from './push'

/** Stores an in-app notification for every recipient and also sends a browser push to those who subscribed. */
export async function notify(ids: number[], n: Payload) {
  const list = [...new Set(ids)]
  if (!list.length) return { recipients: 0, pushed: 0 }
  await db.addNotices(list, n)
  const r = await sendPush(await db.subsFor(list), n)
  for (const ep of r.gone) await db.dropSub(ep)
  return { recipients: list.length, pushed: r.sent }
}
