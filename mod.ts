import { render } from 'preact-render-to-string'
import { MissingPageError, createRouterUtils } from './router.ts'
import { serveDir } from 'std/http/file_server.ts'
import { CreateAppOptions } from './types.ts'
import { VNode } from 'preact'

export async function createApp<I = undefined>(opts?: CreateAppOptions<I>) {
  const optionsWithDefaults = {
    publicDir: 'public',
    routesDir: 'routes',
    serveOptions: {},
    inject: undefined as I,
    ...opts,
  }

  const { publicDir, serveOptions, inject } = optionsWithDefaults

  const { getRouterFiles, getNotFoundHandler } = await createRouterUtils(
    optionsWithDefaults
  )

  const server = Deno.serve(serveOptions, async (req) => {
    try {
      const method = req.method
      const pathname = new URL(req.url).pathname

      // Try and serve a static file
      // TODO: Should check if they exist rather than just checking for a dot
      if (pathname.includes('.')) {
        return await serveDir(req, {
          showIndex: false,
          fsRoot: `${Deno.cwd()}/${publicDir}}`,
        })
      }

      const { route, layouts } = getRouterFiles(pathname)
      let handler = route[method]
      if (!handler) handler = getNotFoundHandler()[method]

      let res = await handler(req, inject)

      // Handle non-vnode returns
      if (!isVNode(res)) return res

      // Run layouts in reverse order
      for (let i = layouts.length - 1; i >= 0; i--) {
        const layout = layouts[i]
        const layoutHandler = layout[method]
        if (!layoutHandler) continue
        // Type assertion because we know vnode is not undefined
        res = await layoutHandler({ children: res! }, req, inject)
      }
      const html = '<!DOCTYPE html>' + render(res)
      return new Response(html, { headers: { 'Content-Type': 'text/html' } })
    } catch (e) {
      // Handling not having a 404 page
      if (e instanceof MissingPageError) {
        return new Response('404 Not Found', { status: 404 })
      }

      // TODO: Allow 500 handling
      console.error(`[${now()}] [Server]`, e)
      return new Response('500 Server Error', { status: 500 })
    }
  })

  return server.finished
}

// TODO: Is there a better way to do this?
// deno-lint-ignore no-explicit-any
function isVNode(vnode: any): vnode is VNode {
  return vnode && typeof vnode.type === 'function'
}

// Get date formatted like YYYY-MM-DD HH:MM:SS
function now() {
  const date = new Date()
  const pad = (n: number) => n.toString(10).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
    date.getDate()
  )} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(
    date.getSeconds()
  )}`
}

export * from './utils.ts'
export * from './types.ts'