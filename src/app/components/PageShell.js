import { stitchTheme } from '../styles/stitchTheme'
import { Header, BottomNav } from './Navigation'

export default function PageShell({ title, active, maxWidth = 1200, user, userRole, children }) {
  return (
    <div
      style={{
        minHeight: '100vh',
        background: stitchTheme.colors.background,
        animation: 'fadeIn 0.3s ease-out',
      }}
    >
      <Header title={title} user={user} userRole={userRole} />

      <main
        style={{
          maxWidth,
          margin: '0 auto',
          padding: '32px 24px',
          paddingBottom: '96px', // space for the fixed bottom nav
          width: '100%',
        }}
      >
        {children}
      </main>

      <BottomNav active={active} />
    </div>
  )
}
