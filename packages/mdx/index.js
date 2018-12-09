const unified = require('unified')
const toMDAST = require('remark-parse')
const squeeze = require('remark-squeeze-paragraphs')
const addCommentJsx = require('./add-comments-jsx-to-mdx-ast')
const addImportExport = require('./add-import-export-to-mdx-ast')
const mdxAstToMdxHast = require('./mdx-ast-to-mdx-hast')
const mdxHastToJsx = require('./mdx-hast-to-jsx')

const {BLOCKS_REGEX} = require('./util')

const DEFAULT_OPTIONS = {
  footnotes: true,
  mdPlugins: [],
  hastPlugins: [],
  compilers: [],
  blocks: [BLOCKS_REGEX]
}

// Although named createMdxAstCompiler, this function will return a HAST
function createMdxAstCompiler(options) {
  const mdPlugins = options.mdPlugins

  const fn = unified()
    // Build Markdown AST
    .use(toMDAST, options)
    // Add es import/export as nodes to AST
    .use(addImportExport)
    // Squeey paragraphs with remark
    .use(squeeze, options)

  // Add custom remark plugins
  mdPlugins.forEach(plugin => {
    // Handle [plugin, pluginOptions] syntax
    if (Array.isArray(plugin) && plugin.length > 1) {
      fn.use(plugin[0], plugin[1])
    } else {
      fn.use(plugin, options)
    }
  })
  // Add HTML comment and JSX nodes to AST
  fn.use(addCommentJsx, options)
    // Convert MDX AST to MDX HAST
    .use(mdxAstToMdxHast, options)

  return fn
}

function applyHastPluginsAndCompilers(compiler, options) {
  const hastPlugins = options.hastPlugins
  const compilers = options.compilers

  hastPlugins.forEach(plugin => {
    // Handle [plugin, pluginOptions] syntax
    if (Array.isArray(plugin) && plugin.length > 1) {
      compiler.use(plugin[0], plugin[1])
    } else {
      compiler.use(plugin, options)
    }
  })

  compiler.use(mdxHastToJsx, options)

  for (const compilerPlugin of compilers) {
    compiler.use(compilerPlugin, options)
  }

  return compiler
}

function createCompiler(options) {
  const compiler = createMdxAstCompiler(options)
  const compilerWithPlugins = applyHastPluginsAndCompilers(compiler, options)

  return compilerWithPlugins
}

function sync(mdx, options) {
  const opts = Object.assign({}, DEFAULT_OPTIONS, options)
  const compiler = createCompiler(opts)

  const fileOpts = {contents: mdx}
  if (opts.filepath) {
    fileOpts.path = opts.filepath
  }

  const {contents} = compiler.processSync(fileOpts)

  return contents
}

async function compile(mdx, options = {}) {
  const opts = Object.assign({}, DEFAULT_OPTIONS, options)
  const compiler = createCompiler(opts)

  const fileOpts = {contents: mdx}
  if (opts.filepath) {
    fileOpts.path = opts.filepath
  }

  const {contents} = await compiler.process(fileOpts)

  return contents
}

compile.sync = sync

module.exports = compile
exports = compile
exports.sync = sync
exports.createMdxAstCompiler = createMdxAstCompiler
exports.default = compile
