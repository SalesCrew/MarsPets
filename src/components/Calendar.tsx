import { useState } from 'react'

type CalendarProps = {
  onClose: () => void
  onSelect: (range: string, startDate?: Date, endDate?: Date) => void
}

type TabType = 'custom' | 'presets'

const Calendar = ({ onClose, onSelect }: CalendarProps) => {
  const [activeTab, setActiveTab] = useState<TabType>('custom')
  const [selectedRange, setSelectedRange] = useState<{ start: Date | null; end: Date | null }>({ start: null, end: null })
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [isSelectingEnd, setIsSelectingEnd] = useState(false)

  const today = new Date()
  const currentYear = today.getFullYear()

  // Generate calendar days
  const generateCalendarDays = () => {
    const year = currentMonth.getFullYear()
    const month = currentMonth.getMonth()
    const firstDay = new Date(year, month, 1)
    const startDate = new Date(firstDay)
    startDate.setDate(startDate.getDate() - firstDay.getDay())
    
    const days = []
    const endDate = new Date(startDate)
    endDate.setDate(endDate.getDate() + 41) // 6 weeks
    
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      days.push(new Date(d))
    }
    return days
  }

  const handleDateClick = (date: Date) => {
    if (!selectedRange.start || (selectedRange.start && selectedRange.end)) {
      setSelectedRange({ start: date, end: null })
      setIsSelectingEnd(true)
    } else if (isSelectingEnd) {
      if (date >= selectedRange.start) {
        setSelectedRange({ ...selectedRange, end: date })
      } else {
        setSelectedRange({ start: date, end: selectedRange.start })
      }
      setIsSelectingEnd(false)
    }
  }

  const isDateInRange = (date: Date) => {
    if (!selectedRange.start) return false
    if (!selectedRange.end) return date.getTime() === selectedRange.start.getTime()
    return date >= selectedRange.start && date <= selectedRange.end
  }

  const isDateRangeStart = (date: Date) => {
    return selectedRange.start && date.getTime() === selectedRange.start.getTime()
  }

  const isDateRangeEnd = (date: Date) => {
    return selectedRange.end && date.getTime() === selectedRange.end.getTime()
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })
  }

  const formatDateRange = (start: Date, end: Date | null) => {
    if (!end) return formatDate(start)
    
    const startStr = formatDate(start)
    const endStr = formatDate(end)
    
    // Check if it's the same date
    if (startStr === endStr) return startStr
    
    // Check if range is too long (more than ~20 characters)
    const fullRange = `${startStr} - ${endStr}`
    if (fullRange.length > 20) {
      // Check for common patterns
      const startMonth = start.getMonth()
      const endMonth = end.getMonth()
      const startYear = start.getFullYear()
      const endYear = end.getFullYear()
      
      // Same month and year
      if (startMonth === endMonth && startYear === endYear) {
        return `${start.getDate()}-${end.getDate()}.${String(startMonth + 1).padStart(2, '0')}.${startYear}`
      }
      
      // Same year
      if (startYear === endYear) {
        return `${String(startMonth + 1).padStart(2, '0')}-${String(endMonth + 1).padStart(2, '0')}.${startYear}`
      }
      
      // Different years - show compact format
      return `${String(startMonth + 1).padStart(2, '0')}.${String(startYear).slice(-2)} - ${String(endMonth + 1).padStart(2, '0')}.${String(endYear).slice(-2)}`
    }
    
    return fullRange
  }

  const handlePresetSelect = (preset: string) => {
    const now = new Date()
    let start: Date, end: Date

    switch (preset) {
      case 'MTD':
        start = new Date(now.getFullYear(), now.getMonth(), 1)
        end = now
        break
      case 'YTD':
        start = new Date(now.getFullYear(), 0, 1)
        end = now
        break
      case 'Q1':
        start = new Date(currentYear, 0, 1)
        end = new Date(currentYear, 2, 31)
        break
      case 'Q2':
        start = new Date(currentYear, 3, 1)
        end = new Date(currentYear, 5, 30)
        break
      case 'Q3':
        start = new Date(currentYear, 6, 1)
        end = new Date(currentYear, 8, 30)
        break
      case 'Q4':
        start = new Date(currentYear, 9, 1)
        end = new Date(currentYear, 11, 31)
        break
      default:
        return
    }
    setSelectedRange({ start, end })
  }

  const getDisplayText = () => {
    if (!selectedRange.start) return 'All Time'
    
    const now = new Date()
    const start = selectedRange.start
    const end = selectedRange.end || start
    
    // Check for preset patterns
    const startOfYear = new Date(now.getFullYear(), 0, 1)
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    
    // YTD
    if (start.getTime() === startOfYear.getTime() && 
        end.getDate() === now.getDate() && 
        end.getMonth() === now.getMonth() && 
        end.getFullYear() === now.getFullYear()) {
      return 'YTD'
    }
    
    // MTD
    if (start.getTime() === startOfMonth.getTime() && 
        end.getDate() === now.getDate() && 
        end.getMonth() === now.getMonth() && 
        end.getFullYear() === now.getFullYear()) {
      return 'MTD'
    }
    
    // Quarterly
    const year = start.getFullYear()
    if (year === currentYear) {
      if (start.getMonth() === 0 && start.getDate() === 1 && 
          end.getMonth() === 2 && end.getDate() === 31) return 'Q1'
      if (start.getMonth() === 3 && start.getDate() === 1 && 
          end.getMonth() === 5 && end.getDate() === 30) return 'Q2'
      if (start.getMonth() === 6 && start.getDate() === 1 && 
          end.getMonth() === 8 && end.getDate() === 30) return 'Q3'
      if (start.getMonth() === 9 && start.getDate() === 1 && 
          end.getMonth() === 11 && end.getDate() === 31) return 'Q4'
    }
    
    // Custom range
    return formatDateRange(start, end)
  }

  const monthNames = [
    'Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
    'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'
  ]

  const weekDays = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa']

  const handleSubmit = () => {
    const displayText = getDisplayText()
    onSelect(displayText, selectedRange.start || undefined, selectedRange.end || undefined)
  }

  return (
    <div className="calendar-overlay">
      <div className="calendar-modal">
        <div className="calendar-header">
          <div className="calendar-tabs">
            <button 
              className={`calendar-tab ${activeTab === 'custom' ? 'active' : ''}`}
              onClick={() => setActiveTab('custom')}
            >
              Benutzerdefiniert
            </button>
            <button 
              className={`calendar-tab ${activeTab === 'presets' ? 'active' : ''}`}
              onClick={() => setActiveTab('presets')}
            >
              Schnellauswahl
            </button>
          </div>
          <button className="calendar-close" onClick={onClose}>×</button>
        </div>

        <div className="calendar-content">
          {activeTab === 'custom' && (
            <div className="calendar-custom">
              <div className="calendar-nav">
                <button onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}>
                  ‹
                </button>
                <span className="calendar-month-year">
                  {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
                </span>
                <button onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}>
                  ›
                </button>
              </div>
              
              <div className="calendar-grid">
                <div className="calendar-weekdays">
                  {weekDays.map(day => (
                    <div key={day} className="calendar-weekday">{day}</div>
                  ))}
                </div>
                <div className="calendar-days">
                  {generateCalendarDays().map((date, index) => (
                    <button
                      key={index}
                      className={`calendar-day ${
                        date.getMonth() !== currentMonth.getMonth() ? 'other-month' : ''
                      } ${
                        isDateInRange(date) ? 'in-range' : ''
                      } ${
                        isDateRangeStart(date) ? 'range-start' : ''
                      } ${
                        isDateRangeEnd(date) ? 'range-end' : ''
                      }`}
                      onClick={() => handleDateClick(date)}
                    >
                      {date.getDate()}
                    </button>
                  ))}
                </div>
              </div>

              {selectedRange.start && (
                <div className="calendar-selection">
                  <span className="selection-text">
                    {selectedRange.end 
                      ? `${formatDate(selectedRange.start)} - ${formatDate(selectedRange.end)}`
                      : `Ab ${formatDate(selectedRange.start)}`
                    }
                  </span>
                </div>
              )}
            </div>
          )}

          {activeTab === 'presets' && (
            <div className="calendar-presets">
              <div className="preset-section">
                <h4>Zeiträume</h4>
                <div className="preset-buttons">
                  <button className="preset-btn" onClick={() => handlePresetSelect('MTD')}>
                    Month to Date
                  </button>
                  <button className="preset-btn" onClick={() => handlePresetSelect('YTD')}>
                    Year to Date
                  </button>
                </div>
              </div>
              
              <div className="preset-section">
                <h4>Quartale {currentYear}</h4>
                <div className="preset-buttons">
                  <button className="preset-btn" onClick={() => handlePresetSelect('Q1')}>
                    Q1 (Jan-Mar)
                  </button>
                  <button className="preset-btn" onClick={() => handlePresetSelect('Q2')}>
                    Q2 (Apr-Jun)
                  </button>
                  <button className="preset-btn" onClick={() => handlePresetSelect('Q3')}>
                    Q3 (Jul-Sep)
                  </button>
                  <button className="preset-btn" onClick={() => handlePresetSelect('Q4')}>
                    Q4 (Okt-Dez)
                  </button>
                </div>
              </div>

              {selectedRange.start && (
                <div className="calendar-selection">
                  <span className="selection-text">
                    {selectedRange.end 
                      ? `${formatDate(selectedRange.start)} - ${formatDate(selectedRange.end)}`
                      : `Ab ${formatDate(selectedRange.start)}`
                    }
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="calendar-footer">
          <button className="calendar-cancel" onClick={onClose}>
            Abbrechen
          </button>
          <button 
            className="calendar-submit" 
            onClick={handleSubmit}
            disabled={!selectedRange.start}
          >
            Anwenden
          </button>
        </div>
      </div>
    </div>
  )
}

export default Calendar
