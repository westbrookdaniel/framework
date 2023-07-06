import { Handler, Route, Layout, CreateAppOptions } from './types.ts'

/**
 * Create router utils to get the page and layout files
 *
 * Use filenames starting with a : to denote a dynamic route
 * Use filenames starting with _ to ignore the file or directory
 *
 * Page files (required) - page.tsx
 * @example
 * filePath -> renders on
 * pages/page.tsx -> /
 * pages/about/page.tsx -> /about
 * pages/blog/:slug/page.tsx -> /blog/:slug
 * pages/_foo.tsx -> never
 *
 * Layout files (optional) - layout.tsx
 * @example
 * filePath -> renders on + all of its children
 * pages/layout.tsx -> /
 * layouts/blog/layout.tsx -> /blog
 * layouts/blog/:slug/layout.tsx -> /blog/:slug
 */
export async function createRouterUtils<I>({
  routesDir,
  notFoundFile,
  layoutFile,
  routeFile,
}: CreateAppOptions<I>) {
  // Get all the files to be routes
  const fileMap = new Map<string, Handler<I>>()
  async function addFiles(prefix: string, path: string) {
    for await (const dirEntry of Deno.readDir(
      new URL(`${prefix}${path}`, import.meta.url)
    )) {
      if (dirEntry.isFile) {
        const mod = await import(`${prefix}${path}/${dirEntry.name}`)
        fileMap.set(`${path}/${dirEntry.name}`, mod)
      } else {
        await addFiles(prefix, `${path}/${dirEntry.name}`)
      }
    }
  }
  try {
    await addFiles(`${Deno.cwd()}/${routesDir}`, '')
  } catch (e) {
    console.debug(e)
    devError(`No routes directory found. Expected \`./${routesDir}\``)
  }

  /**
   * Accepts a pathname for the request and returns the page and layout files
   * @param pathname - the pathname of the request
   *
   * Similar to react-router-dom's matchRoutes
   *
   * @example
   * getRouterFiles('/') -> { page: pages/page.tsx, layouts: [pages/layout.tsx] }
   * getRouterFiles('/about') -> { page: pages/about/page.tsx, layouts: [pages/layout.tsx, pages/about/layout.tsx] }
   * getRouterFiles('/blog/foo') -> { page: pages/:slug/page.tsx, layouts: [pages/layout.tsx, pages/:slug/layout.tsx] }
   * getRouterFiles('/something/else') -> { page: 404.tsx, layouts: [] }
   */
  function getRouterFiles(pathname: string) {
    const pathParts = pathname.split('/').filter(Boolean)
    if (pathParts.length === 0) pathParts.push('/')

    for (const [key, handler] of fileMap.entries()) {
      const keyParts = key.split('/').filter(Boolean)
      // TODO: Handle ts, js, jsx
      const isRoute = keyParts[keyParts.length - 1] === `${routeFile}.tsx`
      if (!isRoute) continue
      keyParts.pop()
      if (keyParts.length === 0) keyParts.push('/')

      // If the key is a static route, check if the path matches
      if (
        keyParts.length === pathParts.length &&
        pathParts.every((part, i) => part === keyParts[i])
      ) {
        return { route: handler as Route<I>, layouts: getLayouts(key) }
      }

      // If the key is a dynamic route, check if the path matches
      if (
        keyParts.length === pathParts.length &&
        keyParts.some((part) => part.startsWith(':'))
      ) {
        const isMatch = keyParts.every((part, i) => {
          if (part.startsWith(':')) return true
          return part === pathParts[i]
        })
        if (isMatch)
          return { route: handler as Route<I>, layouts: getLayouts(key) }
      }
    }

    // TODO: Handle ts, js, jsx
    return { route: {} as Route<I>, layouts: getLayouts(`/${routeFile}.tsx`) }
  }

  /**
   * Returns the 404 page with it's layouts
   */
  function getNotFoundHandler() {
    // TODO: Handle ts, js, jsx
    const notFound = fileMap.get(`/${notFoundFile}.tsx`)
    if (!notFound) throw new MissingPageError('Unable to find 404 page')
    return notFound as Route<I>
  }

  /**
   * Returns the layout files for a given page file
   * @param pageFile - the page file
   * @example
   * getLayouts('pages/page.tsx') -> [pages/layout.tsx]
   * getLayouts('pages/about/page.tsx') -> [pages/layout.tsx, pages/about/layout.tsx]
   * getLayouts('pages/blog/:slug/page.tsx') -> [pages/layout.tsx, pages/:slug/layout.tsx]
   */
  function getLayouts(pageKey: string) {
    const layouts: Handler<I>[] = []

    // TODO: Make this filename configurable and handle ts, js, jsx
    const template = fileMap.get('/index.tsx')
    if (template) layouts.push(template)

    const pageKeyParts = pageKey.split('/')
    pageKeyParts.pop()

    for (const [key, handler] of fileMap.entries()) {
      const keyParts = key.split('/')
      // TODO: Handle ts, js, jsx
      const isLayout = keyParts[keyParts.length - 1] === `${layoutFile}.tsx`
      if (!isLayout) continue
      keyParts.pop()

      const isMatch = keyParts.every((part, i) => {
        if (part.startsWith(':')) return true
        return part === pageKeyParts[i]
      })
      if (isMatch) layouts.push(handler)
    }
    return layouts as Layout<I>[]
  }

  return {
    getRouterFiles,
    getNotFoundHandler,
  }
}

function devError(message: string) {
  console.error(`
[Error]

${message}
`)
  Deno.exit(1)
}

export class MissingPageError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'MissingPageError'
  }
}
