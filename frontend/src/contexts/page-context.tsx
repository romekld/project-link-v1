/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'

export interface Breadcrumb {
  label: string
  href?: string
}

export interface PageMeta {
  title: string
  description?: string
  breadcrumbs: Breadcrumb[]
  /**
   * ReactNode slot rendered in the header, right of breadcrumbs.
   * Stabilize with useMemo to avoid re-render loops.
   */
  actions?: ReactNode
  /**
   * Auto-render an <h1> at the top of the content area using `title`.
   * Default: true. Set to false if the page renders its own heading.
   */
  showTitle?: boolean
  /**
   * When set, renders a back-arrow button in the header replacing the sidebar trigger.
   */
  backHref?: string
}

const defaultMeta: PageMeta = { title: '', breadcrumbs: [] }

const PageContext = createContext<{
  meta: PageMeta
  setMeta: (meta: PageMeta) => void
}>({ meta: defaultMeta, setMeta: () => {} })

export function PageProvider({ children }: { children: ReactNode }) {
  const [meta, setMeta] = useState<PageMeta>(defaultMeta)
  return (
    <PageContext.Provider value={{ meta, setMeta }}>
      {children}
    </PageContext.Provider>
  )
}

export function usePageMeta() {
  return useContext(PageContext).meta
}

export function useSetPageMeta(meta: PageMeta) {
  const { setMeta } = useContext(PageContext)
  // Exclude ReactNode fields from the serializable key to avoid JSON.stringify errors
  const { actions, ...serializableMeta } = meta
  const key = JSON.stringify(serializableMeta)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { setMeta({ ...JSON.parse(key) as Omit<PageMeta, 'actions'>, actions }) }, [key, actions])
}
