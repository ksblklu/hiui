import { useState, useEffect, useCallback, useRef } from 'react'
import request from '../request'
import { getFileType } from '../util'
import { v4 as uuidV4 } from 'uuid'

const useUpload = ({
  fileList,
  defaultFileList,
  onChange,
  uploadAction,
  maxSize,
  name,
  withCredentials,
  headers,
  data,
  onRemove
}) => {
  const [_fileList, updateFileList] = useState(fileList || defaultFileList || [])
  const fileListRef = useRef(fileList || defaultFileList || [])
  useEffect(() => {
    if (fileList) {
      updateFileList(fileList)
    }
  }, [fileList])

  const deleteFile = useCallback((file, index) => {
    if (file.abort) {
      file.abort()
    }
    let result = true
    if (onRemove) {
      result = onRemove(file)
    }
    if (!fileList) {
      if (result === true) {
        const newFileList = [...fileListRef.current]
        newFileList.splice(index, 1)
        fileListRef.current = newFileList
        updateFileList(fileListRef.current)
      } else if (result && typeof result.then === 'function') {
        result.then((res) => {
          if (res === true) {
            const newFileList = [...fileListRef.current]
            newFileList.splice(index, 1)
            fileListRef.current = newFileList
            updateFileList(fileListRef.current)
          }
        })
      }
    }
  }, [])

  const onSuccess = useCallback((file, res) => {
    const newFileList = [...fileListRef.current]
    file.uploadState = 'success'
    delete file.abort
    const idx = fileListRef.current.findIndex((item) => item.fileId === file.fileId)
    newFileList.splice(idx, 1, file)
    const result = onChange(file, newFileList, res)
    if (fileList) {
      return false
    } else if (result && typeof result.then === 'function') {
      result.then((re) => {
        if (re === false) {
          return false
        } else {
          fileListRef.current = newFileList
          updateFileList(fileListRef.current)
        }
      })
    } else {
      fileListRef.current = newFileList
      updateFileList(fileListRef.current)
    }
  }, [])

  const onProgress = useCallback((file, e) => {
    const newFileList = [...fileListRef.current]
    file.progressNumber = e.percent
    const idx = fileListRef.current.findIndex((item) => item.fileId === file.fileId)
    newFileList.splice(idx, 1, file)
    fileListRef.current = newFileList
    updateFileList(fileListRef.current)
  }, [])

  const onError = useCallback((file, error, res) => {
    const newFileList = [...fileListRef.current]
    file.uploadState = 'error'
    const idx = fileListRef.current.findIndex((item) => item.fileId === file.fileId)
    newFileList.splice(idx, 1, file)
    const result = onChange(file, newFileList, res)
    if (fileList) {
      return false
    } else if (result && typeof result.then === 'function') {
      result.then((re) => {
        if (re === false) {
          return false
        } else {
          fileListRef.current = newFileList
          updateFileList(fileListRef.current)
        }
      })
    } else {
      fileListRef.current = newFileList
      updateFileList(fileListRef.current)
    }
  }, [])

  const uploadFiles = useCallback(
    (files) => {
      const _files = Object.keys(files)
        .map((idx) => {
          let file = files[idx]
          // TODO: beforeUpload customUpload
          if (file.size > maxSize * 1024) {
            // TODO: 弹窗提醒

            return null
          }
          file.fileId = uuidV4()
          file.uploadState = 'loading'
          file.fileType = getFileType(file)
          return file
        })
        .filter((file) => {
          if (file) {
            const action = request({
              file,
              action: uploadAction,
              name,
              withCredentials,
              headers,
              data,
              onSuccess,
              onError,
              onProgress
            })
            file.abort = action.abort
          }
          return file
        })
      fileListRef.current = _files.reverse().concat(fileListRef.current)
      updateFileList(fileListRef.current)
    },
    [onSuccess, onProgress, onError, uploadAction, name, withCredentials, headers, data]
  )

  return [_fileList, uploadFiles, deleteFile]
}

export default useUpload