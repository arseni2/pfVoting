import { createRootRoute, Outlet } from '@tanstack/react-router'

export const Route = createRootRoute({
  component: RootLayout,
})

function RootLayout() {
  return (
    <div className="min-h-screen bg-background">
      <div className="flex min-h-screen items-center justify-center p-4">
        <Outlet />
      </div>
    </div>
  )
}
