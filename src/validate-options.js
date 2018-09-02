import {map} from 'lodash'
import fetch from 'node-fetch'
import {makeKBFSFolderUrl} from './get-files.js'

const errorPrefix = 'gatsby-source-kbfs:'
const errorMissingOptions = opt =>
  new Error(`${errorPrefix} Missing option ${opt} for gatsby-source-kbfs in gatsby-config.js`)
const errorNoUser = username => new Error(`${errorPrefix} Keybase user ${username} does not exist`)
const errorNoFolder = folder => new Error(`${errorPrefix} KBFS folder ${folder} does not exist`)
const errorFetchFailed = url => new Error(`${errorPrefix} Failed to fetch ${url}`)

/*
 * Expect to get HTTP 200 for username and all directory paths
 */
const validatePluginOptions = async ({username, folders}) => {
  if (!username) errorMissingOptions('username')
  if (!folders) errorMissingOptions('folders')

  const urlUsername = makeKBFSFolderUrl(username, '')
  try {
    const resUsername = await fetch(urlUsername, {method: 'HEAD'})
    if (!resUsername.ok && resUsername.status === 404) throw errorNoUser(username)
  } catch (e) {
    throw errorFetchFailed(urlUsername)
  }

  // Check KBFS folders
  await Promise.all(
    map(
      folders,
      folder =>
        new Promise((resolve, reject) => {
          // Reject if the foler 404's or errors out
          fetch(makeKBFSFolderUrl(username, folder), {method: 'HEAD'})
            .then(res => (res.status === 404 ? reject(errorNoFolder(folder)) : resolve(true)))
            .catch(() => reject(errorNoFolder(folder)))
        })
    )
  )

  // If we get here, everything is good!
  return true
}

export default validatePluginOptions
