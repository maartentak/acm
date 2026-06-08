import type { VercelRequest, VercelResponse } from '@vercel/node'
import Anthropic from '@anthropic-ai/sdk'

/**
 * Serverless endpoint that turns a task into tiny, ADHD-friendly steps using Claude.
 *
 * The API key lives only here (server-side) — never in the browser bundle. If
 * ANTHROPIC_API_KEY isn't set, we return 501 and the client falls back to its
 * built-in offline heuristic, so the app keeps working without configuration.
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    res.status(501).json({ error: 'LLM breakdown not configured' })
    return
  }

  const { title, notes, estimatedMinutes, energy } = (req.body ?? {}) as {
    title?: string
    notes?: string
    estimatedMinutes?: number | null
    energy?: string
  }

  if (!title || typeof title !== 'string') {
    res.status(400).json({ error: 'Missing task title' })
    return
  }

  const client = new Anthropic({ apiKey })

  const system = [
    'You break daunting tasks into a short list of concrete, low-friction steps for someone with ADHD.',
    'Principles:',
    '- The FIRST step is always tiny and physical ("just open it") to beat the activation barrier — momentum comes from starting, not planning.',
    '- Each step is concrete and verb-led, never vague ("decide what to do").',
    '- Keep it to 3–6 steps so it reads as doable, not as a project.',
    '- End with a clear finish line so completion feels real.',
    '',
    'Respond with ONLY a JSON object of the form {"steps": ["...", "..."]} and no other text.',
  ].join('\n')

  const userText =
    `Task: ${title}\n` +
    (notes ? `Notes: ${notes}\n` : '') +
    (estimatedMinutes ? `Rough size: ${estimatedMinutes} minutes\n` : '') +
    (energy ? `Energy available: ${energy}\n` : '') +
    '\nReturn the steps as JSON.'

  try {
    const response = await client.messages.create({
      model: 'claude-opus-4-8',
      max_tokens: 1024,
      system,
      messages: [{ role: 'user', content: userText }],
    })

    const text = response.content
      .filter((b) => b.type === 'text')
      .map((b) => (b as { text: string }).text)
      .join('')

    const steps = extractSteps(text)
    if (steps.length === 0) {
      res.status(502).json({ error: 'No steps produced' })
      return
    }

    res.status(200).json({ steps })
  } catch (err) {
    console.error('breakdown error', err)
    res.status(502).json({ error: 'Breakdown failed' })
  }
}

/** Pull a string[] of steps out of the model's reply, tolerating stray prose or code fences. */
function extractSteps(text: string): string[] {
  const start = text.indexOf('{')
  const end = text.lastIndexOf('}')
  if (start !== -1 && end > start) {
    try {
      const parsed = JSON.parse(text.slice(start, end + 1))
      if (Array.isArray(parsed?.steps)) {
        return parsed.steps
          .filter((s: unknown): s is string => typeof s === 'string')
          .map((s: string) => s.trim())
          .filter(Boolean)
          .slice(0, 6)
      }
    } catch {
      // fall through
    }
  }
  return []
}
