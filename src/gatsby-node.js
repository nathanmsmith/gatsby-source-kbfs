import url from 'url'
import path from 'path'
import crypto from 'crypto'
import fetch from 'node-fetch'
import {map, kebabCase} from 'lodash'
import {createRemoteFileNode} from 'gatsby-source-filesystem'

import validatePluginOptions from './validate-options.js'
import getFiles from './get-files.js'

const makeContentDigest = data =>
  crypto
    .createHash('md5')
    .update(data)
    .digest('hex')

const makeRemoteFileNode = async ({fileUrl, store, cache, createNode}) => {
  try {
    return await createRemoteFileNode({
      url: fileUrl,
      store,
      cache,
      createNode,
    })
  } catch (error) {
    console.error(`Failed to download and create node for ${fileUrl}`)
  }
}

const makeKBFSFile = ({res, fileNode, username, folder, fileUrl, content}) => {
  const {pathname} = url.parse(fileUrl)
  const {base} = path.parse(pathname)
  const folderKebab = kebabCase(pathname)
  return {
    id: `kbfs-${username}-${folderKebab}`,
    children: [],
    parent: fileNode.id,
    absolutePath: fileNode.absolutePath,
    kbfsLink: fileUrl,
    path: pathname,
    folder,
    name: base,
    internal: {
      type: 'KbfsFile',
      mediaType: res.headers.get('content-type'),
      contentDigest: makeContentDigest(content),
    },
  }
}

export const sourceNodes = async ({actions, store, cache}, pluginOptions, done) => {
  delete pluginOptions.plugins
  // Will throw if options are invalid (user or folder do not exist)
  await validatePluginOptions(pluginOptions)
  const {username, folders} = pluginOptions
  const {createNode} = actions

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

          const fileNode = await makeRemoteFileNode(args)
          if (!fileNode) return
          const imageNode = makeKBFSFile({
            ...args,
            fileNode,
          })
          imageNode.localFile___NODE = fileNode.id
          createNode(imageNode)
        })
      )
    })
  )
  done()
}
