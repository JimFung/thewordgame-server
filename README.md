# The Word Game
The backend for "The Word Game". See how many words you can get correct before you run out of time, or face off against a random opponent!

## How to play
* Type the words that show up on your screen.
* Get it right at your timer will go down!
* Get it wrong and your timer increases.
* The longer you survive, the faster the timer gets.

## Running the Game locally
Running the game locally requires both, this express server and [its sister project](https://github.com/JimFung/thewordgame-client). Node.js is also required for this project to run.
```
# Clone the project to your local machine
git clone https://github.com/JimFung/thewordgame-server.git

#navigate into the directory
cd thewordgame-server

# install dependencies through npm
npm install

# start the project
npm start
```

**Note**: This project is probably going to be pretty boring unless you also have the front end for it. You can find that [here](https://github.com/JimFung/thewordgame-client)

## Why did I build this with sockets?
I knew I wanted to build a simple multiplayer game, so the only reasonable choice was to use websockets. Using API request for this would have been completely insane, the overhead would be astronomical. Consider that updating the local copy of my opponents timer is a event that happens every 10ms, then consider that happening with API requests instead of using a TCP connection. That's the stuff nightmares are made of.

## Things I didn't get around to implementing
* Having the words that your opponent is typing show up on your screen
* Show whether the letter your opponent just typed is correct or not
* Keep count of the # of wins, make a leaderboard
* Something with RxJS
