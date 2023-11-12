
# Period Predictor
Provides a future forecast of when the user's future periods will occur based on user supplied historical data.

### Local development

To run the server locally,
1. Open a terminal and change the working directory to the directory of this file.
1. Run `node server.js`

Note that in local development it is expected to get an error message in the browser from the service worker to the effect `sw.js:1 Uncaught (in promise) TypeError: Failed to execute 'addAll' on 'Cache': Request failed`. Adding files to the cache is only needed when the app is pulled from a remote server, but is not needed during local development (we are ok with the service worker having to go to the local server for every file load instead of the cache).