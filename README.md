# EUCLIP DRUM CONSOLE
[euclip.app](https://euclip.app)

See [Theory of Operation](theory-of-operation.md) to get a better idea of how Euclip works. 

This is the frontend repository for Euclip Drum Console. It is an ember app that runs against a rails API backend.

local development against api server using a self signed certificate


## Pre-requisites

1. Node.js > 18
1. ember-cli `npm install -g ember-cli`


## Run the app
Assuming you have the back end repository installed and the server running, you can sinmply run `ember s --secure-proxy=false  --ssl-key /PATH/TO/server.key --ssl-cert /PATH/TO/server.crt` 
See `.ember-cli` for local server config

You can now open that app at `localhost:4200`

## Deploying
`deploy-to-rails.sh` is a helper scipt that assumes the euclip-api repo exists in the same directory as this repo. This script will run build a production version of this app
and copy it to the `/public` directory in the rails repo. 

From there, the rails app will need to be committed and pushed to heroku. Note the local server should not be running when this command is run.


## Audio Cloud Storage
files are stored in gcloud. To get this running you may need to setup CORS on the cloud storage bucket for the domain you're serving from.

1. Authorize gcloud `gcloud auth login --no-launch-browser`
1. Set CORS setting from `/config/gcloud-cors-config.json`
    - `cd config`
    - `gsutil cors set gcloud-cors-config.json gs://euclidean-cracked.appspot.com`
1. Confirm `gsutil cors get gs://euclidean-cracked.appspot.com`

## Prerequisites
You will need the following things properly installed on your computer.

* [Git](https://git-scm.com/)
* [Node.js](https://nodejs.org/) (with npm)
* [Ember CLI](https://cli.emberjs.com/release/)
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

* `npm run lint`
* `npm run lint:fix`

### Building

* `ember build` (development)
* `ember build --environment production` (production)

### Deploying

see `deploy_to_rails.sh`

## Further Reading / Useful Links

* [ember.js](https://emberjs.com/)
* [ember-cli](https://cli.emberjs.com/release/)
* Development Browser Extensions
  * [ember inspector for chrome](https://chrome.google.com/webstore/detail/ember-inspector/bmdblncegkenkacieihfhpjfppoconhi)
  * [ember inspector for firefox](https://addons.mozilla.org/en-US/firefox/addon/ember-inspector/)

