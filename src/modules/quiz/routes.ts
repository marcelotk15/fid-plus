import { FID_ROUTE } from '~/modules/shared/consts'

export function isQuizRoute(pathname: string): boolean {
  return pathname.startsWith(FID_ROUTE.QUIZ)
}
