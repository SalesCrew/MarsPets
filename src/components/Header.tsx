import logoUrl from '../assets/MarsPets+Logo.png'

function Header() {
  return (
    <header style={{
      height: '64px',
      backgroundColor: '#ffffff',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'flex-start',
      padding: '0 16px',
      boxShadow: '0 4px 16px rgba(0,0,0,0.06), 0 2px 8px rgba(0,0,0,0.04)'
    }}>
      <img src={logoUrl} alt="MarsPets" style={{ height: '64px', objectFit: 'contain' }} />
    </header>
  )
}

export default Header


