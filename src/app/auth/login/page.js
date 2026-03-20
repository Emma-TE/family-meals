'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Auth } from '@supabase/auth-ui-react'
import { ThemeSupa } from '@supabase/auth-ui-shared'
import { useRouter } from 'next/navigation'
import { stitchTheme, globalStyles } from '../../styles/stitchTheme'

export default function LoginPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        router.push('/')
      }
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        router.push('/')
      }
    })

    return () => subscription.unsubscribe()
  }, [router])

  if (loading) {
    return (
      <div style={{ 
        minHeight: '100vh',
        background: `linear-gradient(135deg, ${stitchTheme.colors.primary} 0%, ${stitchTheme.colors.primaryContainer} 100%)`,
        display: 'flex',
        justifyContent: 'center', 
        alignItems: 'center',
        flexDirection: 'column',
        gap: '24px'
      }}>
        <div style={{ 
          fontSize: '64px',
          animation: 'bounce 2s infinite'
        }}>🍽️</div>
        <div style={{ 
          fontSize: '18px',
          color: 'white',
          fontWeight: 500
        }}>Loading...</div>
        <style>{`
          @keyframes bounce {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-10px); }
          }
          ${globalStyles}
        `}</style>
      </div>
    )
  }

  return (
    <>
      <style>{globalStyles}</style>
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: `linear-gradient(135deg, ${stitchTheme.colors.primary} 0%, ${stitchTheme.colors.primaryContainer} 100%)`,
        padding: '20px'
      }}>
        {/* Decorative background elements */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          overflow: 'hidden',
          zIndex: 0
        }}>
          <div style={{
            position: 'absolute',
            top: '-10%',
            right: '-10%',
            width: '500px',
            height: '500px',
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.1)',
            zIndex: 0
          }} />
          <div style={{
            position: 'absolute',
            bottom: '-10%',
            left: '-10%',
            width: '400px',
            height: '400px',
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.1)',
            zIndex: 0
          }} />
        </div>

        {/* Main login card */}
        <div style={{
          position: 'relative',
          zIndex: 1,
          width: '100%',
          maxWidth: '450px',
          background: stitchTheme.colors.surface,
          backdropFilter: 'blur(10px)',
          borderRadius: stitchTheme.borderRadius.xl,
          padding: '40px',
          boxShadow: stitchTheme.shadows.xl,
          animation: 'fadeIn 0.5s ease-out'
        }}>
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: '30px' }}>
            <div style={{
              fontSize: '64px',
              marginBottom: '10px',
              animation: 'bounce 2s infinite'
            }}>
              🍽️
            </div>
            <h1 style={{
              margin: 0,
              fontSize: '28px',
              fontWeight: 700,
              background: `linear-gradient(135deg, ${stitchTheme.colors.primary} 0%, ${stitchTheme.colors.primaryContainer} 100%)`,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              marginBottom: '8px'
            }}>
              Family Meal Planner
            </h1>
            <p style={{
              color: stitchTheme.colors.onSurfaceVariant,
              fontSize: '14px',
              margin: 0
            }}>
              Plan your weekly meals together
            </p>
          </div>

          {/* Welcome message */}
          <div style={{
            background: `${stitchTheme.colors.secondary}10`,
            border: `1px solid ${stitchTheme.colors.secondary}30`,
            borderRadius: '12px',
            padding: '12px 16px',
            marginBottom: '25px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            <span style={{ fontSize: '24px' }}>👋</span>
            <div>
              <div style={{ fontWeight: 600, color: stitchTheme.colors.secondary, marginBottom: '4px' }}>
                Welcome back!
              </div>
              <div style={{ fontSize: '13px', color: stitchTheme.colors.onSurfaceVariant }}>
                Sign in to access your meal plans
              </div>
            </div>
          </div>

          {/* Auth Component */}
          <div>
            <Auth
              supabaseClient={supabase}
              appearance={{
                theme: ThemeSupa,
                variables: {
                  default: {
                    colors: {
                      brand: stitchTheme.colors.primary,
                      brandAccent: stitchTheme.colors.primaryDim,
                      brandButtonText: 'white',
                      defaultButtonBackground: 'white',
                      defaultButtonBackgroundHover: stitchTheme.colors.surfaceContainer,
                      defaultButtonBorder: stitchTheme.colors.outlineVariant,
                      defaultButtonText: stitchTheme.colors.onSurface,
                      dividerBackground: stitchTheme.colors.outlineVariant,
                      inputBackground: stitchTheme.colors.surfaceContainerLowest,
                      inputBorder: stitchTheme.colors.outlineVariant,
                      inputBorderHover: stitchTheme.colors.primary,
                      inputBorderFocus: stitchTheme.colors.primary,
                      inputText: stitchTheme.colors.onSurface,
                      inputLabelText: stitchTheme.colors.onSurfaceVariant,
                      inputPlaceholder: stitchTheme.colors.outline,
                    },
                    space: {
                      buttonPadding: '12px 16px',
                      inputPadding: '12px 16px',
                      labelBottomMargin: '8px',
                    },
                    borderWidths: {
                      buttonBorderWidth: '1px',
                      inputBorderWidth: '1px',
                    },
                    radii: {
                      borderRadiusButton: stitchTheme.borderRadius.full,
                      buttonBorderRadius: stitchTheme.borderRadius.full,
                      inputBorderRadius: stitchTheme.borderRadius.lg,
                    },
                  },
                },
                style: {
                  button: {
                    fontSize: '16px',
                    fontWeight: 600,
                    boxShadow: stitchTheme.shadows.sm,
                    transition: 'all 0.2s',
                  },
                  input: {
                    fontSize: '15px',
                    transition: 'all 0.2s',
                  },
                  label: {
                    fontSize: '14px',
                    fontWeight: 500,
                    color: stitchTheme.colors.onSurface,
                  },
                  anchor: {
                    color: stitchTheme.colors.primary,
                    fontSize: '14px',
                    fontWeight: 500,
                  },
                  divider: {
                    margin: '20px 0',
                  },
                  message: {
                    fontSize: '14px',
                    padding: '12px',
                    borderRadius: '8px',
                    marginBottom: '16px',
                  },
                },
              }}
              theme="light"
              providers={[]}
              redirectTo={typeof window !== 'undefined' ? window.location.origin : ''}
              onlyThirdPartyProviders={false}
              magicLink={false}
              socialLayout="horizontal"
            />
          </div>

          {/* Footer */}
          <div style={{
            marginTop: '30px',
            textAlign: 'center',
            borderTop: `1px solid ${stitchTheme.colors.outlineVariant}`,
            paddingTop: '20px'
          }}>
            <p style={{
              color: stitchTheme.colors.onSurfaceVariant,
              fontSize: '13px',
              margin: '0 0 8px 0'
            }}>
              👨‍👩‍👧‍👦 Private access for your family
            </p>
            <p style={{
              color: stitchTheme.colors.outline,
              fontSize: '12px',
              margin: 0
            }}>
              Only approved users can sign up
            </p>
          </div>

          {/* Decorative food icons */}
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '15px',
            marginTop: '20px',
            fontSize: '20px',
            opacity: 0.6
          }}>
            <span>🍳</span>
            <span>🥘</span>
            <span>🍲</span>
            <span>🍛</span>
            <span>🥗</span>
          </div>
        </div>

        <style>{`
          @keyframes fadeIn {
            from {
              opacity: 0;
              transform: translateY(20px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
          
          @keyframes bounce {
            0%, 100% {
              transform: translateY(0);
            }
            50% {
              transform: translateY(-10px);
            }
          }
        `}</style>
      </div>
    </>
  )
}