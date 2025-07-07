import { getAssetFromKV } from '@cloudflare/kv-asset-handler'

addEventListener('fetch', event => {
  event.respondWith(handleRequest(event))
})

async function handleRequest(event) {
  try {
    return await getAssetFromKV(event)
  } catch (e) {
    // If an error is thrown try to serve the asset at index.html
    try {
      let notFoundResponse = await getAssetFromKV(event, {
        mapRequestToAsset: req => new Request(`${new URL(req.url).origin}/index.html`, req),
      })
      return new Response(notFoundResponse.body, { ...notFoundResponse, status: 200 })
    } catch (e) {
      return new Response('Not found', { status: 404 })
    }
  }
}
