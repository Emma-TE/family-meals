'use client'

import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { stitchTheme } from '../styles/stitchTheme'

export default function UserMenu({ user, userRole }) {
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef(null)
  const router = useRouter()

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/auth/login')
  }

  return (
    <div style={{ position: 'relative' }} ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          background: stitchTheme.colors.surfaceContainer,
          padding: '6px 12px 6px 8px',
          borderRadius: '9999px',
          border: `1px solid ${stitchTheme.colors.outlineVariant}`,
          cursor: 'pointer',
          transition: 'all 0.2s'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = stitchTheme.colors.surfaceContainerHigh
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = stitchTheme.colors.surfaceContainer
        }}
      >
        <span style={{ fontSize: '18px' }}>👤</span>
        <span style={{
          fontSize: '13px',
          maxWidth: '120px',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          color: stitchTheme.colors.onSurface
        }}>
          {user?.email?.split('@')[0]}
        </span>
        <span style={{
          fontSize: '12px',
          color: stitchTheme.colors.onSurfaceVariant,
          transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
          transition: 'transform 0.2s'
        }}>
          ▼
        </span>
      </button>

      {isOpen && (
        <div style={{
          position: 'absolute',
          top: 'calc(100% + 8px)',
          right: 0,
          background: stitchTheme.colors.surface,
          borderRadius: '12px',
          boxShadow: stitchTheme.shadows.lg,
          border: `1px solid ${stitchTheme.colors.outlineVariant}`,
          minWidth: '200px',
          zIndex: 100,
          overflow: 'hidden'
        }}>
          <div style={{
            padding: '12px 16px',
            borderBottom: `1px solid ${stitchTheme.colors.outlineVariant}`,
            background: stitchTheme.colors.surfaceContainerLow
          }}>
            <div style={{
              fontSize: '12px',
              color: stitchTheme.colors.onSurfaceVariant,
              marginBottom: '4px'
            }}>
              Signed in as
            </div>
            <div style={{
              fontSize: '14px',
              fontWeight: 600,
              color: stitchTheme.colors.onSurface,
              wordBreak: 'break-all'
            }}>
              {user?.email}
            </div>
            {userRole === 'admin' && (
              <div style={{
                marginTop: '4px',
                fontSize: '10px',
                background: `linear-gradient(135deg, ${stitchTheme.colors.primary} 0%, ${stitchTheme.colors.primaryContainer} 100%)`,
                color: 'white',
                padding: '2px 8px',
                borderRadius: '9999px',
                display: 'inline-block'
              }}>
                Admin
              </div>
            )}
          </div>
          <button
            onClick={handleSignOut}
            style={{
              width: '100%',
              padding: '12px 16px',
              background: 'transparent',
              border: 'none',
              textAlign: 'left',
              cursor: 'pointer',
              fontSize: '14px',
              color: stitchTheme.colors.error,
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'background 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = stitchTheme.colors.errorContainer
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent'
            }}
          >
            <span>🚪</span> Sign Out
          </button>
        </div>
      )}
    </div>
  )
}