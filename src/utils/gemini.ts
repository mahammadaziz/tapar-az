import type { AIListingDraft, CategoryKey } from '@/types';
import { CATEGORIES } from '@/config/categories';
import axios from 'axios';

// ---------------------------------------------------------------------------
// Isolated Gemini 3.6 provider layer (PRD §7, §18 "Gemini Security").
// - Never hardcode privileged credentials — key comes from env at build time.
// - This module is the ONLY place that talks to the AI provider, so swapping
//   providers or moving the call behind a proxy later touches one file.
// - For a real production deploy, proxy this fetch through an endpoint you
//   control (Cloud Run/Vercel function, App Check-gated) instead of calling
//   Gemini directly from the browser with a public key.
// ---------------------------------------------------------------------------

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY as string | undefined;
const GEMINI_MODEL = (import.meta.env.VITE_GEMINI_MODEL as string | undefined) ?? 'gemini-3.6';
const GEMINI_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

export class GeminiUnavailableError extends Error {}

function buildCategoryContext(): string {
  return CATEGORIES.map((c) => {
    const fieldNames = c.subcategories.flatMap((s) => s.fields.map((f) => f.name)).join(', ');
    return `- ${c.key} (${c.label}): fields = [${fieldNames}]`;
  }).join('\n');
}

const SYSTEM_INSTRUCTION = `
You are the TAPAR.AZ AI listing assistant for an Azerbaijani classifieds marketplace.
The user will describe an item, vehicle, property, job vacancy, or service in free-form text
(likely Azerbaijani, possibly mixed with Russian/English).

STRICT RULES — DO NOT VIOLATE:
1. NEVER invent facts the user did not state. Do not claim mileage, engine specs, accident
   history, number of owners, features, service history, documents, or condition unless the
   user explicitly provided that information.
2. If a field cannot be confidently determined from the user's text, OMIT it from "attributes"
   and add a short note to "warnings" telling the user to fill it manually.
3. Choose exactly one "category" key and one "subcategory" key from this list, or null if unsure:
${buildCategoryContext()}
4. Output ONLY valid JSON matching this exact shape, no markdown fences, no commentary:
{
  "title": string,
  "description": string,
  "category": string | null,
  "subcategory": string | null,
  "price": number | null,
  "city": string | null,
  "phone": string | null,
  "address": string | null,
  "attributes": { [fieldName: string]: string | number | boolean },
  "keywords": string[],
  "tags": string[],
  "highlights": string[],
  "warnings": string[]
}
5. Write "title" and "description" in Azerbaijani, natural and concise, marketplace-appropriate.
`.trim();

interface GeminiCandidatePart { text?: string }
interface GeminiResponse {
  candidates?: { content?: { parts?: GeminiCandidatePart[] } }[];
}

export async function generateListingDraft(userInput: string, selectedCategory?: CategoryKey | null, selectedSubcategory?: string | null): Promise<AIListingDraft> {
  if (!GEMINI_API_KEY) {
    throw new GeminiUnavailableError('AI xidməti hazırda əlçatan deyil.');
  }

  let data: GeminiResponse;
  try {
    const response = await axios.post<GeminiResponse>(`${GEMINI_ENDPOINT}?key=${GEMINI_API_KEY}`, {
        systemInstruction: { parts: [{ text: SYSTEM_INSTRUCTION }] },
        contents: [{ role: 'user', parts: [{ text: `The seller selected category: ${selectedCategory ?? 'not selected'} and subcategory: ${selectedSubcategory ?? 'not selected'}. Keep these selections exactly when they are provided.\n\nSeller text:\n${userInput}` }] }],
        generationConfig: { temperature: 0.4, responseMimeType: 'application/json' },
      }, {
        headers: { 'Content-Type': 'application/json' },
    });
    data = response.data;
  } catch {
    throw new GeminiUnavailableError('AI xidmətinə qoşulmaq mümkün olmadı. İnternet bağlantınızı yoxlayın.');
  }
  const text = data.candidates?.[0]?.content?.parts?.map((p) => p.text ?? '').join('') ?? '';

  let parsed: Partial<AIListingDraft>;
  try {
    const cleaned = text.replace(/```json|```/g, '').trim();
    parsed = JSON.parse(cleaned);
  } catch {
    throw new GeminiUnavailableError('AI cavabını emal etmək mümkün olmadı. Zəhmət olmasa yenidən cəhd edin.');
  }

  return normalizeDraft(parsed);
}

export async function improveDescription(currentText: string, category: CategoryKey | null): Promise<string> {
  if (!GEMINI_API_KEY) throw new GeminiUnavailableError('AI xidməti hazırda əlçatan deyil.');

  const prompt = `Improve this Azerbaijani marketplace listing description for clarity and appeal,
without adding any new facts that are not already present. Category: ${category ?? 'unknown'}.
Return ONLY the improved description text, no JSON, no commentary.

Original description:
"""
${currentText}
"""`;

  let data: GeminiResponse;
  try {
    const response = await axios.post<GeminiResponse>(`${GEMINI_ENDPOINT}?key=${GEMINI_API_KEY}`, {
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
    }, {
      headers: { 'Content-Type': 'application/json' },
    });
    data = response.data;
  } catch {
    throw new GeminiUnavailableError('AI xidmətinə qoşulmaq mümkün olmadı.');
  }
  const text = data.candidates?.[0]?.content?.parts?.map((p) => p.text ?? '').join('').trim();
  if (!text) throw new GeminiUnavailableError('AI boş cavab qaytardı.');
  return text;
}

function normalizeDraft(raw: Partial<AIListingDraft>): AIListingDraft {
  return {
    title: raw.title ?? '',
    description: raw.description ?? '',
    category: (raw.category as CategoryKey) ?? null,
    subcategory: raw.subcategory ?? null,
    price: typeof raw.price === 'number' ? raw.price : null,
    city: raw.city ?? null,
    phone: raw.phone ?? null,
    address: raw.address ?? null,
    attributes: raw.attributes ?? {},
    keywords: Array.isArray(raw.keywords) ? raw.keywords : [],
    tags: Array.isArray(raw.tags) ? raw.tags : [],
    highlights: Array.isArray(raw.highlights) ? raw.highlights : [],
    warnings: Array.isArray(raw.warnings) ? raw.warnings : [],
  };
}
