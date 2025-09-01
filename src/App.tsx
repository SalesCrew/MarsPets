
import './App.css'
import Header from './components/Header'
import Carousel from './components/Carousel'
import Calendar from './components/Calendar'
import CustomDropdown from './components/CustomDropdown'
import { useState, useRef, useEffect, useMemo } from 'react'

export type MarketData = {
  name: string
  sellInValue: number
  promotions: number
}

// Particle component for AI thinking animation
const Particle = ({ color, delay, index }: { color: 'blue' | 'red'; delay: number; index: number }) => {
  // Create more variety in paths
  const yOffset = Math.sin(index * 0.8) * 50 + Math.cos(index * 1.2) * 30 // More complex vertical movement
  const animationName = `particleFlow${index % 4}` // Use different animation paths
  
  const particleStyle: React.CSSProperties = {
    position: 'absolute',
    width: '6px',
    height: '6px',
    borderRadius: '50%',
    background: color === 'blue' ? '#00009f' : '#fe1019',
    opacity: 0,
    animation: `${animationName} 4s ${delay}s infinite ease-in-out`,
    animationFillMode: 'both',
    zIndex: 1, // Behind everything
    pointerEvents: 'none',
    top: `calc(40% + ${yOffset}px)` // Adjusted to cover more of the card height
  }
  
  return <div style={particleStyle} />
}

function App() {
  const [showCalendar, setShowCalendar] = useState(false)
  const [selectedDateRange, setSelectedDateRange] = useState<string>('All Time')
  const [selectedRegion, setSelectedRegion] = useState<string>('Alle Regionen')
  const [selectedMarket, setSelectedMarket] = useState<string>('Alle Märkte')
  const [selectedStartDate, setSelectedStartDate] = useState<Date | null>(null)
  const [selectedEndDate, setSelectedEndDate] = useState<Date | null>(null)

  
  // AI Chat states
  const [chatMessages, setChatMessages] = useState<{ id: number; text: string; isUser: boolean; timestamp: Date }[]>([
    { id: 1, text: "Hi! I'm PetsAI, your intelligent sales assistant. I can help you analyze your performance data, identify trends, and answer questions about your markets and regions.", isUser: false, timestamp: new Date() }
  ])
  const [chatInput, setChatInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [aiStatus, setAiStatus] = useState('')
  const chatMessagesRef = useRef<HTMLDivElement>(null)
  
  // Grid card filters - one state per card
  const [gridFilters, setGridFilters] = useState<Record<string, 'MTD' | 'Q1' | 'Q2' | 'Q3' | 'Q4' | 'All'>>({})
  const [showSellInModal, setShowSellInModal] = useState(false)
  const [chartHover, setChartHover] = useState<{ x: number; weekIndex: number; weeklyValue: number; cumulativeValue: number; volumeCount: number } | null>(null)

  const handleRegionChange = (region: string) => {
    setSelectedRegion(region)
    setSelectedMarket('Alle Märkte') // Reset market selection when region changes
  }

  const handleDateRangeSelect = (range: string, startDate?: Date, endDate?: Date) => {
    setSelectedDateRange(range)
    setSelectedStartDate(startDate || null)
    setSelectedEndDate(endDate || null)
    setShowCalendar(false)
  }

  const regions = [
    'Alle Regionen',
    'Anna Mueller',
    'Thomas Weber', 
    'Lisa Schmidt',
    'Michael Fischer',
    'Sarah Wagner',
    'David Becker',
    'Julia Hoffmann',
    'Marco Schulz',
    'Nina Richter'
  ]



  const allMarketsData = useMemo(() => {
    const generateMarketData = (startPlz: number): MarketData[] => {
      const marketTypes = ['Billa', 'Billa+', 'Fressnapf', 'Spar', 'Interspar', 'Eurospar', 'Hofer', 'Penny', 'Lidl', 'DIY']
      const promotionValues = [2000, 4000, 6000]
      
      return Array.from({ length: 20 }, (_, i) => {
        const marketType = marketTypes[i % marketTypes.length]
        const plz = startPlz + i
        const promotionValue = promotionValues[i % 3]
        const promotionsCount = Math.floor(Math.random() * 5) + 1 // 1-5 promotions per market
        
        return {
          name: `${marketType} ${plz}`,
          sellInValue: promotionValue * promotionsCount,
          promotions: promotionsCount
        }
      })
    }

    return {
      'Anna Mueller': generateMarketData(1010),
      'Thomas Weber': generateMarketData(2010),
      'Lisa Schmidt': generateMarketData(3010),
      'Michael Fischer': generateMarketData(4010),
      'Sarah Wagner': generateMarketData(5010),
      'David Becker': generateMarketData(6010),
      'Julia Hoffmann': generateMarketData(7010),
      'Marco Schulz': generateMarketData(8010),
      'Nina Richter': generateMarketData(9010)
    }
  }, []) // Empty dependency array means this will only run once

  const getFilteredMarketsData = (): MarketData[] => {
    if (selectedRegion === 'Alle Regionen') {
      return Object.values(allMarketsData).flat()
    } else {
      return allMarketsData[selectedRegion as keyof typeof allMarketsData] || []
    }
  }

  const getClusteredMarketOptions = () => {
    const marketsData = getFilteredMarketsData()
    
    // Define market clusters
    const clusters = new Set<string>()
    
    marketsData.forEach(market => {
      const marketName = market.name
      if (marketName.includes('Billa+')) {
        clusters.add('Billa+')
      } else if (marketName.includes('Billa')) {
        clusters.add('Billa')
      } else if (marketName.includes('Eurospar') || marketName.includes('Interspar') || marketName.includes('Spar')) {
        clusters.add('Spar/Eurospar')
      } else if (marketName.includes('Fressnapf')) {
        clusters.add('Fressnapf')
      } else if (marketName.includes('Hofer')) {
        clusters.add('Hofer')
      } else if (marketName.includes('DIY')) {
        clusters.add('DIY')
      } else if (marketName.includes('Penny')) {
        clusters.add('Penny')
      } else {
        clusters.add('Sonstige')
      }
    })
    
    return ['Alle Märkte', ...Array.from(clusters).sort()]
  }

  const getClusterFilteredData = (marketsData: MarketData[]) => {
    if (selectedMarket === 'Alle Märkte') {
      return marketsData
    }
    
    // Handle cluster filtering
    return marketsData.filter(market => {
      const marketName = market.name
      switch (selectedMarket) {
        case 'Billa+':
          return marketName.includes('Billa+')
        case 'Billa':
          return marketName.includes('Billa') && !marketName.includes('Billa+')
        case 'Spar/Eurospar':
          return marketName.includes('Eurospar') || marketName.includes('Interspar') || marketName.includes('Spar')
        case 'Fressnapf':
          return marketName.includes('Fressnapf')
        case 'Hofer':
          return marketName.includes('Hofer')
        case 'DIY':
          return marketName.includes('DIY')
        case 'Penny':
          return marketName.includes('Penny')
        case 'Sonstige':
          return marketName.includes('Lidl')
        default:
          return market.name === selectedMarket
      }
    })
  }

  const calculateTotalSellIn = () => {
    const marketsData = getFilteredMarketsData()
    const filteredData = getClusterFilteredData(marketsData)
    return filteredData.reduce((total, market) => total + market.sellInValue, 0)
  }

  const calculateGoalValue = () => {
    const marketsData = getFilteredMarketsData()
    const filteredData = getClusterFilteredData(marketsData)
    return filteredData.length * 20000 // 20k per market
  }

  const calculateTimeProgress = () => {
    // Fake current date to be in middle of campaign year
    const fakeNow = new Date(2026, 2, 15) // 15.03.2026 (middle of campaign)
    
    if (!selectedStartDate || !selectedEndDate) {
      // Default year timeframe
      const start = new Date(2025, 7, 31) // 31.08.2025
      const end = new Date(2026, 7, 31)   // 31.08.2026
      const total = end.getTime() - start.getTime()
      const elapsed = fakeNow.getTime() - start.getTime()
      return Math.max(0, Math.min((elapsed / total) * 100, 100))
    } else {
      // Custom timeframe
      const start = selectedStartDate
      const end = selectedEndDate
      
      if (start.getTime() === end.getTime()) {
        // Single day - show if we've reached that day
        return fakeNow >= start ? 100 : 0
      } else {
        // Date range
        const total = end.getTime() - start.getTime()
        const elapsed = fakeNow.getTime() - start.getTime()
        return Math.max(0, Math.min((elapsed / total) * 100, 100))
      }
    }
  }

  const getTimeDisplayDates = () => {
    if (!selectedStartDate || !selectedEndDate) {
      return {
        start: '31.08.2025',
        end: '31.08.2026'
      }
    } else {
      const formatDate = (date: Date) => date.toLocaleDateString('de-DE')
      return {
        start: formatDate(selectedStartDate),
        end: formatDate(selectedEndDate)
      }
    }
  }

  // Regional visit data - stable per region manager
  const regionalVisitData = useMemo(() => {
    const totalVisits = 875
    const regionVisits: Record<string, { visits: number; successRate: number }> = {}
    
    // Distribute 875 visits among 9 region managers (excluding 'Alle Regionen')
    const managers = regions.slice(1)
    let remainingVisits = totalVisits
    
    managers.forEach((manager, index) => {
      const isLast = index === managers.length - 1
      const visits = isLast ? remainingVisits : Math.floor(Math.random() * 120) + 80 // 80-200 visits per manager
      const successRate = 85 + Math.random() * 13 // 85-98% success rate
      
      regionVisits[manager] = {
        visits: Math.min(visits, remainingVisits),
        successRate: Math.round(successRate)
      }
      
      remainingVisits = Math.max(0, remainingVisits - visits)
    })
    
    return regionVisits
  }, []) // Static data, no dependencies needed

  // Market cluster visit data - stable per market cluster
  const marketClusterVisitData = useMemo(() => {
    const clusterVisits: Record<string, { visits: number; successRate: number }> = {
      'Billa': { visits: 145, successRate: 89 },
      'Billa+': { visits: 98, successRate: 94 },
      'Spar/Eurospar': { visits: 167, successRate: 87 },
      'Fressnapf': { visits: 112, successRate: 92 },
      'Hofer': { visits: 89, successRate: 85 },
      'DIY': { visits: 76, successRate: 88 },
      'Penny': { visits: 93, successRate: 86 },
      'Sonstige': { visits: 95, successRate: 90 }
    }
    return clusterVisits
  }, [])

  const visitData = useMemo(() => {
    // If market is filtered, use market cluster data
    if (selectedMarket !== 'Alle Märkte') {
      const clusterData = marketClusterVisitData[selectedMarket]
      if (clusterData) {
        const visitsWithSales = Math.round(clusterData.visits * clusterData.successRate / 100)
        return {
          totalVisits: clusterData.visits,
          visitsWithSales,
          visitsWithoutSales: clusterData.visits - visitsWithSales,
          successPercentage: clusterData.successRate
        }
      }
    }
    
    // Otherwise use region data
    if (selectedRegion === 'Alle Regionen') {
      // Aggregate all regions
      const totalVisits = Object.values(regionalVisitData).reduce((sum, data) => sum + data.visits, 0)
      const totalSuccessful = Object.values(regionalVisitData).reduce((sum, data) => sum + Math.round(data.visits * data.successRate / 100), 0)
      const overallSuccessRate = totalVisits > 0 ? Math.round((totalSuccessful / totalVisits) * 100) : 0
      
      return {
        totalVisits,
        visitsWithSales: totalSuccessful,
        visitsWithoutSales: totalVisits - totalSuccessful,
        successPercentage: overallSuccessRate
      }
    } else {
      // Single region data
      const regionData = regionalVisitData[selectedRegion]
      if (!regionData) {
        return { totalVisits: 0, visitsWithSales: 0, visitsWithoutSales: 0, successPercentage: 0 }
      }
      
      const visitsWithSales = Math.round(regionData.visits * regionData.successRate / 100)
      
      return {
        totalVisits: regionData.visits,
        visitsWithSales,
        visitsWithoutSales: regionData.visits - visitsWithSales,
        successPercentage: regionData.successRate
      }
    }
  }, [selectedRegion, selectedMarket, regionalVisitData, marketClusterVisitData]) // Depends on both filter selections



  const totalSellIn = calculateTotalSellIn()
  const goalValue = calculateGoalValue()
  const sellInProgress = goalValue > 0 ? (totalSellIn / goalValue) * 80 : 0 // 80% = 100% goal, allows over 100%
  const rawTimeProgress = calculateTimeProgress()
  const timeProgress = rawTimeProgress * 0.8 // Scale to 80% = 100% goal
  const timeDisplayDates = getTimeDisplayDates()

  const getStatusColor = () => {
    const timePct = rawTimeProgress
    const sellPct = goalValue > 0 ? (totalSellIn / goalValue) * 100 : 0
    const difference = timePct - sellPct

    if (difference <= 5) return { color: '#10b981', status: 'On Track' } // Green - on track
    if (difference <= 15) return { color: '#f59e0b', status: 'Leicht hinten' } // Orange - slightly behind
    return { color: '#ef4444', status: 'Hinten' } // Red - behind
  }

  const statusInfo = getStatusColor()

  const filteredMarkets = getClusteredMarketOptions()
  
  const mtdExtraValue = useMemo(() => {
    // Generate a stable MTD extra value between 30k-50k
    return 30000 + Math.floor(Math.random() * 20000)
  }, []) // Only calculate once on mount

  // Build cumulative weekly (KW) data for line chart with variety
  const weeklyCumulativeData = useMemo(() => {
    const start = new Date(2025, 7, 31) // 31.08.2025
    const end = new Date(2026, 7, 31)   // 31.08.2026
    const weekMs = 7 * 24 * 60 * 60 * 1000
    const fakeNow = new Date(2026, 2, 15)
    const totalWeeks = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / weekMs))
    const elapsedWeeks = Math.max(1, Math.min(totalWeeks, Math.ceil((fakeNow.getTime() - start.getTime()) / weekMs)))

    // Create varied weekly additions - some weeks no progress, others more
    const weeklyAdditions: number[] = []
    let currentTotal = 0
    
    for (let i = 0; i < elapsedWeeks; i++) {
      const weekType = Math.random()
      if (weekType < 0.2) {
        // 20% chance: no progress this week
        weeklyAdditions.push(0)
      } else if (weekType < 0.6) {
        // 40% chance: normal progress
        weeklyAdditions.push(Math.round(totalSellIn * 0.8 / elapsedWeeks))
      } else {
        // 40% chance: high progress week
        weeklyAdditions.push(Math.round(totalSellIn * 1.5 / elapsedWeeks))
      }
    }
    
    // Adjust to reach target total
    const actualTotal = weeklyAdditions.reduce((sum, val) => sum + val, 0)
    const adjustment = (totalSellIn - actualTotal) / elapsedWeeks
    weeklyAdditions.forEach((_, i) => {
      if (weeklyAdditions[i] > 0) weeklyAdditions[i] += Math.round(adjustment)
    })

    // Build cumulative points
    const points: number[] = []
    for (let i = 0; i < elapsedWeeks; i++) {
      currentTotal += weeklyAdditions[i]
      points.push(Math.max(0, currentTotal))
    }
    
    // Generate volume data (number of sell-ins per week) with variety
    const volumeData = weeklyAdditions.map((addition, index) => {
      if (addition === 0) return 0
      
      // Add variety to volume counts
      const baseVolume = Math.max(1, Math.round(addition / 5000))
      const varietyFactor = 0.5 + Math.sin(index * 0.7) * 0.4 + Math.cos(index * 1.1) * 0.3 // Creates waves of variety
      const adjustedVolume = Math.round(baseVolume * (0.7 + varietyFactor))
      
      return Math.max(1, adjustedVolume)
    })
    
    return { points, totalWeeks, elapsedWeeks, weeklyAdditions, volumeData }
  }, [totalSellIn])

  const plannedLineData = useMemo(() => {
    // Straight plan line from 0 to goal across all weeks
    const start = new Date(2025, 7, 31)
    const end = new Date(2026, 7, 31)
    const weekMs = 7 * 24 * 60 * 60 * 1000
    const totalWeeks = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / weekMs))
    const values: number[] = []
    for (let i = 1; i <= totalWeeks; i++) {
      values.push(Math.round((goalValue * i) / totalWeeks))
    }
    return { values, totalWeeks }
  }, [goalValue])

  // AI Chat functions
  const handleSendMessage = async () => {
    if (!chatInput.trim()) return
    
    const userMessage = {
      id: Date.now(),
      text: chatInput,
      isUser: true,
      timestamp: new Date()
    }
    
    setChatMessages(prev => [...prev, userMessage])
    setChatInput('')
    setIsTyping(true)
    
    // Simulate AI processing with status updates
    const statuses = [
      'Daten werden gesammelt...',
      'Sell-in Werte werden berechnet...',
      'Regionale Performance wird analysiert...',
      'Marktdaten werden ausgewertet...',
      'Antwort wird vorbereitet...'
    ]
    
    let statusIndex = 0
    setAiStatus(statuses[0])
    
    const statusInterval = setInterval(() => {
      statusIndex++
      if (statusIndex < statuses.length) {
        setAiStatus(statuses[statusIndex])
      }
    }, 2000)
    
    // Simulate AI response delay
    setTimeout(() => {
      clearInterval(statusInterval)
      const aiResponse = {
        id: Date.now() + 1,
        text: generateAIResponse(chatInput),
        isUser: false,
        timestamp: new Date()
      }
      setChatMessages(prev => [...prev, aiResponse])
      setIsTyping(false)
      setAiStatus('')
    }, 10000)
  }

  const generateAIResponse = (input: string): string => {
    const lowerInput = input.toLowerCase()
    
    if (lowerInput.includes('performance') || lowerInput.includes('how are we doing')) {
      return `Based on current data, you're at ${Math.round(sellInProgress)}% of your sell-in goal with ${totalSellIn.toLocaleString('de-DE')}€ total revenue. ${statusInfo.status === 'On Track' ? 'You\'re performing well!' : 'Consider focusing on underperforming regions.'}`
    }
    
    if (lowerInput.includes('region') || lowerInput.includes('best') || lowerInput.includes('top')) {
      const allRegionData = Object.entries(allMarketsData).map(([region, markets]) => ({
        region,
        total: markets.reduce((sum, market) => sum + market.sellInValue, 0)
      }))
      const topRegion = allRegionData.reduce((max, region) => region.total > max.total ? region : max)
      return `Your top performing region is ${topRegion.region} with ${topRegion.total.toLocaleString('de-DE')}€ in sales.`
    }
    
    if (lowerInput.includes('goal') || lowerInput.includes('target')) {
      return `Your current goal is ${goalValue.toLocaleString('de-DE')}€. You've achieved ${(totalSellIn / goalValue * 100).toFixed(1)}% so far. ${goalValue - totalSellIn > 0 ? `You need ${(goalValue - totalSellIn).toLocaleString('de-DE')}€ more to reach your target.` : 'Congratulations on exceeding your goal!'}`
    }
    
    if (lowerInput.includes('time') || lowerInput.includes('deadline')) {
      return `You're ${rawTimeProgress.toFixed(1)}% through your current timeframe. ${rawTimeProgress > sellInProgress / 80 * 100 ? 'You may need to accelerate sales efforts.' : 'You\'re ahead of schedule - great work!'}`
    }
    
    return "I can help you analyze your sales performance, regional data, goal progress, and market insights. Try asking about your performance, best regions, or goal status!"
  }

  useEffect(() => {
    if (chatMessagesRef.current) {
      chatMessagesRef.current.scrollTop = chatMessagesRef.current.scrollHeight
    }
  }, [chatMessages])

  const handleGridFilterChange = (regionName: string, filter: 'MTD' | 'Q1' | 'Q2' | 'Q3' | 'Q4' | 'All') => {
    setGridFilters(prev => ({ ...prev, [regionName]: filter }))
  }

  const getFilteredMarketData = (regionData: MarketData[], filter: 'MTD' | 'Q1' | 'Q2' | 'Q3' | 'Q4' | 'All') => {
    // For demo purposes, simulate filtering by reducing data
    switch (filter) {
      case 'MTD':
        return regionData.map(market => ({ ...market, sellInValue: Math.round(market.sellInValue * 0.4) }))
      case 'Q1':
        return regionData.map(market => ({ ...market, sellInValue: Math.round(market.sellInValue * 0.25) }))
      case 'Q2':
        return regionData.map(market => ({ ...market, sellInValue: Math.round(market.sellInValue * 0.5) }))
      case 'Q3':
        return regionData.map(market => ({ ...market, sellInValue: Math.round(market.sellInValue * 0.75) }))
      case 'Q4':
        return regionData.map(market => ({ ...market, sellInValue: Math.round(market.sellInValue * 1.0) }))
      default:
        return regionData
    }
  }

  return (
    <div className="app">
      <Header />
      <main className="page">
        <div className="cards">
          {isTyping && (
            <div className="particles-container">
              {Array.from({ length: 20 }).map((_, i) => (
                <Particle 
                  key={i} 
                  color={i % 2 === 0 ? 'blue' : 'red'} 
                  delay={i * 0.2}
                  index={i}
                />
              ))}
            </div>
          )}
          <section className="card card--small">
            <div className="chat-container">
              <div className="chat-header">
                <div className="chat-avatar">
                  <div className="avatar-gradient"></div>
                  <span className="avatar-icon">🧠</span>
                </div>
                <div className="chat-title">
                  <h3>PetsAI</h3>
                  <span className="chat-subtitle">Sales Intelligence Assistant</span>
                </div>
                <div className="chat-status">
                  <div className="status-dot active"></div>
                </div>
              </div>
              
              <div className="chat-messages" ref={chatMessagesRef}>
                {chatMessages.map(message => (
                  <div key={message.id} className={`message ${message.isUser ? 'message--user' : 'message--ai'}`}>
                    <div className="message-content">
                      <p>{message.text}</p>
                      <span className="message-time">
                        {message.timestamp.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                ))}
                
                {isTyping && aiStatus && (
                  <div className="message message--ai message--status">
                    <div className="message-content">
                      <p className="status-text">{aiStatus}</p>
                    </div>
                  </div>
                )}
      </div>
              
              <div className="chat-input-container">
                <div className="chat-input-wrapper">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    placeholder="Ask me about your sales performance..."
                    className="chat-input"
                    disabled={isTyping}
                  />
                  <button 
                    onClick={handleSendMessage}
                    className="send-button"
                    disabled={!chatInput.trim() || isTyping}
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="22" y1="2" x2="11" y2="13"></line>
                      <polygon points="22,2 15,22 11,13 2,9 22,2"></polygon>
                    </svg>
        </button>
                </div>
              </div>
            </div>
          </section>
          <section className={`card card--large ${isTyping ? 'card--ai-thinking' : ''}`}>
            <div className="card-large-content">
              <div className="top-area">
                <div className="filters">
                  <div className="filter-item">
                    <span className="filter-label">Zeitraum</span>
                    <div className="date-selector" onClick={() => setShowCalendar(true)}>{selectedDateRange}</div>
                  </div>
                  <div className="filter-item">
                    <span className="filter-label">Region</span>
                    <CustomDropdown 
                      label="Region" 
                      options={regions} 
                      value={selectedRegion} 
                      onChange={handleRegionChange} 
                    />
                  </div>
                  <div className="filter-item filter-item--last">
                    <span className="filter-label">Markt</span>
                    <CustomDropdown 
                      label="Markt" 
                      options={filteredMarkets} 
                      value={selectedMarket} 
                      onChange={setSelectedMarket}
                      searchable={true}
                    />
                    <div className="status-indicator">
                      <div 
                        className="status-dot" 
                        style={{ backgroundColor: statusInfo.color }}
                      ></div>
                      <span className="status-text" style={{ color: statusInfo.color }}>{statusInfo.status}</span>
                    </div>
                  </div>
                  <div className="mtd-section">
                    <div className="mtd-label">MTD Extra</div>
                    <div className="mtd-value">{mtdExtraValue.toLocaleString('de-DE')}€</div>
                  </div>
                </div>
              </div>
              <div className="progress-area">
                <div className="kpi">
                  <div className="kpi__title">Zeit</div>
                  <div className="kpi__bar-wrapper">
                    <div className="kpi__bar kpi__bar--with-target">
                      <div className="kpi__progress kpi__progress--zeit" style={{ width: `${Math.min(timeProgress, 100)}%`, '--target-width': `${Math.min(timeProgress, 100)}%` } as React.CSSProperties}></div>
                      <div className="kpi__target-line" data-goal={timeDisplayDates.end}></div>
                    </div>
                  </div>
                  <div className="kpi__values">
                    <span className="kpi__start">{timeDisplayDates.start}</span>
                    <span className="kpi__end"></span>
                  </div>
                </div>
                <div className="kpi kpi--clickable" onClick={() => setShowSellInModal(true)}>
                  <div className="kpi__title">Sell in Wert</div>
                  <div className="kpi__bar-wrapper">
                    <div className="kpi__bar kpi__bar--with-target">
                      <div className="kpi__progress kpi__progress--sell" style={{ width: `${Math.min(sellInProgress, 100)}%`, '--target-width': `${Math.min(sellInProgress, 100)}%` } as React.CSSProperties}></div>
                      <div className="kpi__target-line" data-goal={goalValue.toLocaleString('de-DE') + '€'}></div>
                    </div>
                  </div>
                  <div className="kpi__values">
                    <span className="kpi__start">0€</span>
                    <span className="kpi__end"></span>
                  </div>
                </div>
              </div>
              <div className="chart-area">
                <div className="pie-chart-container">
                  <div 
                    className="pie-chart" 
                    style={{
                      background: `conic-gradient(#10b981 0% ${visitData.successPercentage}%, #d1d5db ${visitData.successPercentage}% 100%)`
                    } as React.CSSProperties}
                  >
                    <div className="pie-center">
                      <div className="pie-percentage">{visitData.successPercentage}%</div>
                      <div className="pie-subtitle">in {visitData.totalVisits} Besuchen</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
                  <Carousel regions={regions.slice(1)} allMarketsData={allMarketsData} />

        <div className="cards-grid">
          {regions.slice(1).map((regionName, regionIndex) => {
            const currentFilter = gridFilters[regionName] || 'All'
            const rawRegionData = allMarketsData[regionName as keyof typeof allMarketsData] || []
            const regionData = getFilteredMarketData(rawRegionData, currentFilter)
            const totalSellIn = regionData.reduce((sum: number, market: MarketData) => sum + market.sellInValue, 0)
            const regionGoal = regionData.length * 20000
            const progress = regionGoal > 0 ? (totalSellIn / regionGoal) * 100 : 0
            
            // Calculate time progress
            const startDate = new Date(2025, 7, 31)
            const endDate = new Date(2026, 7, 31)
            const now = new Date(2026, 2, 15)
            const totalTime = endDate.getTime() - startDate.getTime()
            const elapsedTime = now.getTime() - startDate.getTime()
            const timeProgress = Math.max(0, Math.min((elapsedTime / totalTime) * 100, 100))
            
            // Determine progress status and gradient
            const difference = progress - timeProgress
            let progressGradient = ''
            
            if (difference >= 1) {
              progressGradient = 'linear-gradient(90deg, rgba(240, 253, 244, 0.8) 0%, #10b981 100%)'
            } else if (difference >= -10) {
              progressGradient = 'linear-gradient(90deg, rgba(255, 251, 235, 0.8) 0%, #f59e0b 100%)'
            } else {
              progressGradient = 'linear-gradient(90deg, rgba(254, 16, 25, 0.4) 0%, #fe1019 100%)'
            }
            
            return (
              <section key={regionIndex} className="card card--grid">
                <div className="grid-card-content">
                  <div className="grid-card-header">
                    <div className="grid-header-top">
                      <div className="grid-profile-icon">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <circle cx="12" cy="8" r="4" />
                          <path d="M6 21v-2a6 6 0 0112 0v2" />
                        </svg>
                      </div>
                      <div className="grid-region-info">
                        <h4 className="grid-region-name">{regionName}</h4>
                        <span className="grid-region-role">Mars Fieldforce</span>
                      </div>
                      <div className="grid-total-indicator">
                        {totalSellIn.toLocaleString('de-DE')}€
                      </div>
                    </div>
                    <div className="grid-filters">
                      {(['All', 'MTD', 'Q1', 'Q2', 'Q3', 'Q4'] as const).map((filter) => (
                        <button
                          key={filter}
                          className={`grid-filter-btn ${currentFilter === filter ? 'active' : ''}`}
                          onClick={() => handleGridFilterChange(regionName, filter)}
                        >
                          {filter}
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  <div className="grid-progress">
                    <div className="grid-progress-header">
                      <span className="grid-progress-label">Sell in Wert</span>
                    </div>
                    <div className="grid-progress-bar-container">
                      <div className="grid-progress-bar">
                        <div className="grid-progress-fill" style={{ 
                          width: `${Math.min(progress, 100)}%`,
                          background: progressGradient
                        }}></div>
                        <div className="grid-time-indicator" style={{ left: `${timeProgress}%` }}>
                          <span className="grid-time-label">Zeit</span>
                        </div>
                      </div>
                    </div>
                    <div className="grid-progress-values">
                      <span className="grid-progress-start">0€</span>
                      <span className="grid-progress-end">{regionGoal.toLocaleString('de-DE')}€</span>
                    </div>
                  </div>
                  
                  <div className="markets-grid">
                    {regionData.map((market: MarketData, marketIndex: number) => {
                      const marketProgress = (market.sellInValue / 20000) * 100 // Each market goal is 20k
                      const marketDifference = marketProgress - timeProgress
                      
                      let marketGradient = ''
                      if (marketDifference >= 1) {
                        marketGradient = 'linear-gradient(90deg, rgba(240, 253, 244, 0.8) 0%, #10b981 100%)'
                      } else if (marketDifference >= -10) {
                        marketGradient = 'linear-gradient(90deg, rgba(255, 251, 235, 0.8) 0%, #f59e0b 100%)'
                      } else {
                        marketGradient = 'linear-gradient(90deg, rgba(254, 16, 25, 0.4) 0%, #fe1019 100%)'
                      }
                      
                      return (
                        <div key={marketIndex} className="market-card">
                          <div className="market-header">
                            <span className="market-name">{market.name}</span>
                            <span className="market-value">{market.sellInValue.toLocaleString('de-DE')}€</span>
                          </div>
                          <div className="market-progress-container">
                            <div className="market-progress-bar">
                              <div className="market-progress-fill" style={{ 
                                width: `${Math.min(marketProgress, 100)}%`,
                                background: marketGradient
                              }}></div>
                              <div className="market-time-indicator" style={{ left: `${timeProgress}%` }}></div>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </section>
            )
          })}
        </div>
      </main>
      {showCalendar && <Calendar onClose={() => setShowCalendar(false)} onSelect={handleDateRangeSelect} />}

      {showSellInModal && (
        <div className="modal-overlay" onClick={() => setShowSellInModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Sell in Wert · Verlauf nach KW</h3>
              <button className="modal-close" onClick={() => setShowSellInModal(false)} aria-label="Close">×</button>
            </div>
            <div className="modal-body">
              <div className="chart-container">
                <svg 
                  className="chart-svg" 
                  viewBox="0 0 800 400" 
                  preserveAspectRatio="xMidYMid meet"
                  onMouseMove={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect()
                    const x = ((e.clientX - rect.left) / rect.width) * 800
                    const y = ((e.clientY - rect.top) / rect.height) * 400
                    
                    const padding = { left: 75, right: 40, top: 20, bottom: 60 }
                    const chartWidth = 800 - padding.left - padding.right
                    const chartHeight = 400 - padding.top - padding.bottom
                    
                    if (x >= padding.left && x <= padding.left + chartWidth && y >= padding.top && y <= padding.top + chartHeight) {
                      const relativeX = x - padding.left
                      const weekIndex = Math.round((relativeX / chartWidth) * (weeklyCumulativeData.elapsedWeeks - 1))
                      
                      if (weekIndex >= 0 && weekIndex < weeklyCumulativeData.elapsedWeeks) {
                        const cumulativeValue = weeklyCumulativeData.points[weekIndex]
                        const previousValue = weekIndex > 0 ? weeklyCumulativeData.points[weekIndex - 1] : 0
                        const weeklyDifference = cumulativeValue - previousValue
                        const volumeCount = weeklyCumulativeData.volumeData[weekIndex]
                        setChartHover({ x, weekIndex, weeklyValue: weeklyDifference, cumulativeValue, volumeCount })
                      }
                    }
                  }}
                  onMouseLeave={() => setChartHover(null)}
                >
                  {(() => {
                    const padding = { left: 75, right: 40, top: 20, bottom: 60 }
                    const width = 800 - padding.left - padding.right
                    const height = 400 - padding.top - padding.bottom
                    const volumeHeight = 60 // Volume bars take bottom 60px of chart
                    const lineChartHeight = height - volumeHeight

                    const actual = weeklyCumulativeData.points
                    const totalWeeks = plannedLineData.totalWeeks
                    const plan = plannedLineData.values
                    const maxY = Math.max(goalValue, actual[actual.length - 1] || 0) * 1.05

                    const xForWeek = (w: number) => padding.left + ((w - 1) / (totalWeeks - 1)) * width
                    const yForValue = (v: number) => padding.top + lineChartHeight - (v / maxY) * lineChartHeight
                    
                    // Volume chart calculations
                    const volumeData = weeklyCumulativeData.volumeData
                    const maxVolume = Math.max(...volumeData, 1)
                    const volumeBarWidth = width / weeklyCumulativeData.elapsedWeeks * 0.4 // Thinner bars with gaps

                    const planPath = plan
                      .map((v, i) => `${i === 0 ? 'M' : 'L'} ${xForWeek(i + 1)} ${yForValue(v)}`)
                      .join(' ')

                    // Y-axis values
                    const yTicks = [0, maxY * 0.25, maxY * 0.5, maxY * 0.75, maxY]
                    // X-axis ticks every 8 weeks
                    const xTicks = Array.from({ length: Math.ceil(totalWeeks / 8) }, (_, i) => (i + 1) * 8).filter(w => w <= totalWeeks)

                    return (
                      <g>
                        {/* Chart background */}
                        <rect x={padding.left} y={padding.top} width={width} height={height} fill="#fafbfc" stroke="#f1f5f9" strokeWidth="1" rx="6"/>
                        
                        {/* Horizontal grid lines */}
                        {yTicks.slice(1, -1).map((tick, i) => (
                          <line key={`hy-${i}`} x1={padding.left} y1={yForValue(tick)} x2={padding.left + width} y2={yForValue(tick)} stroke="#f8fafc" strokeWidth="1" />
                        ))}
                        
                        {/* Vertical grid lines */}
                        {xTicks.map((week) => (
                          <line key={`vx-${week}`} x1={xForWeek(week)} y1={padding.top} x2={xForWeek(week)} y2={padding.top + height} stroke="#f8fafc" strokeWidth="1" />
                        ))}

                        {/* Chart axes */}
                        <line x1={padding.left} y1={padding.top} x2={padding.left} y2={padding.top + height} stroke="#e2e8f0" strokeWidth="2" />
                        <line x1={padding.left} y1={padding.top + height} x2={padding.left + width} y2={padding.top + height} stroke="#e2e8f0" strokeWidth="2" />

                        {/* Y-axis labels */}
                        {yTicks.map((tick, i) => (
                          <text key={`yl-${i}`} x={padding.left - 12} y={yForValue(tick) + 4} fill="#64748b" fontSize="11" textAnchor="end" fontWeight="500">
                            {tick === 0 ? '0€' : `${Math.round(tick / 1000)}k€`}
                          </text>
                        ))}

                        {/* X-axis labels */}
                        {xTicks.map((week) => (
                          <text key={`xl-${week}`} x={xForWeek(week)} y={padding.top + height + 20} fill="#64748b" fontSize="11" textAnchor="middle" fontWeight="500">
                            KW{week}
                          </text>
                        ))}

                        {/* Volume bars */}
                        {volumeData.map((volume, i) => {
                          const barHeight = volume > 0 ? (volume / maxVolume) * volumeHeight * 0.7 : 0
                          const barX = xForWeek(i + 1) - volumeBarWidth / 2 // Center bar exactly below data point
                          const barY = padding.top + height - barHeight
                          
                          return (
                            <rect 
                              key={`vol-${i}`}
                              x={barX}
                              y={barY}
                              width={volumeBarWidth}
                              height={barHeight}
                              fill="#9ca3af"
                              opacity="0.6"
                              rx="1"
                            />
                          )
                        })}

                        {/* Plan line (diagonal target) */}
                        <path d={planPath} fill="none" stroke="#94a3b8" strokeWidth="1.5" strokeDasharray="6 4" opacity="0.7" />
                        
                        <defs>
                          <linearGradient id="greenGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#059669" />
                            <stop offset="100%" stopColor="#10b981" />
                          </linearGradient>
                          <linearGradient id="redGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#dc2626" />
                            <stop offset="100%" stopColor="#ef4444" />
                          </linearGradient>
                        </defs>

                        {/* Fill areas between actual and plan lines */}
                        {actual.map((v, i) => {
                          if (i === 0) return null
                          const prevActual = actual[i - 1]
                          const prevPlan = plan[i - 1]
                          const currentPlan = plan[i]
                          
                          const isAbove = v > currentPlan
                          const wasPrevAbove = prevActual > prevPlan
                          
                          if (isAbove === wasPrevAbove) {
                            // Same side, create fill area
                            const fillPath = [
                              `M ${xForWeek(i)} ${yForValue(prevActual)}`,
                              `L ${xForWeek(i + 1)} ${yForValue(v)}`,
                              `L ${xForWeek(i + 1)} ${yForValue(currentPlan)}`,
                              `L ${xForWeek(i)} ${yForValue(prevPlan)}`,
                              'Z'
                            ].join(' ')
                            
                            return (
                              <path 
                                key={`fill-${i}`} 
                                d={fillPath} 
                                fill={isAbove ? '#10b981' : '#ef4444'} 
                                opacity="0.1"
                              />
                            )
                          }
                          return null
                        })}

                        {/* Actual line segments with dynamic colors */}
                        {actual.map((v, i) => {
                          if (i === 0) return null
                          const prevV = actual[i - 1]
                          const currentPlan = plan[i]
                          const isAbove = v > currentPlan
                          
                          return (
                            <path 
                              key={`line-${i}`}
                              d={`M ${xForWeek(i)} ${yForValue(prevV)} L ${xForWeek(i + 1)} ${yForValue(v)}`}
                              fill="none" 
                              stroke={isAbove ? '#10b981' : '#ef4444'} 
                              strokeWidth="2.5" 
                            />
                          )
                        })}

                        {/* Data points with dynamic colors */}
                        {actual.map((v, i) => {
                          const currentPlan = plan[i]
                          const isAbove = v > currentPlan
                          
                          return (
                            <circle 
                              key={`p-${i}`} 
                              cx={xForWeek(i + 1)} 
                              cy={yForValue(v)} 
                              r="2.5" 
                              fill="#ffffff" 
                              stroke={isAbove ? '#10b981' : '#ef4444'} 
                              strokeWidth="1.5" 
                            />
                          )
                        })}

                        {/* Hover line and tooltip */}
                        {chartHover && (
                          <>
                            {/* Vertical hover line */}
                            <line 
                              x1={chartHover.x} 
                              y1={padding.top} 
                              x2={chartHover.x} 
                              y2={padding.top + height} 
                              stroke="#64748b" 
                              strokeWidth="1" 
                              strokeDasharray="3 3"
                              opacity="0.7"
                            />
                            
                            {/* Tooltip */}
                            <g>
                              <rect 
                                x={chartHover.x + 10} 
                                y={padding.top + 10} 
                                width="140" 
                                height="80" 
                                fill="#ffffff" 
                                stroke="#e2e8f0" 
                                strokeWidth="1" 
                                rx="6"
                                filter="url(#tooltipShadow)"
                              />
                              
                              <defs>
                                <filter id="tooltipShadow">
                                  <feDropShadow dx="0" dy="2" stdDeviation="4" floodColor="#000000" floodOpacity="0.1"/>
                                </filter>
                              </defs>
                              
                              <text x={chartHover.x + 18} y={padding.top + 28} fill="#374151" fontSize="11" fontWeight="600">
                                KW {chartHover.weekIndex + 1}
                              </text>
                              
                              <text x={chartHover.x + 18} y={padding.top + 44} fill="#64748b" fontSize="10">
                                Gesamt: {chartHover.cumulativeValue.toLocaleString('de-DE')}€
                              </text>
                              
                              <text x={chartHover.x + 18} y={padding.top + 58} fill={chartHover.weeklyValue === 0 ? '#64748b' : chartHover.weeklyValue > 0 ? '#10b981' : '#ef4444'} fontSize="10" fontWeight="500">
                                {chartHover.weeklyValue === 0 ? '±0€ zur Vorwoche' : (chartHover.weeklyValue > 0 ? '+' : '') + chartHover.weeklyValue.toLocaleString('de-DE') + '€ zur Vorwoche'}
                              </text>
                              
                              <text x={chartHover.x + 18} y={padding.top + 72} fill="#64748b" fontSize="10">
                                Volumen: {chartHover.volumeCount} Sell-ins
                              </text>
                            </g>
                          </>
                        )}

                        {/* Axis titles */}
                        <text x={padding.left + width / 2} y={padding.top + height + 45} fill="#475569" fontSize="12" textAnchor="middle" fontWeight="600">
                          Kalenderwochen (KW)
                        </text>
                        <text x={padding.left - 50} y={padding.top + height / 2} fill="#475569" fontSize="12" textAnchor="middle" fontWeight="600" transform={`rotate(-90 ${padding.left - 50} ${padding.top + height / 2})`}>
                          Sell-in Wert
                        </text>
                      </g>
                    )
                  })()}
                </svg>
              </div>
            </div>
          </div>
        </div>
      )}
      </div>
  )
}

export default App



