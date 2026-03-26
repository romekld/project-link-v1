import { Providers } from '@/app/providers'

export default function App() {
  return (
    <Providers>
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="text-center">
          <h1 className="font-heading text-2xl font-semibold tracking-tight">Project LINK</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Local Information Network for Kalusugan — Phase 1 Infrastructure
          </p>
        </div>
      </div>
    </Providers>
  )
}
