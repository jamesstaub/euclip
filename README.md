[euclip.app](https://euclip.app)

See [Theory of Operation](theory-of-operation.md) to get a better idea of how Euclip works. 

# euclip
local development against api server using a self signed certificate
`ember s --proxy https://localhost:3000  --secure-proxy=false`
`rails server -b 'ssl://127.0.0.1:3000?key=/Users/admin/.ssh/server.key&cert=/Users/admin/.ssh/server.crt'`

## Deploying
`deploy-to-rails.sh` is a helper scipt that assumes the euclip-api repo exists in the same directory as this repo. This script will run build a production version of this app
and copy it to the `/public` directory in the rails repo. 

From there, the rails app will need to be committed and pushed to heroku. Note the local server should not be running when this command is run.


## Prerequisites
You will need the following things properly installed on your computer.

* [Git](https://git-scm.com/)
* [Node.js](https://nodejs.org/) (with npm)
* [Ember CLI](https://ember-cli.com/)
* [Google Chrome](https://google.com/chrome/)

## Installation

* `git clone <repository-url>` this repository
* `cd euclip`
* `npm install`

## Running / Development

* `ember serve`
* Visit your app at [http://localhost:4200](http://localhost:4200).
* Visit your tests at [http://localhost:4200/tests](http://localhost:4200/tests).

### Running Tests

* `ember test`
* `ember test --server`

### Linting

* `npm run lint:hbs`
* `npm run lint:js`
* `npm run lint:js -- --fix`

### Building

* `ember build` (development)
* `ember build --environment production` (production)

### Deploying
