import {URL} from 'url'
import path from 'path'
import {chain} from 'lodash'
import fetch from 'node-fetch'
import cheerio from 'cheerio'

export const makeKBFSFolderUrl = (username, folder) =>
  new URL(path.join(username, folder), 'https://keybase.pub').href
export const makeKBFSRawUrl = (username, folder) => new URL(folder, `https://${username}.keybase.pub`).href

/*
 * Makes request to user's KBFS directory page and get file paths in that directory
 *
 * Loads the HTML contents of `https://keybase.pub/{username}/{path}` and builds new
 * file paths to the raw files at `https://{username}.keybase.pub/{path}/{file}`
 *
 * At the moment, keybase.pub does not have a JSON API (coming soon perhaps).
 *
 * @param {String} username Keybase username
 * @param {String} folder Directory path relative to user's public KBFS directory
 * @returns {String[]}  Array of KBFS URLS to the raw file contents
 *
 * Allow promise errors to bubble up to calling function
 */
const getFiles = async (username, folder) => {
  const url = makeKBFSFolderUrl(username, folder)
  const response = await fetch(url)
  const html = await response.text()
  const $ = cheerio.load(html)

  const filePaths = chain($('.file'))
    .map($)
    .map(el => el.text())
    .map(fileName => makeKBFSRawUrl(username, path.join(folder, fileName)))
    .value()

  console.log('KBFS', filePaths)
  return filePaths
}

export default getFiles
