const PLAYER_UUID_RE = /^\/player\/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})$/i

export function getPlayerProfileId(pathname: string): string | null {
  const match = PLAYER_UUID_RE.exec(pathname)

  return match?.[1] ?? null
}

export function isPlayerProfileRoute(pathname: string): boolean {
  return getPlayerProfileId(pathname) !== null
}
