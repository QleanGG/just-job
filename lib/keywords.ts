const STOP_WORDS = new Set([
  "the", "a", "an", "is", "are", "was", "were", "be", "been", "being",
  "have", "has", "had", "do", "does", "did", "will", "would", "could",
  "should", "may", "might", "must", "shall", "can", "need", "to", "of",
  "in", "for", "on", "at", "by", "from", "with", "as", "or", "and", "not",
  "but", "if", "than", "that", "this", "which", "what", "who", "how",
  "when", "where", "why", "also", "into", "out", "up", "down", "over",
  "under", "about", "such", "so", "just", "more", "most", "some", "any",
  "all", "each", "every", "both", "few", "many", "much", "other", "another",
  "own", "same", "then", "now", "here", "there", "after", "before",
  "between", "through", "during", "above", "below", "since", "while",
  "because", "although", "though", "unless", "until", "against",
  "among", "your", "you", "we", "they", "them", "their", "it", "its",
]);

export function extractKeywords(text: string): string[] {
  return [...new Set(
    text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)
      .filter((word) => word.length > 3 && !STOP_WORDS.has(word))
  )].slice(0, 30);
}
