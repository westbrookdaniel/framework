import { RouteHandler } from '../../mod.ts'

export const GET: RouteHandler = (req) => {
  const name = new URL(req.url).searchParams.get('name') || 'World'
  return <h1>Hello {name}!</h1>
}
