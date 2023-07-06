export function GET(req: Request) {
  const name = new URL(req.url).searchParams.get('name') || 'World'
  return <h1>Hello {name}!</h1>
}
