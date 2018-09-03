import url from 'url'
import path from 'path'
import crypto from 'crypto'
import fetch from 'node-fetch'
import {includes, map, kebabCase} from 'lodash'
import {createRemoteFileNode} from 'gatsby-source-filesystem'

import validatePluginOptions from './validate-options.js'
import getFiles from './get-files.js'

const mimeImages = ['image/png', 'image/jpeg', 'image/webp']
const isImage = res => includes(mimeImages, res.headers.get('content-type'))

const makeContentDigest = data =>
  crypto
    .createHash('md5')
    .update(data)
    .digest('hex')

const makeRemoteFileNode = async ({file, store, cache, createNode}) => {
  try {
    return await createRemoteFileNode({
      url: file,
      store,
      cache,
      createNode,
    })
  } catch (error) {
    console.error(`Failed to download and create node for ${file}`)
  }
}

const makeKBFSFile = ({res, fileNode, username, folder, file, content}) => {
  const {pathname} = url.parse(file)
  const {base} = path.parse(pathname)
  const folderKebab = kebabCase(pathname)
  return {
    id: `kbfs-${username}-${folderKebab}`,
    children: [],
    parent: fileNode.id,
    absolutePath: fileNode.absolutePath,
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
        map(files, async file => {
          const resFile = await fetch(file)
          const content = await resFile.text()
          const args = {
            res: resFile,
            username,
            folder,
            file,
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
