
import './App.css'
import Header from './components/Header'
import Carousel from './components/Carousel'
import Calendar from './components/Calendar'
import CustomDropdown from './components/CustomDropdown'
import { useState, useRef, useEffect } from 'react'

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



  const generateMarketData = (startPlz: number): MarketData[] => {
    const marketTypes = ['Billa', 'Billa+', 'Fressnapf', 'Spar', 'Interspar', 'Merkur', 'Hofer', 'Penny', 'Lidl']
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

  const allMarketsData = {
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

  const getFilteredMarketsData = (): MarketData[] => {
    if (selectedRegion === 'Alle Regionen') {
      return Object.values(allMarketsData).flat()
    } else {
      return allMarketsData[selectedRegion as keyof typeof allMarketsData] || []
    }
  }

  const getMarketOptions = () => {
    const marketsData = getFilteredMarketsData()
    return ['Alle Märkte', ...marketsData.map(m => m.name)]
  }

  const calculateTotalSellIn = () => {
    const marketsData = getFilteredMarketsData()
    let filteredData = marketsData

    if (selectedMarket !== 'Alle Märkte') {
      filteredData = marketsData.filter(market => market.name === selectedMarket)
    }

    return filteredData.reduce((total, market) => total + market.sellInValue, 0)
  }

  const calculateGoalValue = () => {
    const marketsData = getFilteredMarketsData()
    let filteredData = marketsData

    if (selectedMarket !== 'Alle Märkte') {
      filteredData = marketsData.filter(market => market.name === selectedMarket)
    }

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

  const getVisitData = () => {
    // Simulate visit data - generate between 85-95% success rate
    const successRate = 85 + Math.random() * 10 // Random between 85-95%
    
    return {
      totalVisits: 100,
      visitsWithSales: Math.round(successRate),
      visitsWithoutSales: Math.round(100 - successRate),
      successPercentage: Math.round(successRate)
    }
  }



  const totalSellIn = calculateTotalSellIn()
  const goalValue = calculateGoalValue()
  const sellInProgress = goalValue > 0 ? (totalSellIn / goalValue) * 80 : 0 // 80% = 100% goal, allows over 100%
  const rawTimeProgress = calculateTimeProgress()
  const timeProgress = rawTimeProgress * 0.8 // Scale to 80% = 100% goal
  const timeDisplayDates = getTimeDisplayDates()
  const visitData = getVisitData()

  const getStatusColor = () => {
    const timePct = rawTimeProgress
    const sellPct = goalValue > 0 ? (totalSellIn / goalValue) * 100 : 0
    const difference = timePct - sellPct

    if (difference <= 5) return { color: '#10b981', status: 'On Track' } // Green - on track
    if (difference <= 15) return { color: '#f59e0b', status: 'Im Zeitplan' } // Orange - behind schedule
    return { color: '#ef4444', status: 'Hinten nach' } // Red - significantly behind
  }

  const statusInfo = getStatusColor()

  const filteredMarkets = getMarketOptions()

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
                    <div className="mtd-value">36.000€</div>
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
                <div className="kpi">
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
                      <div className="pie-subtitle">in 870 Besuchen</div>
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
      </div>
  )
}

export default App



