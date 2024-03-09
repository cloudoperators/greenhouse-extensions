# Template App

This is the standard app template for microfrontends. Use this as a basis for new juno microfrontend apps.

## Instructions

1. Copy the `template` folder, rename to name of your app
2. Change the name in `package.json` from "template" to your app's name
3. Change `URL_STATE_KEY` in `App.js` to your app's name

## Usage

### load via script tag

```js
<script
  defer
  src="https://JUNO_ASSETS_HOSTNAME/apps/widget-loader@VERSION/build/app.js"
  data-name="YOUR_APP_NAME"
  data-version="MFE_VERSION"
></script>
```

Most of the time using `latest` as `VERSION` and `data-version` is what you want to do. Alternatively you can see all published versions at `https://JUNO_CDN_HOSTNAME/manifest.json`.

`YOUR_APP_NAME` must be the name you specified in your `package.json` (see above)

Custom properties can be passed to the app via data properties on the script tag. See example `data-props-myprop` below. Custom properties can be accessed in your App.js via `props`. Use only lowercase letters and no special characters in custom prop names.

Example:

```js
<script
  defer
  src="https://assets.juno.global.cloud.sap/apps/widget-loader@latest/build/app.js"
  data-name="myapp"
  data-version="latest"
  data-props-myprop="Passing a custom prop to my app"
></script>
```

More information about options [here](https://github.com/sapcc/juno/blob/main/apps/widget-loader/README.md)
