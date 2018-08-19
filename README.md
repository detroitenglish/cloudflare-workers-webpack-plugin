# Cloudflare Worker Webpack Plugin

Deploy freshly-bundled Cloudflare Worker scripts and route matching patterns **directly from your build step** 🚀


# Usage

Install the plugin:
````bash
npm install -d cloudflare-worker-webpack-plugin
````

Require...

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
    }
  ),

],

````

# Configuration

All configuration settings are `undefined` by default:


## Authorization

* `CLOUDFLARE_AUTH_EMAIL`: Your Cloudflare user email.
* `CLOUDFLARE_AUTH_KEY`: Your Cloudflare super-duper-secret API key.


## Deployment Settings

* `zone`: the ID of the zone/domain/website for which you're deploying your script (required!).
* `pattern`: optionally include a route matching pattern for unleashing your newly spawned JavaScript minion

Note that providing a pattern will disable any currently enabled pattern, and activate the new pattern provided.


# Caveats


# Contributing

Want to be the berserker of your own Cloudflare Worker? ⚔

Great! Here are some fun ideas to consider:

- [ ] Write hella' cool automated tests
- [ ] Replace `axios` dependency with Node's native `http.get`
- [ ] Help convince Cloudflare that '_Edge Gremlins_' is a **waaaay** cooler name

Feel free to create an issue throwing your own ideas at me.

# Because All Cool Kids Do It

## Disclaimer
Besides being a happy customer, I am not affiliated with Cloudflare in any way.

Just like your own users, assume that I have no idea what I'm doing.

(This part is important, because I have no idea what I'm doing.)

**REVIEW THE SOURCE**, and use at your own risk 🙈

## License
MIT
