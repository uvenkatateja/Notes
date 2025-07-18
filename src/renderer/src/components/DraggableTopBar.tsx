import { useEffect, useState } from 'react'
import {
  VscChromeMinimize,
  VscChromeMaximize,
  VscChromeRestore,
  VscChromeClose
} from 'react-icons/vsc'

export const DraggableTopBar = () => {
  const [isMaximized, setIsMaximized] = useState(false)

  useEffect(() => {
    const checkMaximized = async () => {
      const maximized = await window.context.isWindowMaximized()
      setIsMaximized(maximized)
    }
    checkMaximized()

    // Add event listener for window resize to update maximize state
    const handleResize = async () => {
      const maximized = await window.context.isWindowMaximized()
      setIsMaximized(maximized)
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  return (
    <header className="absolute top-0 left-0 right-0 h-8 flex justify-between items-center px-2 bg-app-gray-dark drag-region">
      <div className="flex-1" /> {/* Spacer */}
      <div className="flex items-center space-x-2 no-drag">
        <button
          onClick={() => window.context.minimizeWindow()}
          className="p-1 hover:bg-app-gray-light rounded-sm text-white transition-colors"
        >
          <VscChromeMinimize className="w-4 h-4" />
        </button>
        <button
          onClick={() => window.context.maximizeWindow()}
          className="p-1 hover:bg-app-gray-light rounded-sm text-white transition-colors"
        >
          {isMaximized ? (
            <VscChromeRestore className="w-4 h-4" />
          ) : (
            <VscChromeMaximize className="w-4 h-4" />
          )}
        </button>
        <button
          onClick={() => window.context.closeWindow()}
          className="p-1 hover:bg-red-600 rounded-sm text-white transition-colors"
        >
          <VscChromeClose className="w-4 h-4" />
        </button>
      </div>
    </header>
  )
}
