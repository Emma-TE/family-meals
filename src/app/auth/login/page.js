'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Auth } from '@supabase/auth-ui-react'
import { ThemeSupa } from '@supabase/auth-ui-shared'
import { useRouter } from 'next/navigation'

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
        height: '100vh', 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
      }}>
        <div style={{ 
          textAlign: 'center',
          color: 'white'
        }}>
          <div style={{ fontSize: '64px', marginBottom: '20px' }}>🍽️</div>
          <div style={{ fontSize: '20px' }}>Loading...</div>
        </div>
      </div>
    )
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
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
        background: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(10px)',
        borderRadius: '20px',
        padding: '40px',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
        animation: 'fadeIn 0.5s ease-out'
      }}>
        {/* Header with icon */}
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
            fontWeight: 'bold',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            marginBottom: '8px'
          }}>
            Family Meal Planner
          </h1>
          <p style={{
            color: '#666',
            fontSize: '14px',
            margin: 0
          }}>
            Plan your weekly meals together
          </p>
        </div>

        {/* Welcome message for returning users */}
        <div style={{
          background: '#f0f9ff',
          border: '1px solid #bae6fd',
          borderRadius: '12px',
          padding: '12px 16px',
          marginBottom: '25px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          <span style={{ fontSize: '24px' }}>👋</span>
          <div>
            <div style={{ fontWeight: 'bold', color: '#0369a1', marginBottom: '4px' }}>
              Welcome back!
            </div>
            <div style={{ fontSize: '13px', color: '#075985' }}>
              Sign in to access your meal plans
            </div>
          </div>
        </div>

        {/* Custom styled Auth component */}
        <div style={{
          '--tw-bg-opacity': 1,
          '--tw-text-opacity': 1
        }}>
          <Auth
            supabaseClient={supabase}
            appearance={{
              theme: ThemeSupa,
              variables: {
                default: {
                  colors: {
                    brand: '#667eea',
                    brandAccent: '#764ba2',
                    brandButtonText: 'white',
                    defaultButtonBackground: 'white',
                    defaultButtonBackgroundHover: '#f8f9fa',
                    defaultButtonBorder: '#e2e8f0',
                    defaultButtonText: '#1a202c',
                    dividerBackground: '#e2e8f0',
                    inputBackground: 'white',
                    inputBorder: '#e2e8f0',
                    inputBorderHover: '#667eea',
                    inputBorderFocus: '#667eea',
                    inputText: '#1a202c',
                    inputLabelText: '#4a5568',
                    inputPlaceholder: '#a0aec0',
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
                    borderRadiusButton: '10px',
                    buttonBorderRadius: '10px',
                    inputBorderRadius: '10px',
                  },
                },
              },
              style: {
                button: {
                  fontSize: '16px',
                  fontWeight: '600',
                  boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                  transition: 'all 0.2s',
                },
                input: {
                  fontSize: '15px',
                  transition: 'all 0.2s',
                },
                label: {
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#4a5568',
                },
                anchor: {
                  color: '#667eea',
                  fontSize: '14px',
                  fontWeight: '500',
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

        {/* Footer with family message */}
        <div style={{
          marginTop: '30px',
          textAlign: 'center',
          borderTop: '1px solid #e2e8f0',
          paddingTop: '20px'
        }}>
          <p style={{
            color: '#718096',
            fontSize: '13px',
            margin: '0 0 8px 0'
          }}>
            👨‍👩‍👧‍👦 Private access for my family
          </p>
          <p style={{
            color: '#a0aec0',
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

      {/* CSS animations */}
      <style jsx>{`
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
  )
}