import { doc, getDoc } from 'firebase/firestore';
import { firestore } from './firebase';
import type { OfferingKind } from '../types';

export type GuideFact = { label: string; value: string };
export type GuideScheduleRow = { when: string; what: string };
export type GuidePrompt = { name: string; help: string };
export type GuideStep = { step: string; text: string };
export type GuideVocabularyGroup = { group: string; words: string[] };

export type SessionGuide = {
  offeringId: OfferingKind | null;
  version: number;
  title: string;
  intro: string;
  facts: GuideFact[];
  schedule: GuideScheduleRow[];
  tastingCard: { title: string; prompts: GuidePrompt[]; note: string } | null;
  basics: GuideStep[];
  vocabulary: GuideVocabularyGroup[];
  vocabularyNote: string;
  beforeYouCome: string[];
  footer: string;
};

const maxTextLength = 2000;
const maxItems = 60;

function text(value: unknown): string {
  return typeof value === 'string' ? value.trim().slice(0, maxTextLength) : '';
}

function records(value: unknown): Record<string, unknown>[] {
  return Array.isArray(value)
    ? value.slice(0, maxItems).filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === 'object' && !Array.isArray(item))
    : [];
}

function texts(value: unknown): string[] {
  return Array.isArray(value) ? value.slice(0, maxItems).map(text).filter(Boolean) : [];
}

/**
 * Narrows a staff-seeded document into display data. Every value is plain text that React renders as
 * text, so nothing in the document can inject markup. Returns null when there is no usable content.
 */
export function parseSessionGuide(value: unknown): SessionGuide | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null;
  }
  const source = value as Record<string, unknown>;
  const card = source.tastingCard && typeof source.tastingCard === 'object' && !Array.isArray(source.tastingCard)
    ? source.tastingCard as Record<string, unknown>
    : null;

  const guide: SessionGuide = {
    offeringId: source.offeringId === 'cupping' || source.offeringId === 'brew101' ? source.offeringId : null,
    version: typeof source.version === 'number' && Number.isFinite(source.version) ? source.version : 1,
    title: text(source.title),
    intro: text(source.intro),
    facts: records(source.facts).map((item) => ({ label: text(item.label), value: text(item.value) })).filter((item) => item.label && item.value),
    schedule: records(source.schedule).map((item) => ({ when: text(item.when), what: text(item.what) })).filter((item) => item.when && item.what),
    tastingCard: card
      ? {
        title: text(card.title),
        prompts: records(card.prompts).map((item) => ({ name: text(item.name), help: text(item.help) })).filter((item) => item.name),
        note: text(card.note),
      }
      : null,
    basics: records(source.basics).map((item) => ({ step: text(item.step), text: text(item.text) })).filter((item) => item.step && item.text),
    vocabulary: records(source.vocabulary).map((item) => ({ group: text(item.group), words: texts(item.words) })).filter((item) => item.group && item.words.length > 0),
    vocabularyNote: text(source.vocabularyNote),
    beforeYouCome: texts(source.beforeYouCome),
    footer: text(source.footer),
  };

  const hasContent = guide.intro || guide.facts.length || guide.schedule.length || guide.basics.length
    || guide.vocabulary.length || guide.beforeYouCome.length || (guide.tastingCard && guide.tastingCard.prompts.length);
  return hasContent ? guide : null;
}

function jsonObject(value: unknown): Record<string, unknown> | null {
  if (typeof value !== 'string') {
    return null;
  }
  try {
    const parsed: unknown = JSON.parse(value);
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed as Record<string, unknown> : null;
  } catch {
    return null;
  }
}

/**
 * Reads the learner-only guide for a session. Firestore Rules are the authority: only a confirmed enrolee,
 * an assigned instructor, or an administrator can read it, so any error is treated as "no guide to show".
 * Staff may seed the content either as fields or as one JSON string in `contentJson` (easier to paste in Console).
 */
export async function loadSessionGuide(sessionId: string): Promise<SessionGuide | null> {
  if (!firestore) {
    return null;
  }
  try {
    const snapshot = await getDoc(doc(firestore, 'sessions', sessionId, 'guide', 'main'));
    if (!snapshot.exists()) {
      return null;
    }
    const data = snapshot.data();
    const content = jsonObject(data.contentJson) ?? data;
    return parseSessionGuide({
      ...content,
      offeringId: data.offeringId ?? content.offeringId,
      version: data.version ?? content.version,
      title: data.title ?? content.title,
    });
  } catch {
    return null;
  }
}
