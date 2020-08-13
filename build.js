const { Worker, isMainThread, parentPort } = require('worker_threads')
const { writeFile, copyFile } = require('fs').promises
const https = require('https')
const pkg = require('./package.json')

const styleMap = {
  brands: 'fab',
  solid: 'fas',
  regular: 'far',
}

async function generateIconsList() {
  const main = { icons: [] }
  const faVersion = pkg.dependencies['@fortawesome/fontawesome-free'].replace(/\^/g, '')

  https.get(`https://raw.githubusercontent.com/FortAwesome/Font-Awesome/${faVersion}/metadata/icons.json`, (res) => {
    let body = '';

    res.on('data', (chunk) => {
      body += chunk;
    })

    res.on('end', () => {
      try {
        const json = JSON.parse(body)

        Object.keys(json).forEach((key) => {
          json[key].styles.forEach((style) => {
		    main.icons.push(`${styleMap[style]} fa-${key}`)
          })
        })

        writeFile('icons.json', JSON.stringify(main))
      } catch (error) {
        console.error(error.message)
      }
    })
  }).on('error', (error) => {
    console.error(error)
  })
}

if (isMainThread) {
  const worker = new Worker(__filename)
  worker.postMessage('message')

  copyFile('node_modules/@fortawesome/fontawesome-free/js/all.min.js', 'dist/js/all.min.js')
} else {
  parentPort.once('message', () => {
    generateIconsList()
  })
}
