const fs = require('fs')
const wordListPath = require('word-list')
const wordArray = fs.readFileSync(wordListPath, 'utf8').split('\n')

module.exports = () => wordArray[Math.floor(Math.random() * wordArray.length)]
