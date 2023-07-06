/**
 * Get the params from a url
 * @param url - the url to get the params from
 * @param key - the path for the current page
 * @example
 * getParams('http://example.com/blog/foo', '/blog/:id') -> { id: 'foo' }
 */
export function getParams(url: string, key: string) {
  const pathname = new URL(url).pathname
  const pathParts = pathname.split('/').filter(Boolean)
  const keyParts = key.split('/').filter(Boolean)
  const params: Record<string, string> = {}
  keyParts.forEach((part, i) => {
    if (part.startsWith(':')) params[part.slice(1)] = pathParts[i]
  })
  return params
}
