import { VNode } from 'preact'

export type HTTPMethods = string // Typed as string since that's how deno requests are typed

export type Handler<I> = Route<I> | Layout<I>
export type Route<I> = Record<HTTPMethods, RouteHandler<I>>
export type Layout<I> = Record<HTTPMethods, LayoutHandler<I>>

export type RouteHandler<I = undefined> = (
  req: Request,
  injected: I
) => RouteReturn
export type RouteReturn = Response | Promise<Response> | VNode | Promise<VNode>

export type LayoutHandler<I = undefined> = (
  props: LayoutProps,
  req: Request,
  injected: I
) => LayoutReturn
export type LayoutProps = { children: VNode }
export type LayoutReturn = VNode | Promise<VNode>

export type CreateAppOptions<I> = {
  /**
   * The directory to serve static files from.
   * Defaults to `public`.
   */
  publicDir?: string
  /**
   * The directory to convert to routes.
   * Defaults to `routes`.
   */
  routesDir?: string
  /**
   * The name of the file to use for 404s.
   * Defaults to `404`.
   */
  notFoundFile?: string
  /**
   * The name of files used for a route
   * Defaults to `route`.
   */
  routeFile?: string
  /**
   * The name of files used for a layout
   * Defaults to `layout`.
   */
  layoutFile?: string
  /**
   * Options to for Deno.serve
   */
  serveOptions?: Deno.ServeOptions
  /**
   * To inject into every handler
   * This will be accessed in reverse order
   * e.g. page -> layout for subroute -> layout for root
   * Note: layouts will only be used if the page handler returns a vnode
   */
  inject?: (req: Request) => Promise<I> | I
}
