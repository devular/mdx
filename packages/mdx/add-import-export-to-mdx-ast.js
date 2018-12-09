const {isImport, isExport, isExportDefault, EMPTY_NEWLINE} = require('./util')

const tokenizeEsSyntax = (eat, value) => {
  const index = value.indexOf(EMPTY_NEWLINE)
  const subvalue = index !== -1 ? value.slice(0, index) : value

  if (isExport(subvalue)) {
    return eat(subvalue)({
      type: 'export',
      default: isExportDefault(subvalue),
      value: subvalue
    })
  }

  if (isImport(subvalue)) {
    return eat(subvalue)({type: 'import', value: subvalue})
  }
}

tokenizeEsSyntax.locator = (value, _fromIndex) => {
  return isExport(value) || isImport(value) ? -1 : 1
}

export default () => {
  const Parser = this.Parser
  const tokenizers = Parser.prototype.blockTokenizers
  const methods = Parser.prototype.blockMethods

  tokenizers.esSyntax = tokenizeEsSyntax

  methods.splice(methods.indexOf('paragraph'), 0, 'esSyntax')
}
