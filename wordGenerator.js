const fs = require('fs')
const wordListPath = require('word-list')
//Make an array that has all the words
const wordArray = fs.readFileSync(wordListPath, 'utf8').split('\n')

//return a random element from the array of words.
module.exports = () => wordArray[Math.floor(Math.random() * wordArray.length)]
