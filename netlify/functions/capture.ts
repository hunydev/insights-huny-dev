import type { Handler } from '@netlify/functions'

const VALID_DEVICES = new Set(['mobile', 'desktop'])

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

  const queryParams = event.queryStringParameters ?? {}
  const targetUrl = queryParams.url
  const deviceParam = queryParams.dev

  if (!targetUrl) {
    return {
      statusCode: 400,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Missing required query parameter: url' }),
    }
  }

  let strategy = 'desktop'
  if (deviceParam) {
    const normalizedDevice = deviceParam.toLowerCase()
    if (!VALID_DEVICES.has(normalizedDevice)) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          error: "Invalid dev parameter. Expected 'mobile' or 'desktop'.",
        }),
      }
    }
    strategy = normalizedDevice
  }

  try {
    // eslint-disable-next-line no-new
    new URL(targetUrl)
  } catch {
    return {
      statusCode: 400,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Invalid URL provided' }),
    }
  }

  const googleParams = new URLSearchParams({
    url: targetUrl,
    strategy,
    key: apiKey,
    category: 'PERFORMANCE',
  })

  const googleApiUrl = `https://pagespeedonline.googleapis.com/pagespeedonline/v5/runPagespeed?${googleParams.toString()}`

  try {
    const response = await fetch(googleApiUrl)
    const payload = await response.json()

    if (!response.ok) {
      const errorMessage =
        payload?.error?.message ?? 'Failed to fetch data from PageSpeed Insights API'
      return {
        statusCode: response.status,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: errorMessage }),
      }
    }

    const screenshotDataUri =
      payload?.lighthouseResult?.audits?.['full-page-screenshot']?.details?.screenshot?.data ??
      payload?.lighthouseResult?.audits?.['final-screenshot']?.details?.data

    if (!screenshotDataUri || typeof screenshotDataUri !== 'string') {
      return {
        statusCode: 502,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          error: 'Screenshot data is unavailable in PageSpeed Insights response',
        }),
      }
    }

    const match = screenshotDataUri.match(/^data:(.*?);base64,(.+)$/)
    if (!match) {
      return {
        statusCode: 502,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Unexpected screenshot data format' }),
      }
    }

    const [, mimeType, base64Data] = match
    const buffer = Buffer.from(base64Data, 'base64')

    return {
      statusCode: 200,
      headers: {
        'Content-Type': mimeType || 'image/jpeg',
        'Cache-Control': 'public, max-age=0, must-revalidate',
        'Access-Control-Allow-Origin': '*',
      },
      body: buffer.toString('base64'),
      isBase64Encoded: true,
    }
  } catch (error) {
    console.error('Capture API error:', error)
    return {
      statusCode: 502,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        error: 'Failed to fetch data from PageSpeed Insights API',
      }),
    }
  }
}

export { handler }
