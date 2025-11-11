import type { Handler } from '@netlify/functions'

const handler: Handler = async (event) => {
  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Method Not Allowed' }),
    }
  }

  const apiKey = process.env.GOOGLE_CLOUD_API_KEY
  if (!apiKey) {
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'GOOGLE_CLOUD_API_KEY is not configured' }),
    }
  }

  const queryParams = new URLSearchParams(event.queryStringParameters ?? {})
  const targetUrl = queryParams.get('url')

  if (!targetUrl) {
    return {
      statusCode: 400,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Missing required query parameter: url' }),
    }
  }

  queryParams.set('url', targetUrl)
  queryParams.set('key', apiKey)

  const googleApiUrl = `https://pagespeedonline.googleapis.com/pagespeedonline/v5/runPagespeed?${queryParams.toString()}`

  try {
    const response = await fetch(googleApiUrl)
    const payload = await response.json()

    return {
      statusCode: response.status,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }
  } catch (error) {
    console.error('Pagespeed API error:', error)
    return {
      statusCode: 502,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Failed to fetch data from PageSpeed Insights API' }),
    }
  }
}

export { handler }
