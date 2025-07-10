export function isHydrating(isLoading: boolean, data: unknown): boolean {
  return typeof window === 'undefined' || isLoading || data === undefined || !data;
}
