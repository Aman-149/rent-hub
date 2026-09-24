import { Router, Request, Response } from 'express';
import { optionalAuth, AuthenticatedRequest } from '../middleware/auth';

const router = Router();

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini';
const OPENAI_URL = 'https://api.openai.com/v1/chat/completions';

const SYSTEM_PROMPT = `You are "RentHub Assistant", a friendly, concise AI guide embedded in a chat widget on the RentHub rental platform.

SCOPE: Only answer questions about browsing/searching rental properties, listing a property, contacting hosts/landlords, bookings, accounts, and general RentHub navigation. Politely decline anything unrelated (e.g. coding help, general trivia) and redirect back to RentHub topics.

KNOWLEDGE BASE:
- Browsing: search properties from the "Browse Properties" page using location and price filters.
- Listing: logged-in landlords click "Add Listing" in the navbar, add details/photos, and set a daily or monthly rate.
- Contacting hosts: click "Contact Host" on a property's details page to message the landlord directly.
- Accounts: creating an account and browsing listings are both free.

STYLE: Keep every reply to 2-3 short sentences, no markdown headers, no long lists. Be direct and tell users exactly what to click. End with a brief next-step suggestion when useful.`;

const MAX_MESSAGE_LENGTH = 1000;
const MAX_HISTORY_MESSAGES = 10;

// Simple in-memory sliding-window rate limiter (per IP or user id)
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX_REQUESTS = 15;
const requestLog = new Map<string, number[]>();

function isRateLimited(key: string): boolean {
  const now = Date.now();
  const timestamps = (requestLog.get(key) || []).filter(
    (t) => now - t < RATE_LIMIT_WINDOW_MS
  );
  if (timestamps.length >= RATE_LIMIT_MAX_REQUESTS) {
    requestLog.set(key, timestamps);
    return true;
  }
  timestamps.push(now);
  requestLog.set(key, timestamps);
  return false;
}

// Periodically clear stale rate-limit entries so the map doesn't grow unbounded
setInterval(() => {
  const now = Date.now();
  for (const [key, timestamps] of requestLog.entries()) {
    const fresh = timestamps.filter((t) => now - t < RATE_LIMIT_WINDOW_MS);
    if (fresh.length === 0) requestLog.delete(key);
    else requestLog.set(key, fresh);
  }
}, RATE_LIMIT_WINDOW_MS).unref();

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

// POST /api/chat
router.post('/', optionalAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!OPENAI_API_KEY) {
      console.error('OPENAI_API_KEY is not configured');
      return res.status(503).json({ error: 'Chat assistant is currently unavailable.' });
    }

    const rateLimitKey = req.user?.id || req.ip || 'anonymous';
    if (isRateLimited(rateLimitKey)) {
      return res.status(429).json({ error: 'Too many messages. Please wait a moment and try again.' });
    }

    const { message, history } = req.body as { message?: string; history?: ChatMessage[] };

    if (!message || typeof message !== 'string' || !message.trim()) {
      return res.status(400).json({ error: 'A message is required.' });
    }

    if (message.length > MAX_MESSAGE_LENGTH) {
      return res.status(400).json({ error: `Message is too long (max ${MAX_MESSAGE_LENGTH} characters).` });
    }

    const safeHistory: ChatMessage[] = Array.isArray(history)
      ? history
          .filter(
            (m): m is ChatMessage =>
              m &&
              (m.role === 'user' || m.role === 'assistant') &&
              typeof m.content === 'string' &&
              m.content.length <= MAX_MESSAGE_LENGTH
          )
          .slice(-MAX_HISTORY_MESSAGES)
      : [];

    const messages = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...safeHistory.map((m) => ({ role: m.role, content: m.content })),
      { role: 'user', content: message.trim() },
    ];

    const response = await fetch(OPENAI_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: OPENAI_MODEL,
        messages,
        temperature: 0.4,
        max_tokens: 200,
      }),
    });

    if (!response.ok) {
      const errBody = await response.text().catch(() => '');
      console.error('OpenAI API error:', response.status, errBody);
      return res.status(502).json({ error: 'The chat assistant is having trouble responding. Please try again.' });
    }

    const data = await response.json();
    const reply = data?.choices?.[0]?.message?.content?.trim();

    if (!reply) {
      return res.status(502).json({ error: 'The chat assistant returned an empty response.' });
    }

    return res.json({ reply });
  } catch (error) {
    console.error('Chat error:', error);
    return res.status(500).json({ error: 'Failed to process your message. Please try again.' });
  }
});

export default router;
