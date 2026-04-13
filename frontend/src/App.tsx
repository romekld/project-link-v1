import { RouterProvider } from '@tanstack/react-router'
import { router } from '@/app/router'
import { PwaProvider } from '@/components/pwa/pwa-provider'
import { TooltipProvider } from '@/components/ui/tooltip'

export default function App() {
  return (
    <TooltipProvider>
      <PwaProvider>
        <RouterProvider router={router} />
      </PwaProvider>
    </TooltipProvider>
  )
}
