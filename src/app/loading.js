import { stitchTheme } from './styles/stitchTheme'

export default function Loading() {
  return (
    <div style={{
      minHeight: '100vh',
      background: stitchTheme.colors.background,
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Header skeleton */}
      <div style={{
        height: '72px',
        background: stitchTheme.colors.surface,
        borderBottom: `1px solid ${stitchTheme.colors.outlineVariant}`,
        padding: '16px 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div style={{
          width: '180px',
          height: '32px',
          background: stitchTheme.colors.surfaceContainerHigh,
          borderRadius: '8px',
          animation: 'pulse 1.5s ease-in-out infinite'
        }} />
        <div style={{
          width: '40px',
          height: '40px',
          borderRadius: '50%',
          background: stitchTheme.colors.surfaceContainerHigh,
          animation: 'pulse 1.5s ease-in-out infinite'
        }} />
      </div>

      {/* Content skeleton */}
      <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '32px 24px', width: '100%' }}>
        {/* Search bar skeleton */}
        <div style={{
          height: '52px',
          background: stitchTheme.colors.surfaceContainerHigh,
          borderRadius: '9999px',
          marginBottom: '32px',
          animation: 'pulse 1.5s ease-in-out infinite'
        }} />

        {/* Meal cards grid skeleton */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: '20px'
        }}>
          {[...Array(6)].map((_, i) => (
            <div key={i} style={{
              background: stitchTheme.colors.surface,
              borderRadius: '16px',
              overflow: 'hidden',
              border: `1px solid ${stitchTheme.colors.outlineVariant}`,
              animation: `pulse 1.5s ease-in-out ${i * 0.1}s infinite`
            }}>
              {/* Image skeleton */}
              <div style={{
                height: '180px',
                background: stitchTheme.colors.surfaceContainerHigh,
              }} />
              {/* Text skeletons */}
              <div style={{ padding: '16px' }}>
                <div style={{
                  height: '20px',
                  background: stitchTheme.colors.surfaceContainerHigh,
                  borderRadius: '6px',
                  marginBottom: '12px',
                  width: '75%'
                }} />
                <div style={{
                  height: '14px',
                  background: stitchTheme.colors.surfaceContainerHigh,
                  borderRadius: '6px',
                  width: '50%'
                }} />
              </div>
            </div>
          ))}
        </div>
      </main>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </div>
  )
}
