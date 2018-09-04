## Gatsby Source KBFS (Keybase Filesystem)

`gatsby-source-kbfs` enables you to use files from public KBFS folders as
content for your Gatsby site. It supports image files for use with
[sharp](https://github.com/lovell/sharp) via
([gatsby-plugin-sharp](https://github.com/gatsbyjs/gatsby/tree/master/packages/gatsby-plugin-sharp)
and [gatsby-transformer-sharp](https://github.com/gatsbyjs/gatsby/tree/master/packages/gatsby-transformer-sharp)).

KBFS public folders and the files inside are cryptographically signed with the
Keybase user's key. If you're interested in using KBFS folders, [sign up for
Keybase](https://keybase.io) or [read the documentation](https://keybase.io/docs/kbfs).

### Install

```bash
npm install gatsby-source-kbfs
# or
yarn add gatsby-source-kbfs
```

### Configure


Add `gatsby-source-kbfs` to the `plugins` array in `gatsby-config.js` in the
root of your project.

First provide the `username` for the KBFS public folder.

Then provide an array of `folders` (paths from that user's public folder).

The combination of `username` and paths in `folders` should always produce a valid and
accessible URL like so `https://keybase.pub/{username}/{folder-path}`

All files in the folders will be added.


```js
// gatsby-config.js

{
  plugins: [
   {
     resolve: 'gatsby-source-kbfs',
     options: {
      username: 'chris',
      folders: [
        // Only files inside `/photos`, not subdirectories
        '/photos', 
        // Manually include subdirectories
        '/photos/this_is_a_dir/foo/bar/another_directory', 
        '/keys',
      ],
    },
  ]
}
```

### How To Use


You can query for KBFS files like so

```graphql
{
  allKbfsFiles {
    edges {
      node {
        id
        name                      # "avatar.png"
        folder                    # "/photos"
        path                      # "/photos/avatar.png"
        kbfsPath                  # "https://{username}.keybase.pub/{path}
        localFile {               # File Node from gatsby-source-filesystem
          ...                     #
          publicURL               # Served URL for this file (after downloading)
          childImageSharp {       # Image files are automatically transformed with gatsby-transformer-sharp
            ...
          }
        }
      }
    }
  }
}
```

Querying for files in one or more KBFS folders

```graphql
{
  allKbfsFile(filter: {folder: {in: ["/folder/one", "/folder/two"]}}) {
    edges {
      node {
        ...
      }
    }
  }
}
```

Querying for one or more files across all KBFS folders

```graphql
{
  allKbfsFile(filter: {name: {in: ["avatar.jpg", "resume.pdf"]}}) {
    edges {
      node {
        ...
      }
    }
  }
}
```

You can combine these two types of filtering to narrow down folders and files.


### License

MIT
