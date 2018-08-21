# Cloudflare Worker Webpack Plugin

Deploy freshly-bundled Cloudflare Worker scripts and route matching patterns **directly from your build step** 🚀


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
      zone: `omgwtfroflbbq-zone-id`,
      pattern: `*.your-site.lol/crazy/*/pattern`
      enabled: true,
    }
  ),

],

````

# Configuration

Unless otherwise indicated, all configuration settings are `undefined` by default:


## Authorization

* `$CLOUDFLARE_AUTH_EMAIL`: Your Cloudflare user email.
* `$CLOUDFLARE_AUTH_KEY`: Your Cloudflare super-duper-secret API key.


## Deployment Settings

* `enabled`: Whether to deploy to Cloudflare or bypass; useful for e.g. CI and testing (default: `true`)
* `zone`: the ID of the zone/domain/website for which you're deploying your script (required!).
* `pattern`: optionally include a route matching pattern for unleashing your newly spawned JavaScript minion

Note that providing a pattern will disable any currently enabled pattern, and activate the new pattern provided.


# Potential Issues

Note this is currently tagged as `beta`. I initially hacked this together in one evening, which sounds cool when good programmers say it.
But I am by no means a good programmer. Cool is kind of a stretch as well.

I don't plan on supporting the fancy-pants Enterprise Cloudflare Workers features anytime soon - mucho dinero! (eyeyey...)


# Contributing

Want to be the berserker of your own Cloudflare Worker? ⚔

Great! Here are some fun ideas to consider:

- [ ] Write hella' cool automated tests
- [ ] Replace `axios` dependency with Node's native `http.get`
- [ ] Help convince Cloudflare that '_Edge Gremlins_' is a **waaaay** cooler name

Feel free to create an issue throwing your own ideas at me.

# Because All the Cool Kids Do It

[![cloudflare](https://www.cloudflare.com/media/images/web-badges/cf-web-badges-g-gray.png)](https://developers.cloudflare.com/workers/)


[![code style: prettier](https://img.shields.io/badge/code_style-prettier-ff69b4.svg?style=flat-square)](https://github.com/prettier/prettier) [![npm version](https://badge.fury.io/js/cloudflare-worker-webpack-plugin.svg)](https://badge.fury.io/js/cloudflare-worker-webpack-plugin)


## Disclaimer
Besides being a happy customer, I am not affiliated with Cloudflare in any way.

Just like your own users, assume that I have no idea what I'm doing.

(This part is important, because I have no idea what I'm doing.)

**REVIEW THE SOURCE**, and use at your own risk 🙈

## License
MIT
