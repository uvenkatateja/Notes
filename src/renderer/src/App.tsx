import {
  ActionButtonsRow,
  Content,
  DraggableTopBar,
  FloatingNoteTitle,
  MarkdownEditor,
  NotePreviewList,
  RootLayout,
  Sidebar
} from '@/components'
import { useRef } from 'react'

const App = () => {
  const contentContainerRef = useRef<HTMLDivElement>(null)

  const resetScroll = () => {
    contentContainerRef.current?.scrollTo(0, 0)
  }

  return (
    <div className="h-screen bg-app-black">
      <DraggableTopBar />
      <RootLayout>
        <Sidebar className="p-4">
          <ActionButtonsRow className="flex justify-between mb-4" />
          <NotePreviewList className="space-y-2" onSelect={resetScroll} />
        </Sidebar>

        <Content ref={contentContainerRef} className="border-l border-app-gray-light">
          <div className="p-4">
            <FloatingNoteTitle className="mb-4" />
            <MarkdownEditor />
          </div>
        </Content>
      </RootLayout>
    </div>
  )
}

export default App
