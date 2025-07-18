import {
  appDirectoryName,
  fileEncoding,
  welcomeNoteFilename
} from '@shared/constants'
import { NoteInfo } from '@shared/models'
import {
  CreateNote,
  DeleteNote,
  GetNotes,
  ReadNote,
  WriteNote
} from '@shared/types'
import { dialog } from 'electron'
import { ensureDir, readFile, readdir, remove, stat, writeFile } from 'fs-extra'
import { isEmpty } from 'lodash'
import { homedir } from 'os'
import path from 'path'
import welcomeNoteFile from '../../../resources/welcomeNote.md?asset'

export const getRootDir = () => {
  const userHome = homedir().replace(/\\/g, '\\\\')
  const notesDir = path.join(userHome, appDirectoryName)
  return notesDir
}

export const ensureRootDir = async () => {
  const rootDir = getRootDir()

  try {
    await ensureDir(rootDir)
    return true
  } catch (error) {
    console.error('Failed to create directory:', error)

    try {
      const absolutePath = path.resolve(rootDir)
      await ensureDir(absolutePath)
      return true
    } catch (secondError) {
      console.error('Failed with absolute path:', secondError)
      await dialog.showMessageBox({
        type: 'error',
        title: 'Directory Error',
        message: `Could not create or access the notes directory.\nTried paths:\n${rootDir}\n${path.resolve(rootDir)}`
      })
      return false
    }
  }
}

export const createNote: CreateNote = async () => {
  const rootDir = getRootDir()

  if (!(await ensureRootDir())) {
    return false
  }

  try {
    const defaultPath = path.join(rootDir, 'Untitled.md')
    const { filePath, canceled } = await dialog.showSaveDialog({
      title: 'New note',
      defaultPath,
      buttonLabel: 'Create',
      properties: ['showOverwriteConfirmation'],
      showsTagField: false,
      filters: [{ name: 'Markdown', extensions: ['md'] }]
    })

    if (canceled || !filePath) {
      return false
    }

    const { name: filename, dir: parentDir } = path.parse(filePath)

    // Compare normalized paths
    const normalizedParentDir = path.normalize(parentDir)
    const normalizedRootDir = path.normalize(rootDir)

    if (normalizedParentDir !== normalizedRootDir) {
      await dialog.showMessageBox({
        type: 'error',
        title: 'Creation failed',
        message: `Notes must be saved in:\n${rootDir}\n\nCurrent location:\n${parentDir}`
      })
      return false
    }

    await writeFile(filePath, '')
    return filename
  } catch (error) {
    console.error('Failed to create note:', error)
    await dialog.showMessageBox({
      type: 'error',
      title: 'Creation Failed',
      message: 'Failed to create note. Please check the directory permissions.'
    })
    return false
  }
}

export const getNotes: GetNotes = async () => {
  const rootDir = getRootDir()

  if (!(await ensureRootDir())) {
    return []
  }

  try {
    const notesFileNames = await readdir(rootDir, {
      encoding: fileEncoding,
      withFileTypes: false
    })

    const notes = notesFileNames.filter((fileName) => fileName.endsWith('.md'))

    if (isEmpty(notes)) {
      const content = await readFile(welcomeNoteFile, { encoding: fileEncoding })
      await writeFile(path.join(rootDir, welcomeNoteFilename), content, {
        encoding: fileEncoding
      })
      notes.push(welcomeNoteFilename)
    }

    return Promise.all(notes.map(getNoteInfoFromFilename))
  } catch (error) {
    console.error('Failed to get notes:', error)
    return []
  }
}

export const getNoteInfoFromFilename = async (
  filename: string
): Promise<NoteInfo> => {
  try {
    const fileStats = await stat(path.join(getRootDir(), filename))
    return {
      title: filename.replace(/\.md$/, ''),
      lastEditTime: fileStats.mtimeMs
    }
  } catch (error) {
    console.error(`Failed to get note info for ${filename}:`, error)
    return {
      title: filename.replace(/\.md$/, ''),
      lastEditTime: Date.now()
    }
  }
}

export const readNote: ReadNote = async (filename) => {
  const rootDir = getRootDir()
  try {
    return await readFile(path.join(rootDir, `${filename}.md`), { encoding: fileEncoding })
  } catch (error) {
    console.error(`Failed to read note ${filename}:`, error)
    return ''
  }
}

export const writeNote: WriteNote = async (filename, content) => {
  if (!(await ensureRootDir())) {
    return
  }

  const rootDir = getRootDir()
  const filePath = path.join(rootDir, `${filename}.md`)

  try {
    await writeFile(filePath, content, { encoding: fileEncoding })
  } catch (error) {
    console.error(`Failed to write note ${filename}:`, error)
    await dialog.showMessageBox({
      type: 'error',
      title: 'Save Failed',
      message: `Failed to save note ${filename}. Please check if you have write permissions.`
    })
  }
}

export const deleteNote: DeleteNote = async (filename) => {
  const rootDir = getRootDir()

  try {
    const { response } = await dialog.showMessageBox({
      type: 'warning',
      title: 'Delete note',
      message: `Are you sure you want to delete ${filename}?`,
      buttons: ['Delete', 'Cancel'],
      defaultId: 1,
      cancelId: 1
    })

    if (response === 1) {
      return false
    }

    await remove(path.join(rootDir, `${filename}.md`))
    return true
  } catch (error) {
    console.error(`Failed to delete note ${filename}:`, error)
    await dialog.showMessageBox({
      type: 'error',
      title: 'Delete Failed',
      message: `Failed to delete note ${filename}. Please check your permissions.`
    })
    return false
  }
}
