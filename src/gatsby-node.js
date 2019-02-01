import url from 'url'
import path from 'path'
import crypto from 'crypto'
import fetch from 'node-fetch'
import {map, kebabCase} from 'lodash'

import validatePluginOptions from './validate-options.js'
import getFiles from './get-files.js'
import downloadImage from './download-file.js'

const mimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
const isImage = type => mimeTypes.includes(type)

const makeContentDigest = data =>
  crypto
    .createHash('md5')
    .update(data)
    .digest('hex')

const makeKBFSFile = ({res, fileNode, username, folder, fileUrl, content}) => {
  const {pathname} = new URL(fileUrl)
  const {name} = path.parse(pathname)
  const folderKebab = kebabCase(pathname)
  const contentType = res.headers.get('content-type')
  const lastModified = res.headers.get('last-modified')
  return {
    id: `kbfs-${username}-${folderKebab}`,
    children: [],
    kbfsLink: fileUrl,
    path: pathname,
    name: name,
    folder: folder,
    lastModified,
    internal: {
      type: 'KBFSFile',
      mediaType: contentType,
      contentDigest: makeContentDigest(content),
    },
  }
}

export const sourceNodes = async ({actions, createNodeId, store, cache}, pluginOptions, done) => {
  delete pluginOptions.plugins
  // Will throw if options are invalid (user or folder do not exist)
  try {
    await validatePluginOptions(pluginOptions)
  } catch (error) {
    console.error(`\n ${error.message}`)
    done()
    return
  }
  const {username, folders} = pluginOptions
  const {createNode, touchNode} = actions

  // Wait to resolve all folders
  await Promise.all(
    map(folders, async folder => {
      const files = await getFiles(username, folder)
      // Wait to resolve all files
      return Promise.all(
        map(files, async fileUrl => {
          const resFile = await fetch(fileUrl)
          const content = await resFile.text()
          const args = {
            res: resFile,
            username,
            folder,
            fileUrl,
            content,
            store,
            cache,
            createNode,
          }

          let kbfsNode = makeKBFSFile(args)
          if (isImage(kbfsNode.internal.mediaType)) {
            kbfsNode = await downloadImage(fileUrl, kbfsNode, {
              store,
              cache,
              createNode,
              createNodeId,
              touchNode,
            })
          }
          createNode(kbfsNode)
        })
      )
    })
  )
  done()
}
