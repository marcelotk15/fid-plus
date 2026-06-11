export function normalizeText(value: string): string {
  return value.replace(/\s+/g, ' ').trim().toLowerCase()
}

export function getTextContent(element: Element): string {
  return normalizeText(element.textContent ?? '')
}
