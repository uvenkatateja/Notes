import { cn, formatDateFromMs } from '@renderer/utils'
import { NoteInfo } from '@shared/models'
import { ComponentProps } from 'react'

export type NotePreviewProps = NoteInfo & {
  isActive?: boolean
} & ComponentProps<'div'>

export const NotePreview = ({
  title,
  content,
  lastEditTime,
  isActive = false,
  className,
  ...props
}: NotePreviewProps) => {
  const date = formatDateFromMs(lastEditTime)

  return (
    <div
      className={cn(
        'cursor-pointer p-3 rounded-lg transition-all duration-200',
        {
          'bg-app-gray-light text-white': isActive,
          'bg-app-gray hover:bg-app-gray-light text-gray-300 hover:text-white': !isActive
        },
        className
      )}
      {...props}
    >
      <h3 className="mb-2 font-bold truncate">{title}</h3>
      <span className="inline-block w-full text-xs opacity-60">{date}</span>
    </div>
  )
}
