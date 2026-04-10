import { useRouterState } from '@tanstack/react-router'

function normalizePath(path: string) {
  if (!path || path === '/') return '/'
  return path.endsWith('/') ? path.slice(0, -1) : path
}

export function isRouteActive(pathname: string, targetPath: string, exact: boolean) {
  const current = normalizePath(pathname)
  const target = normalizePath(targetPath)

  if (exact) {
    return current === target
  }

  if (target === '/') {
    return current === target
  }

  return current === target || current.startsWith(`${target}/`)
}

export function useCurrentPathname() {
  return useRouterState({
    select: (state) => state.location.pathname,
  })
}
