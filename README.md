# Cloudflare Worker Webpack Plugin

Deploy freshly-bundled Cloudflare Worker scripts and route matching patterns **directly from your build step** 🚀

![Example use in Cloudflare Worker Webpack Boilerplate](.github/cf-worker-webpack-boilerplate-deploy.gif?raw=true)

&nbsp;&nbsp;&nbsp;&nbsp;_Example as implemented in [Cloudflare Worker Webpack Boilerplate](https://github.com/detroitenglish/cloudflare-worker-webpack-boilerplate)_

# Usage

Install, ...
````bash
npm install -D cloudflare-worker-webpack-plugin
````

... require...

````javascript
const CloudflareWorkerPlugin = require('cloudflare-worker-webpack-plugin');
````

... and include the plugin in your webpack ~~dark arts~~ configuration:

````javascript

// ...ave satanas webpackus ...
plugins: [

  new CloudflareWorkerPlugin(
    $CLOUDFLARE_AUTH_EMAIL,         // first arg: user-email
    $CLOUDFLARE_AUTH_KEY,           // second arg: api-key
    {                               // options object
      site: `your-site.lol`,
      pattern: `example.your-site.lol/crazy/pattern/*`
      clearRoutes: true,
      verbose: true,
      // See 'Configuration' below for additional options
    }
  ),

],

````

# Configuration

## Required Configuration

### Cloudflare Credentials

* `$CLOUDFLARE_AUTH_EMAIL`: Your Cloudflare user email.
* `$CLOUDFLARE_AUTH_KEY`: Your Cloudflare super-duper-secret API key.

### Cloudflare Zone

You **must** provide one of the following two options:

* `zone`: Zone ID of the domain for which you're deploying your script

  **OR**

* `site`: Fully-qualified domain name (FQDN) of your target deployment zone.

**Note**: If both `zone` and `site` are provided, `zone` wins.

## Options

* `pattern`: a route matching pattern, a comma-separated list of patterns, or an Array of patterns to enable for your newly spawned JavaScript minion (default: `undefined`)
  - Example (string): `"*.your-site.lol"`
  - Example (list): `"*.your-site.lol,your-site.lol/some-pattern/*"`
  - Example (Array): `["*.your-site.lol", "your-site.lol/some-pattern/*"]`
* `script`: **relative** path to your worker script (default: `<webpack-config-output-file>`)
* `clearRoutes`: Delete ALL existing route patterns; requires a `pattern` string be provided (default: `false`)
* `skipWorkerUpload`: Skip uploading the worker script and process only route patterns (default: `false`)
* `reset`: Delete ALL route patterns, DELETE existing worker script, and exit (default: `false`)
* `verbose`: Log additional information about each deployment step to the console (default: `false`)
* `colors`: Use colors in console output (default: `false`)
* `emoji`: Use emoji in console output (default: `false`)
* `enabled`: Whether to deploy to Cloudflare or bypass; useful for e.g. CI and testing (default: `true`)

**Note**: If you provide 1 or more matching patterns, any currently enabled matching patterns will be disabled if they are not included in the `pattern` option.


# Potential Issues

This plugin does not support features reserved for Enterprise Cloudflare Workers.


# Contributing

PR's are very much welcome. Here are some fun ideas to consider:

- [ ] Write hella' cool automated tests
- [ ] Help convince Cloudflare that '_Edge Gremlins_' is a **waaaay** cooler name

Feel free to create an issue throwing your own ideas at me.

# Because Software

## Neat Little Badges
[![cloudflare](https://www.cloudflare.com/media/images/web-badges/cf-web-badges-g-gray.png)](https://developers.cloudflare.com/workers/)


[![code style: prettier](https://img.shields.io/badge/code_style-prettier-ff69b4.svg?style=flat-square)](https://github.com/prettier/prettier) [![npm version](https://badge.fury.io/js/cloudflare-worker-webpack-plugin.svg)](https://badge.fury.io/js/cloudflare-worker-webpack-plugin)


## Disclaimer
Besides a happy customer, I am not affiliated with Cloudflare in any way.

Assume in good faith that I have no idea what I'm doing; **REVIEW THE SOURCE** and use at your own risk 🙈

## License
[MIT](./LICENSE)
