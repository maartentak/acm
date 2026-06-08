/**
 * Real Google Calendar integration via Google Identity Services (GIS).
 *
 * Activated only when VITE_GOOGLE_CLIENT_ID is set (a Web OAuth client from the
 * Google Cloud Console). Without it, the app stays in demo mode. We request the
 * read-only Calendar scope and only ever read free/busy times — never event
 * details, and never write.
 *
 * See web/README.md → "Connecting real Google Calendar" for the one-time setup.
 */

const SCOPE =
  'https://www.googleapis.com/auth/calendar.readonly https://www.googleapis.com/auth/calendar.events'
const GIS_SRC = 'https://accounts.google.com/gsi/client'

export const googleClientId = (): string | undefined => import.meta.env.VITE_GOOGLE_CLIENT_ID
export const isGoogleConfigured = (): boolean => !!googleClientId()

let gisPromise: Promise<void> | null = null

function loadGis(): Promise<void> {
  if (window.google?.accounts?.oauth2) return Promise.resolve()
  if (gisPromise) return gisPromise
  gisPromise = new Promise<void>((resolve, reject) => {
    const script = document.createElement('script')
    script.src = GIS_SRC
    script.async = true
    script.defer = true
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('Failed to load Google Identity Services'))
    document.head.appendChild(script)
  })
  return gisPromise
}

/**
 * Prompt the user to sign in and grant Calendar read access, returning an access
 * token. `selectAccount` forces the account chooser so a second call can connect
 * a different (e.g. personal) account.
 */
export async function requestAccessToken(selectAccount = false): Promise<string> {
  const clientId = googleClientId()
  if (!clientId) throw new Error('Google client ID not configured')
  await loadGis()

  return new Promise<string>((resolve, reject) => {
    const tokenClient = window.google!.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: SCOPE,
      prompt: selectAccount ? 'select_account' : '',
      callback: (resp: { access_token?: string; error?: string }) => {
        if (resp.access_token) resolve(resp.access_token)
        else reject(new Error(resp.error || 'Authorization failed'))
      },
    })
    tokenClient.requestAccessToken()
  })
}

async function calendarIds(token: string): Promise<string[]> {
  const res = await fetch('https://www.googleapis.com/calendar/v3/users/me/calendarList', {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) throw new Error(`calendarList ${res.status}`)
  const data = (await res.json()) as { items?: { id: string; selected?: boolean }[] }
  return (data.items ?? []).map((c) => c.id)
}

/** Busy intervals for one account across all its calendars within the window. */
export async function fetchBusy(
  token: string,
  fromMillis: number,
  toMillis: number,
): Promise<{ start: number; end: number }[]> {
  const ids = await calendarIds(token)
  if (ids.length === 0) return []

  const res = await fetch('https://www.googleapis.com/calendar/v3/freeBusy', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      timeMin: new Date(fromMillis).toISOString(),
      timeMax: new Date(toMillis).toISOString(),
      items: ids.map((id) => ({ id })),
    }),
  })
  if (!res.ok) throw new Error(`freeBusy ${res.status}`)

  const data = (await res.json()) as {
    calendars?: Record<string, { busy?: { start: string; end: string }[] }>
  }
  const intervals: { start: number; end: number }[] = []
  for (const cal of Object.values(data.calendars ?? {})) {
    for (const b of cal.busy ?? []) {
      intervals.push({ start: Date.parse(b.start), end: Date.parse(b.end) })
    }
  }
  return intervals
}

/**
 * Create a timed event on the account's primary calendar so the scheduled task
 * shows up in Google Calendar. Requires the calendar.events scope (reconnect if
 * you connected before this was added). Returns the event's htmlLink.
 */
export async function createEvent(
  token: string,
  summary: string,
  startMillis: number,
  endMillis: number,
  description = '',
): Promise<string> {
  const res = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      summary,
      description,
      start: { dateTime: new Date(startMillis).toISOString() },
      end: { dateTime: new Date(endMillis).toISOString() },
      reminders: { useDefault: true },
    }),
  })
  if (!res.ok) throw new Error(`createEvent ${res.status}`)
  const data = (await res.json()) as { htmlLink?: string }
  return data.htmlLink ?? ''
}
