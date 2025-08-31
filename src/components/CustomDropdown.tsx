import { useState } from 'react'

type DropdownProps = {
  label: string
  options: string[]
  value: string
  onChange: (value: string) => void
  searchable?: boolean
}

const CustomDropdown = ({ label, options, value, onChange, searchable = false }: DropdownProps) => {
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')

  const filteredOptions = searchable 
    ? options.filter(option => 
        option.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : options

  const handleSelect = (option: string) => {
    onChange(option)
    setIsOpen(false)
    setSearchTerm('')
  }

  return (
    <div className="dropdown-container">
      <div 
        className="dropdown-trigger" 
        onClick={() => setIsOpen(!isOpen)}
      >
        {value}
        <span className={`dropdown-arrow ${isOpen ? 'open' : ''}`}>▼</span>
      </div>
      
      {isOpen && (
        <div className="dropdown-menu">
          {searchable && (
            <div className="dropdown-search">
              <input
                type="text"
                placeholder="Suchen..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="dropdown-search-input"
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          )}
          {filteredOptions.map((option) => (
            <div
              key={option}
              className={`dropdown-option ${option === value ? 'selected' : ''}`}
              onClick={() => handleSelect(option)}
            >
              {option}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default CustomDropdown
