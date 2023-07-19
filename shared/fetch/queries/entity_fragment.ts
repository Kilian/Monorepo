/*

Unless specified, these queries are designed to be used by surveyform

*/

export const entityFragment = `
id
nameClean
nameHtml
example {
  language
  code
  codeHighlighted
}
descriptionClean
descriptionHtml
homepage {
  url
}
github {
  url
}
mdn {
  url
  summary
}
w3c {
  url
}
caniuse {
  name
  url
}
resources {
  title
  url
}
`
