import type { Task } from '../types'

/**
 * Turns a daunting task into a short list of concrete, low-friction steps.
 *
 * Principles, tuned for ADHD avoidance:
 *  - The first step is always tiny and physical ("just open it") to beat the
 *    activation barrier — momentum comes from starting, not from planning.
 *  - Steps are concrete and verb-led, never vague.
 *  - The list stays short (3–6) so it reads as doable, not as a project.
 *
 * This runs entirely offline. Swap `breakDownTask` for a call to an LLM endpoint
 * to get smarter, more personalised steps without changing any UI.
 */
export function breakDownTask(task: Task): string[] {
  const title = task.title.trim()
  const lower = title.toLowerCase()
  const steps: string[] = []

  steps.push(activationStep(lower, title))
  steps.push(...middleSteps(lower))
  steps.push(finishStep(lower))

  const estimate = task.estimatedMinutes ?? 0
  if (estimate >= 50) {
    steps.splice(1, 0, 'Set a 25-minute timer and work only until it rings')
    steps.splice(2, 0, 'Take a 5-minute break, then do one more 25-minute sprint')
  }

  return dedupe(steps).slice(0, 6)
}

/**
 * Best-effort smart breakdown: ask the serverless LLM endpoint first, and fall
 * back to the offline heuristic if it's not configured, errors, or times out.
 * The caller always gets steps — the upgrade is invisible.
 */
export async function breakDownTaskSmart(task: Task): Promise<string[]> {
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 12000)
    const res = await fetch('/api/breakdown', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: task.title,
        notes: task.notes,
        estimatedMinutes: task.estimatedMinutes,
        energy: task.energy,
      }),
      signal: controller.signal,
    })
    clearTimeout(timeout)
    if (res.ok) {
      const data = (await res.json()) as { steps?: unknown }
      if (Array.isArray(data.steps) && data.steps.every((s) => typeof s === 'string')) {
        const steps = (data.steps as string[]).map((s) => s.trim()).filter(Boolean)
        if (steps.length > 0) return steps.slice(0, 6)
      }
    }
  } catch {
    // fall through to offline heuristic
  }
  return breakDownTask(task)
}

const has = (s: string, ...needles: string[]) => needles.some((n) => s.includes(n))

function activationStep(lower: string, title: string): string {
  if (has(lower, 'email', 'reply', 'message', 'respond'))
    return "Open your inbox and find the thread — don't reply yet"
  if (has(lower, 'call', 'phone', 'ring'))
    return 'Find the number and put the phone where you can see it'
  if (has(lower, 'write', 'draft', 'report', 'essay', 'blog', 'doc'))
    return 'Open a blank doc and type just the title'
  if (has(lower, 'clean', 'tidy', 'wash', 'laundry', 'dishes'))
    return 'Set a 2-minute timer and clear just one surface'
  if (has(lower, 'buy', 'order', 'shop', 'groceries'))
    return 'Open the shop/app and add the first item to the basket'
  if (has(lower, 'read', 'study', 'review', 'research'))
    return 'Open it and read only the first paragraph'
  if (has(lower, 'code', 'fix', 'bug', 'build', 'deploy'))
    return 'Open the project and read the relevant file — no edits yet'
  if (has(lower, 'pay', 'invoice', 'bill', 'tax'))
    return 'Gather the amount and the login in one place'
  if (has(lower, 'book', 'schedule', 'appointment', 'reserve'))
    return 'Open the booking page and pick a rough date'
  return `Put "${title.slice(0, 40)}" on screen and look at it for 2 minutes`
}

function middleSteps(lower: string): string[] {
  if (has(lower, 'email', 'reply', 'message', 'respond'))
    return ['Write a one-line answer to the main question', 'Add any details, then re-read once']
  if (has(lower, 'call', 'phone', 'ring'))
    return ['Jot the 2–3 points you need to cover', 'Make the call']
  if (has(lower, 'write', 'draft', 'report', 'essay', 'blog', 'doc'))
    return ['Bullet the 3 main points you want to make', 'Turn each bullet into a rough sentence — messy is fine']
  if (has(lower, 'clean', 'tidy', 'wash', 'laundry', 'dishes'))
    return ['Do the next surface, then the next', 'Put away anything that has a clear home']
  if (has(lower, 'buy', 'order', 'shop', 'groceries'))
    return ['Add the rest of the items', 'Check delivery/pickup and confirm']
  if (has(lower, 'read', 'study', 'research'))
    return ['Read one section and note a single takeaway', 'Decide the one thing to do with what you read']
  if (has(lower, 'code', 'fix', 'bug', 'build', 'deploy'))
    return ['Reproduce the issue or write the smallest failing case', 'Make the smallest change that could work, then test it']
  if (has(lower, 'plan', 'organize', 'organise', 'prepare'))
    return ['List everything on your mind about it — brain dump', 'Pick the single most important item']
  return ['Do the most obvious next part for 10 minutes', 'Notice what’s left and pick the next small piece']
}

function finishStep(lower: string): string {
  if (has(lower, 'email', 'reply', 'message', 'respond')) return 'Hit send'
  if (has(lower, 'call', 'phone')) return 'Note the outcome and any follow-up'
  if (has(lower, 'write', 'draft', 'report')) return 'Send/save it — done beats perfect'
  if (has(lower, 'pay', 'invoice', 'bill')) return 'Confirm the payment went through'
  return 'Mark it done and take a breath — you did it'
}

function dedupe(items: string[]): string[] {
  return Array.from(new Set(items))
}
