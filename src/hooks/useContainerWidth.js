import { useRef, useState, useEffect } from 'react'

export function useContainerWidth(initial = 600) {
  const ref = useRef(null)
  const [width, setWidth] = useState(initial)

  useEffect(() => {
    if (!ref.current) return
    const observer = new ResizeObserver((entries) => {
      setWidth(entries[0].contentRect.width)
    })
    observer.observe(ref.current)
    setWidth(ref.current.offsetWidth)
    return () => observer.disconnect()
  }, [])

  return [ref, width]
}
