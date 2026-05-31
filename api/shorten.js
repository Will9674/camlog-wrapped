export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  let url
  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body
    url = body?.url
  } catch {
    return res.status(400).end()
  }

  if (!url) return res.status(400).end()

  try {
    const r = await fetch(`https://tinyurl.com/api-create.php?url=${encodeURIComponent(url)}`)
    const short = (await r.text()).trim()
    if (short.startsWith('https://tinyurl.com/')) {
      return res.status(200).send(short)
    }
    throw new Error('unexpected response')
  } catch {
    res.status(500).end()
  }
}
