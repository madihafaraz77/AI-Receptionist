/**
 * Framework-free validation for approved AI knowledge entries.
 *
 * The AI receptionist must not invent policy content, so entries are plain
 * facts and wording the doctor or staff can explain. The server action is the
 * authority; the browser only helps the form submit.
 */

export const KNOWLEDGE_CATEGORIES = [
  "hours",
  "services",
  "fees",
  "policies",
  "faq",
] as const;

export type KnowledgeCategory = (typeof KNOWLEDGE_CATEGORIES)[number];

export type KnowledgeEntryInput = {
  title: string;
  category: KnowledgeCategory;
  content: string;
  isActive: boolean;
};

export type FieldErrors = Record<string, string>;

export type ValidationResult<T> =
  | { ok: true; data: T }
  | { ok: false; errors: FieldErrors };

function readText(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function readChecked(formData: FormData, key: string): boolean {
  const value = formData.get(key);
  return value === "on" || value === "true";
}

export function parseKnowledgeEntryForm(
  formData: FormData,
): ValidationResult<KnowledgeEntryInput> {
  const title = readText(formData, "title");
  const category = readText(formData, "category");
  const content = readText(formData, "content");
  const errors: FieldErrors = {};

  if (title.length < 2 || title.length > 120) {
    errors.title = "Title must be between 2 and 120 characters.";
  }

  if (!KNOWLEDGE_CATEGORIES.includes(category as KnowledgeCategory)) {
    errors.category = "Choose a valid knowledge category.";
  }

  if (content.length < 20 || content.length > 2000) {
    errors.content =
      "Content must be between 20 and 2000 characters and remain factual.";
  }

  if (Object.keys(errors).length > 0) {
    return { ok: false, errors };
  }

  return {
    ok: true,
    data: {
      title,
      category: category as KnowledgeCategory,
      content,
      isActive: readChecked(formData, "isActive"),
    },
  };
}
