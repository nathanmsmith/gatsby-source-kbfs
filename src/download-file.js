/*
 * This file is a clone (slight modification) of Dustin Schau's work on gatsby-source-s3
 *
 * Copyright Dustin Schau
 * https://github.com/DSchau/gatsby-source-s3
 */
import {createRemoteFileNode} from 'gatsby-source-filesystem'

const downloadFile = async (
  fileUrl /* Keybae Pub Raw URL */,
  node /* KBFS Node */,
  {store, cache, createNode, touchNode}
) => {
  const clone = Object.assign({}, node)
  let fileNodeId
  const cacheKey = clone.id

  const cachedNode = await cache.get(cacheKey)
  // Cached kbfsNode has not cached.
  // Use touchNode to tell Gatsby to leave the local file.
  // Skip fetching remote file again with createRemoteFileNode.
  if (cachedNode && cachedNode.lastModified === clone.lastModified) {
    fileNodeId = cachedNode.fileNodeId
    touchNode({nodeId: fileNodeId})
  }

  // Fetch the file from fileUrl (keybase.pub)
  if (!fileNodeId) {
    try {
      const fileNode = await createRemoteFileNode({
        url: fileUrl,
        store,
        cache,
        createNode,
      })

      if (fileNode) {
        fileNodeId = fileNode.id
        // Set the KBFS parent to be the file node and add the absolutePath field
        clone.parent = fileNodeId
        clone.absolutePath = fileNode.absolutePath

        // Set the fileNode in the cache
        await cache.set(cacheKey, {
          fileNodeId,
          lastModified: clone.lastModified,
        })
      }
    } catch (error) {
      console.error(`Failed to download file ${fileUrl}`)
    }
  }

  if (fileNodeId) {
    // Link fileNode to `localFile` property
    clone.localFile___NODE = fileNodeId
    clone.parent = fileNodeId
  }
  return clone
}

export default downloadFile
