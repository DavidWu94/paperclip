import type { Resource } from "i18next";

import { assertValidLocaleMessages } from "./locale-validation";

export const DEFAULT_LOCALE = "en" as const;

const localeModules = import.meta.glob("./locales/*.json", {
  eager: true,
  import: "default",
}) as Record<string, unknown>;

const partialModules = import.meta.glob("./partials/*.json", {
  eager: true,
  import: "default",
}) as Record<string, unknown>;

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function deepMerge(base: unknown, extra: unknown): unknown {
  if (!isPlainObject(base) || !isPlainObject(extra)) return extra;
  const merged: Record<string, unknown> = { ...base };
  for (const [key, value] of Object.entries(extra)) {
    merged[key] = key in merged ? deepMerge(merged[key], value) : value;
  }
  return merged;
}

export const localeMessages = Object.fromEntries(
  Object.entries(localeModules).map(([path, messages]) => {
    const locale = path.match(/\/([A-Za-z0-9_-]+)\.json$/)?.[1];
    if (!locale) {
      throw new Error(`Invalid locale file path: ${path}`);
    }
    return [locale, messages];
  }),
);

if (!(DEFAULT_LOCALE in localeMessages)) {
  throw new Error(`Missing default locale messages for ${DEFAULT_LOCALE}`);
}

for (const [locale, messages] of Object.entries(localeMessages)) {
  try {
    assertValidLocaleMessages(messages);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Invalid ${locale} locale messages: ${message}`);
  }
}

const partialsByLocale = new Map<string, unknown[]>();
for (const [path, messages] of Object.entries(partialModules)) {
  const fileName = path.split("/").pop() ?? path;
  const locale = fileName.match(/\.([A-Za-z]{2,3}(?:-[A-Za-z]{2,4})?)\.json$/)?.[1];
  if (!locale) {
    throw new Error(`Invalid locale partial path: ${path}`);
  }
  const list = partialsByLocale.get(locale) ?? [];
  list.push(messages);
  partialsByLocale.set(locale, list);
}

let englishPartialTree: unknown = {};
for (const partial of partialsByLocale.get(DEFAULT_LOCALE) ?? []) {
  englishPartialTree = deepMerge(englishPartialTree, partial);
}

for (const [locale, partials] of partialsByLocale) {
  if (locale === DEFAULT_LOCALE) continue;
  let tree: unknown = {};
  for (const partial of partials) tree = deepMerge(tree, partial);
  try {
    assertValidLocaleMessages(tree, englishPartialTree);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Invalid ${locale} locale partial: ${message}`);
  }
}

const runtimeLocaleMessages = Object.fromEntries(
  Object.entries(localeMessages).map(([locale, messages]) => {
    let merged = messages;
    for (const partial of partialsByLocale.get(locale) ?? []) {
      merged = deepMerge(merged, partial);
    }
    return [locale, merged];
  }),
);

export const supportedLocales = Object.keys(localeMessages);

export const i18nextResources: Resource = Object.fromEntries(
  Object.entries(runtimeLocaleMessages).map(([locale, messages]) => [locale, { translation: messages }]),
) as Resource;

export type SupportedLocale = keyof typeof localeMessages;
