# @westbrookdaniel/framework

> NOTE: This framework could change wildly on a whim. It's just whatever I like.

Deno REST framework for building web applications.

## Example

I'll be using a import map in this example for simplicity.

```tsx
// main.ts
import { createApp } from '@westbrookdaniel/framework'

// Provide any config options as an optional argument to createApp
await createApp()

// routes/api/route.tsx
// Any `route` file will can handle HTTP requests by exporting a function for each HTTP method
// For example this file will handle POST and GET requests to `/api`
export const POST: RouteHandler = (req) => {
  return new Response('You posted to the API!')
}

export const GET: RouteHandler = (req) => {
  return new Response('You got from the API!')
}

// routes/route.tsx
// Return preact JSX for a route handler to server render it
import { RouteHandler } from '@westbrookdaniel/framework'

export const GET: RouteHandler = (req) => {
  const name = new URL(req.url).searchParams.get('name') || 'World'
  return <h1>Hello {name}!</h1>
}

// routes/layout.tsx
// `layout` routes wrap all their child JSX routes
import { LayoutHandler } from '@westbrookdaniel/framework'
// As long as you don't use a reserved file name, you can organise your code in `routes` however you want
import { MyWrapper } from './MyWrapper.tsx'

export const GET: LayoutHandler = ({ children }) => {
  return <MyWrapper>{children}</MyWrapper>
}

// routes/index.tsx
// There are a few other special files you can use
// This is is the root file, you can think of it as the `index.html`
import { LayoutHandler } from '@westbrookdaniel/framework'

export const GET: LayoutHandler = ({ children }) => {
  return (
    <html lang="en">
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Document</title>
      </head>
      <body>{children}</body>
    </html>
  )
}

// routes/404.tsx
// And as you would expect, this handles when a route/method is not found
// You can also return both a Response and JSX from the same handler
import { LayoutHandler } from '@westbrookdaniel/framework'

export const GET: RouteHandler = (req) => {
  if (req.url === '/api') {
    return new Response('404 Not Found')
  }

  return <h1>404 Not Found</h1>
}
```

One more thing, you can also inject values into your app.
This injected value can be anything, and it will be available in all your route and layout handlers.

```tsx
// main.ts
import { createApp } from '@westbrookdaniel/framework'

const inject = 'Dan'
export type I = typeof inject

await createApp({
  inject: (req) => {
	  // This will run before every request (can be async)
	  return inject
  },
  }
})

// routes/route.tsx
import { RouteHandler } from '@westbrookdaniel/framework'
import { I } from '../main.ts'

export const GET: RouteHandler<I> = (req, name) => {
  // Will render "Hello Dan"
  return <h1>Hello {name}</h1>
}

// routes/layout.tsx
import { LayoutHandler } from '@westbrookdaniel/framework'
import { I } from '../main.ts'

export const GET: LayoutHandler<I> = ({ children }, req, name) => {
  // Will log "Server says hello to Dan"
  console.log(`Server says hello to ${name}`)
  return <div>{children}</div>
}
```
