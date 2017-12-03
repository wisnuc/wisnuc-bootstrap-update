const path = require('path')
const fs = require('fs')
const crypto = require('crypto')
const mkdirp = require('mkdirp')
const rimraf = require('rimraf')
const UUID = require('uuid')
const request = require('request')

// assert
const isSHA256 = hash => /[a-f0-9]{64}/.test(hash)

// constants
const githubPrepend = 'https://raw.githubusercontent.com/wisnuc/wisnuc-bootstrap/release/'
const mirrorPrepend = 'https://mirrors.wisnuc.com/wisnuc-bootstrap/'

/**
/wisnuc/wisnuc-bootstrap                <- target
/wisnuc/wisnuc-bootstrap-update-tmp     <- tmpDir
*/

// override with --path, for testing
const root = process.argv.find((_, index, arr) => arr[index - 1] === '--root') || '/wisnuc'
const targetPath = path.join(path.resolve(root), 'wisnuc-bootstrap')
const tmpDir = path.join(path.resolve(root), 'wisnuc-bootstrap-update-tmp')

/**
Returns sha256 of given file, null if non-exist
*/
const hashFile = (filePath, callback) =>
  fs.stat(filePath, (err, stat) => {
    if (err && err.code === 'ENOENT') {
      callback(null, null)
    } else if (err) {
      callback(err)
    } else {
      if (stat.isFile()) {
        let hash = crypto.createHash('sha256')
        let rs = fs.createReadStream(filePath)
        rs.on('error', err => {
          rs.removeAllListeners()
          rs.on('error', () => {})
          rs.destroy()
          callback(err)
        })
        rs.on('data', data => hash.update(data))
        rs.on('close', () => callback(null, hash.digest('hex')))
      } else {
        callback(new Error('target is not a file'))
      }
    }
  })

/**
Download url to filePath
*/
const downloadFile = (url, filePath, callback) => {
  let req = request.get(url)
  let ws = fs.createWriteStream(filePath)

  const destroy = () => {
    req.removeAllListeners()
    req.on('error', () => {})
    ws.removeAllListeners()
    ws.on('error', () => {})
    ws.destroy()
  }

  req.on('error', err => (destroy(), callback(err)))
  ws.on('error', err => (destroy(), callback(err)))
  ws.on('close', () => callback(null))
  req.pipe(ws)
}

const retrieveHash = (mirror, callback) => {
  let prepend = mirror ? mirrorPrepend : githubPrepend
  let filename = process.arch === 'x64' 
        ? 'wisnuc-bootstrap-linux-x64-sha256'
        : 'wisnuc-bootstrap-linux-a64-sha256'
  let remoteUrl = prepend + filename
  let tmpFile = path.join(tmpDir, UUID.v4())

  console.log(`INFO retrieving remote hash from ${remoteUrl}`)

  downloadFile(remoteUrl, tmpFile, err => {
    if (err) return rimraf(tmpFile, () => callback(err))
    fs.readFile(tmpFile, (err, data) => {
      rimraf(tmpFile, () => {})

      if (err) return callback(err)
      let text = data.toString().trim()
      if (!isSHA256(text)) {
        callback(new Error('invalid sha256 string')) 
      } else {
        callback(null, text)
      }
    })
  })
}

/**
Download, verify checksum and update local file
*/
const update = (mirror, expectedHash) => {
  let prepend = mirror ? mirrorPrepend : githubPrepend
  let filename = process.arch === 'x64' 
        ? 'wisnuc-bootstrap-linux-x64'
        : 'wisnuc-bootstrap-linux-a64'
  let remoteUrl = prepend + filename
  let tmpPath = path.join(tmpDir, UUID.v4())

  const error = text => (console.log('ERROR ' + text), rimraf(tmpPath, () => process.exit()))
  const info = text => console.log('INFO ' + text)

  info(`retrieving remote file from ${remoteUrl}`)
  downloadFile(remoteUrl, tmpPath, err => {
    if (err) {
      error(`failed to download remote file`)
    } else {
      info(`remote file downloaded`)
      hashFile(tmpPath, (err, actualHash) => {
        if (err) {
          error(`failed to hash downloaded file`) 
        } else if (actualHash !== expectedHash) {
          error(`downloaded file hash mismatches`)
        } else {
          fs.chmod(tmpPath, '755', err => err
            ? error(`failed to set executable permission on downloaded file`)
            : fs.rename(tmpPath, targetPath, err => err 
                ? error(`failed to overwrite target file`)
                : (info(`update succeeds`), process.exit())))
        }
      })
    }
  })
}


// for convenience 
const tryUpdate = (remote, local, mirror) => 
  (console.log(`INFO remote hash ${remote}`), remote === local 
    ? (console.log('INFO remote hash and local hash matches'), process.exit())
    : update(mirror, remote))


/**
main
*/
rimraf.sync(tmpDir)
mkdirp.sync(tmpDir)
hashFile(targetPath, (err, localHash) => {
  if (err) {
    console.log('ERROR failed to hash local file', err)
    return process.exit(1)
  } else {
    console.log(`INFO local hash ${localHash}`)
    retrieveHash(true, (err, remoteHash) => {
      if (err) {
        console.log('WARNING failed to retrieve remote hash from mirror site', err)
        retrieveHash(false, (err, remoteHash) => {
          if (err) {
            console.log('ERROR failed to retrieve remote hash from github', err)
            process.exit()
          } else {
            tryUpdate(remoteHash, localHash, false)
          }
        })
      } else {
        tryUpdate(remoteHash, localHash, true)
      }
    })
  }
})

