import { ComponentProps, forwardRef } from 'react'
import { twMerge } from 'tailwind-merge'

export const RootLayout = ({ children, className, ...props }: ComponentProps<'main'>) => {
  return (
    <main
      className={twMerge('flex flex-row h-[calc(100vh-2rem)] mt-8 bg-app-black', className)}
      {...props}
    >
      {children}
    </main>
  )
}

export const Sidebar = ({ children, className, ...props }: ComponentProps<'aside'>) => {
  return (
    <aside
      className={twMerge(
        'w-[250px] h-full overflow-y-auto bg-app-gray-dark border-r border-app-gray-light',
        className
      )}
      {...props}
    >
      {children}
    </aside>
  )
}

export const Content = forwardRef<HTMLDivElement, ComponentProps<'div'>>(
  ({ children, className, ...props }, ref) => (
    <div
      className={twMerge('flex-1 h-full overflow-y-auto bg-app-black', className)}
      ref={ref}
      {...props}
    >
      {children}
    </div>
  )
)

Content.displayName = 'Content'
