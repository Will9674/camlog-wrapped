export default async function handler(req, res) {
  const { url } = req.query
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
