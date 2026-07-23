export type RouteChangePayload = {
  href: string
  pathname: string
  search: string
}

let activeRoute: RouteChangePayload | null = null

export function handleRouteChange(payload: RouteChangePayload): void {
  activeRoute = payload
}

export function getActiveRoute(): RouteChangePayload | null {
  return activeRoute
}

export function getActivePathname(): string {
  return activeRoute?.pathname ?? ''
}

export function resetRouteState(): void {
  activeRoute = null
}
