// =====================================================================
// Identimarketing SaaS - Empire OS skill registry
//
// Loads `.agents/skills/<slug>/SKILL.md` files from disk and exposes them
// as system prompts for the LLM executor. Skills are cached in-process
// after first load (production) and re-read on every call in dev.
//
// Each SKILL.md must have YAML frontmatter:
//   ---
//   name: copywriting
//   description: When the user wants to write...
//   metadata:
//     version: 1.0.0
//   ---
// =====================================================================

import { promises as fs } from 'node:fs';
import path from 'node:path';

import matter from 'gray-matter';

import { logger } from '@/lib/logging';

export interface Skill {
  /** Folder slug, e.g. "copywriting" */
  slug: string;
  /** Frontmatter `name` (falls back to slug). */
  name: string;
  /** Frontmatter `description`. */
  description: string;
  /** Markdown body (without frontmatter) - used as the system prompt. */
  systemPrompt: string;
  /** Absolute path to SKILL.md. */
  filePath: string;
  /** Frontmatter version (optional). */
  version?: string;
}

const SKILLS_DIR = path.join(process.cwd(), '.agents', 'skills');

let cache: Map<string, Skill> | null = null;
let loadedAt = 0;
const CACHE_TTL_MS = process.env.NODE_ENV === 'production' ? 24 * 60 * 60 * 1000 : 5_000;

async function readSkillFile(slug: string, filePath: string): Promise<Skill | null> {
  try {
    const raw = await fs.readFile(filePath, 'utf-8');
    const parsed = matter(raw);
    const fm = parsed.data as { name?: string; description?: string; metadata?: { version?: string } };
    return {
      slug,
      name: typeof fm.name === 'string' && fm.name.length > 0 ? fm.name : slug,
      description: typeof fm.description === 'string' ? fm.description : '',
      systemPrompt: parsed.content.trim(),
      filePath,
      version: fm.metadata?.version,
    };
  } catch (err) {
    logger.warn('empire-os: failed to read skill file', {
      slug,
      filePath,
      err: err instanceof Error ? err.message : String(err),
    });
    return null;
  }
}

async function loadAll(): Promise<Map<string, Skill>> {
  const map = new Map<string, Skill>();
  let entries: import('node:fs').Dirent[] = [];
  try {
    entries = await fs.readdir(SKILLS_DIR, { withFileTypes: true });
  } catch (err) {
    logger.error('empire-os: skills directory missing', {
      dir: SKILLS_DIR,
      err: err instanceof Error ? err.message : String(err),
    });
    return map;
  }
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const skillFile = path.join(SKILLS_DIR, entry.name, 'SKILL.md');
    const skill = await readSkillFile(entry.name, skillFile);
    if (skill) map.set(skill.slug, skill);
  }
  return map;
}

export async function getRegistry(): Promise<Map<string, Skill>> {
  const now = Date.now();
  if (cache && now - loadedAt < CACHE_TTL_MS) return cache;
  cache = await loadAll();
  loadedAt = now;
  return cache;
}

export async function listSkills(): Promise<Skill[]> {
  const reg = await getRegistry();
  return Array.from(reg.values()).sort((a, b) => a.slug.localeCompare(b.slug));
}

export async function getSkill(slug: string): Promise<Skill | undefined> {
  const reg = await getRegistry();
  return reg.get(slug);
}

export async function getSkillsBySlugs(slugs: string[]): Promise<Skill[]> {
  const reg = await getRegistry();
  const out: Skill[] = [];
  for (const slug of slugs) {
    const skill = reg.get(slug);
    if (skill) out.push(skill);
  }
  return out;
}

/** Force a reload (used by tests + the cron worker after deploys). */
export function invalidateRegistry(): void {
  cache = null;
  loadedAt = 0;
}

/** All known skill slugs currently installed in .agents/skills/. */
export async function allSlugs(): Promise<string[]> {
  const reg = await getRegistry();
  return Array.from(reg.keys()).sort();
}
