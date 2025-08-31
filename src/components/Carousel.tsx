import { useEffect, useMemo, useRef, useState } from 'react'
import type { MarketData } from '../App'

type CarouselProps = {
  regions: string[]
  allMarketsData: Record<string, MarketData[]>
}

const SLIDE_WIDTH = 240
const SLIDE_GAP = 16

function Carousel({ regions, allMarketsData }: CarouselProps) {
  const baseSlides = useMemo(() => regions, [regions])

  const viewportRef = useRef<HTMLDivElement | null>(null)
  const trackRef = useRef<HTMLDivElement | null>(null)

  // visible slides count based on viewport width
  const [visibleCount, setVisibleCount] = useState<number>(1)
  useEffect(() => {
    const el = viewportRef.current
    if (!el) return
    const calc = () => {
      const width = el.clientWidth
      const count = Math.max(1, Math.ceil((width + SLIDE_GAP) / (SLIDE_WIDTH + SLIDE_GAP)))
      setVisibleCount(count)
    }
    calc()
    const obs = new ResizeObserver(calc)
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  const cloneCountEachSide = Math.max(visibleCount + 2, 4)

  const slides = useMemo(() => {
    const prefix = baseSlides.slice(-cloneCountEachSide)
    const suffix = baseSlides.slice(0, cloneCountEachSide)
    return [...prefix, ...baseSlides, ...suffix]
  }, [baseSlides, cloneCountEachSide])

  const [index, setIndex] = useState<number>(cloneCountEachSide) // start at first real slide window
  const [isAnimating, setIsAnimating] = useState<boolean>(false)

  // Drag support
  const pointerStartX = useRef<number | null>(null)
  const startIndexRef = useRef<number>(index)
  const dragOffset = useRef<number>(0)

  const slideUnit = SLIDE_WIDTH + SLIDE_GAP

  const goTo = (next: number, animate = true) => {
    setIsAnimating(animate)
    setIndex(next)
  }

  const next = () => goTo(index + 1)
  const prev = () => goTo(index - 1)

  // Handle seamless loop by jumping without animation when crossing clones
  useEffect(() => {
    const handleTransitionEnd = () => {
      let nextIndex = index
      const realLen = baseSlides.length
      const k = cloneCountEachSide
      if (index >= k + realLen) {
        nextIndex = index - realLen
        setIsAnimating(false)
        setIndex(nextIndex)
      } else if (index < k) {
        nextIndex = index + realLen
        setIsAnimating(false)
        setIndex(nextIndex)
      }
    }
    const el = trackRef.current
    if (!el) return
    el.addEventListener('transitionend', handleTransitionEnd)
    return () => el.removeEventListener('transitionend', handleTransitionEnd)
  }, [index, baseSlides.length, cloneCountEachSide])

  // Pointer events for drag/swipe
  const onPointerDown: React.PointerEventHandler<HTMLDivElement> = (e) => {
    pointerStartX.current = e.clientX
    startIndexRef.current = index
    dragOffset.current = 0
    ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
    setIsAnimating(false)
  }

  const onPointerMove: React.PointerEventHandler<HTMLDivElement> = (e) => {
    if (pointerStartX.current === null) return
    dragOffset.current = e.clientX - pointerStartX.current
    // apply transform in-line via style - we'll rely on computed transform below
    if (trackRef.current) {
      const translate = -(startIndexRef.current * slideUnit) - dragOffset.current
      trackRef.current.style.transform = `translateX(${translate}px)`
    }
  }

  const onPointerUp: React.PointerEventHandler<HTMLDivElement> = (e) => {
    if (pointerStartX.current === null) return
    const delta = dragOffset.current
    pointerStartX.current = null
    dragOffset.current = 0
    const threshold = SLIDE_WIDTH * 0.3
    if (delta < -threshold) {
      goTo(startIndexRef.current + 1)
    } else if (delta > threshold) {
      goTo(startIndexRef.current - 1)
    } else {
      goTo(startIndexRef.current)
    }
  }

  // compute transform
  const translateX = -(index * slideUnit)

  return (
    <div className="carousel">
      <div
        ref={viewportRef}
        className="carousel__viewport"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        <div
          ref={trackRef}
          className={`carousel__track${isAnimating ? ' is-animating' : ''}`}
          style={{ transform: `translateX(${translateX}px)` }}
        >
          {slides.map((regionName, i) => {
            const regionData = allMarketsData[regionName] || []
            const totalSellIn = regionData.reduce((sum, market) => sum + market.sellInValue, 0)
            const regionGoal = regionData.length * 20000 // 20k per market
            const progress = regionGoal > 0 ? (totalSellIn / regionGoal) * 100 : 0
            
            // Calculate time progress
            const startDate = new Date(2025, 7, 31) // 31.08.2025
            const endDate = new Date(2026, 7, 31)   // 31.08.2026
            const now = new Date(2026, 2, 15)       // Fake current date: 15.03.2026
            const totalTime = endDate.getTime() - startDate.getTime()
            const elapsedTime = now.getTime() - startDate.getTime()
            const timeProgress = Math.max(0, Math.min((elapsedTime / totalTime) * 100, 100))
            
            // Determine progress status and gradient
            const difference = progress - timeProgress
            let progressGradient = ''
            let cardShadow = ''
            
            if (difference >= 1) {
              // Ahead by 1% or more - green gradient
              progressGradient = 'linear-gradient(90deg, rgba(240, 253, 244, 0.8) 0%, #10b981 100%)'
              cardShadow = '0 6px 24px rgba(16, 185, 129, 0.15), 0 2px 8px rgba(16, 185, 129, 0.08)'
            } else if (difference >= -10) {
              // From 0% to -10% behind - orange gradient
              progressGradient = 'linear-gradient(90deg, rgba(255, 251, 235, 0.8) 0%, #f59e0b 100%)'
              cardShadow = '0 6px 24px rgba(245, 158, 11, 0.15), 0 2px 8px rgba(245, 158, 11, 0.08)'
            } else {
              // More than 10% behind - red gradient
              progressGradient = 'linear-gradient(90deg, rgba(254, 16, 25, 0.4) 0%, #fe1019 100%)'
              cardShadow = '0 6px 24px rgba(254, 16, 25, 0.15), 0 2px 8px rgba(254, 16, 25, 0.08)'
            }
            
            return (
              <div key={`${regionName}-${i}`} className="mini-card carousel__slide region-stat-card" style={{ boxShadow: cardShadow }}>
                <div className="region-stat-content">
                  <div className="region-header">
                    <div className="profile-icon">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="8" r="4" />
                        <path d="M6 21v-2a6 6 0 0112 0v2" />
                      </svg>
                    </div>
                    <div className="region-info">
                      <h4 className="region-name">{regionName}</h4>
                      <span className="region-role">Mars Fieldforce</span>
                    </div>
                    <div className="total-sales-indicator">
                      {totalSellIn.toLocaleString('de-DE')}€
                    </div>
                  </div>
                  
                  <div className="region-progress">
                    <div className="progress-header">
                      <span className="progress-label">Sell in Wert</span>
                    </div>
                    <div className="progress-bar-container">
                      <div className="progress-bar">
                        <div className="progress-fill" style={{ 
                          width: `${Math.min(progress, 100)}%`,
                          background: progressGradient
                        }}></div>
                        <div className="time-indicator" style={{ left: `${timeProgress}%` }}>
                          <span className="time-label">Zeit</span>
                        </div>
                      </div>
                    </div>
                    <div className="progress-values">
                      <span className="progress-start">0€</span>
                      <span className="progress-end">{regionGoal.toLocaleString('de-DE')}€</span>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
      <button className="carousel__nav carousel__nav--prev" onClick={prev} aria-label="Previous">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M15 6L9 12L15 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      <button className="carousel__nav carousel__nav--next" onClick={next} aria-label="Next">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M9 6L15 12L9 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
    </div>
  )
}

export default Carousel


