const esbuild = require("esbuild")
const fs = require("node:fs/promises")
const pkg = require("./package.json")
const postcss = require("postcss")
const { sassPlugin } = require("esbuild-sass-plugin")
// this function generates app props based on package.json and propSecrets.json
const appProps = require("../../helpers/appProps")

if (!/.+\/.+\.js/.test(pkg.module))
  throw new Error(
    "module value is incorrect, use DIR/FILE.js like build/index.js"
  )

const isProduction = process.env.NODE_ENV === "production"
const IGNORE_EXTERNALS = process.env.IGNORE_EXTERNALS === "true"
// in dev environment we prefix output file with public
let outfile = `${isProduction ? "" : "public/"}${pkg.main || pkg.module}`
// get output from outputfile
let outdir = outfile.slice(0, outfile.lastIndexOf("/"))
const args = process.argv.slice(2)
const watch = args.indexOf("--watch") >= 0
const serve = args.indexOf("--serve") >= 0

const postcssPlugins = [require("tailwindcss"), require("autoprefixer")]
if (isProduction) postcssPlugins.push(require("postcss-minify"))

const green = "\x1b[32m%s\x1b[0m"
const yellow = "\x1b[33m%s\x1b[0m"
const clear = '\033c'

// shared config
const config = {
  bundle: true,
  minify: isProduction,
  // target: ["es2020"],
  target: ["es2020"], //["chrome64", "firefox67", "safari11.1", "edge79"],
  format: "esm",
  platform: "browser",
  // built-in loaders: js, jsx, ts, tsx, css, json, text, base64, dataurl, file, binary
  loader: { ".js": "jsx" },
  sourcemap: isProduction ? false : "both",
  external:
    isProduction && !IGNORE_EXTERNALS
      ? Object.keys(pkg.peerDependencies || {})
      : [],
}

const build = async () => {
  // delete build folder
  await fs.rm(outdir, { recursive: true, force: true })
  await fs.mkdir(outdir, { recursive: true })

  // build web workers
  try {
    const workerFiles = await fs.readdir("src/workers")
    for (let f of workerFiles) {
      await esbuild.build({
        ...config,
        entryPoints: [`src/workers/${f}`],
        outfile: `${outdir}/workers/${f}`,
      })
    }
  } catch (e) {
    console.log("WARNING: BUILD WEB WORKERS", e.message)
  }

  // build app
  let ctx = await esbuild.context({
    ...config,
    entryPoints: [pkg.source],
    outdir,
    splitting: true,
    format: "esm",
    plugins: [
      {
        name: "start/end",
        setup(build) {
          build.onStart(() => {
            console.log(clear)
            console.log(yellow, "Compiling...")
          })
          build.onEnd((result) => console.log(green, "Done!"))
        },
      },
      // for all sass, scss and css files starting with .inline use the css-text type
      // This means that all .inline.(s)css files are loaded as text
      sassPlugin({
        filter: /.*\.inline\.(s[ac]ss|css)$/,
        type: "css-text",
        cache: false,
        async transform(source, _resolveDir) {
          const { css } = await postcss(postcssPlugins).process(source, {
            from: undefined,
          })
          return css
        },
      }),
    ],
  })

  if (watch || serve) {
    if (watch) await ctx.watch()
    if (serve) {
      // generate app props based on package.json and secretProps.json
      await fs.writeFile(
        `./${outdir}/appProps.js`,
        `export default ${JSON.stringify(appProps())}`
      )

      let { host, port } = await ctx.serve({
        host: "0.0.0.0",
        port: parseInt(process.env.PORT),
        servedir: "public",
      })
      console.log("serve on", `${host}:${port}`)
    }
  } else {
    await ctx.rebuild()
    await ctx.dispose()
  }
}

build()
