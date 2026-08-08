'use client'

import { stitchTheme } from '../styles/stitchTheme'
import { useWindowWidth } from '../hooks/useWindowWidth'

const DEFAULT_IMAGE = 'https://images.unsplash.com/photo-1604329760661-e71dc83f8f26?w=400'

export default function MealDetailModal({ meal, isOpen, onClose }) {
  const width = useWindowWidth()
  const isMobile = width < 768

  if (!isOpen || !meal) return null

  const categoryIcon = meal.category === 'breakfast'
    ? '🍳'
    : meal.category === 'lunch'
      ? '🥘'
      : '🍲'

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.7)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 2000,
        padding: '20px',
        animation: 'fadeIn 0.2s ease-out',
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: 'white',
          borderRadius: '24px',
          maxWidth: '500px',
          width: '100%',
          maxHeight: '90vh',
          overflowY: 'auto',
          position: 'relative',
          boxShadow: stitchTheme.shadows.xl,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '12px',
            right: '12px',
            background: 'white',
            border: 'none',
            fontSize: '20px',
            cursor: 'pointer',
            width: '36px',
            height: '36px',
            borderRadius: '9999px',
            boxShadow: stitchTheme.shadows.md,
            zIndex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = stitchTheme.colors.error
            e.currentTarget.style.color = 'white'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'white'
            e.currentTarget.style.color = stitchTheme.colors.onSurface
          }}
        >
          ✕
        </button>

        <img
          src={meal.image_url || DEFAULT_IMAGE}
          alt={meal.name}
          style={{
            width: '100%',
            height: isMobile ? '200px' : '250px',
            objectFit: 'cover',
            borderTopLeftRadius: '24px',
            borderTopRightRadius: '24px',
          }}
        />

        <div style={{ padding: '24px' }}>
          <h2
            style={{
              margin: '0 0 8px 0',
              fontSize: isMobile ? '22px' : '28px',
              color: stitchTheme.colors.onSurface,
              fontWeight: 700,
            }}
          >
            {meal.name}
          </h2>

          <div
            style={{
              display: 'flex',
              gap: '8px',
              marginBottom: '24px',
              flexWrap: 'wrap',
            }}
          >
            <span
              style={{
                background: `linear-gradient(135deg, ${stitchTheme.colors.primary} 0%, ${stitchTheme.colors.primaryContainer} 100%)`,
                color: 'white',
                padding: '4px 12px',
                borderRadius: '9999px',
                fontSize: '12px',
                fontWeight: 500,
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              {categoryIcon} {meal.category}
            </span>
            <span
              style={{
                background: `${stitchTheme.colors.secondary}10`,
                color: stitchTheme.colors.secondary,
                padding: '4px 12px',
                borderRadius: '9999px',
                fontSize: '12px',
                fontWeight: 500,
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              🔥 {meal.calories} kcal
            </span>
            {meal.prep_time && (
              <span
                style={{
                  background: `${stitchTheme.colors.tertiary}10`,
                  color: stitchTheme.colors.tertiary,
                  padding: '4px 12px',
                  borderRadius: '9999px',
                  fontSize: '12px',
                  fontWeight: 500,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                ⏱️ {meal.prep_time}
              </span>
            )}
          </div>

          <div style={{ marginBottom: '24px' }}>
            <h3
              style={{
                fontSize: '16px',
                margin: '0 0 8px 0',
                color: stitchTheme.colors.onSurfaceVariant,
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <span style={{ fontSize: '20px' }}>🍽️</span> Portion Advice
            </h3>
            <p
              style={{
                margin: 0,
                fontSize: '14px',
                color: stitchTheme.colors.onSurface,
                lineHeight: 1.5,
                background: stitchTheme.colors.surfaceContainerLow,
                padding: '16px',
                borderRadius: '12px',
              }}
            >
              {meal.portion}
            </p>
          </div>

          <div>
            <h3
              style={{
                fontSize: '16px',
                margin: '0 0 8px 0',
                color: stitchTheme.colors.onSurfaceVariant,
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <span style={{ fontSize: '20px' }}>🧺</span> Ingredients
            </h3>
            <div
              style={{
                background: stitchTheme.colors.surfaceContainerLow,
                borderRadius: '12px',
                padding: '16px',
              }}
            >
              {meal.ingredients?.map((item, index) => (
                <div
                  key={index}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    padding: '8px',
                    borderBottom: index < meal.ingredients.length - 1
                      ? `1px solid ${stitchTheme.colors.outlineVariant}`
                      : 'none',
                  }}
                >
                  <span style={{ fontWeight: 500, color: stitchTheme.colors.onSurface }}>
                    {item.name}
                  </span>
                  <span
                    style={{
                      color: stitchTheme.colors.primary,
                      fontWeight: 600,
                      background: `${stitchTheme.colors.primary}10`,
                      padding: '2px 8px',
                      borderRadius: '9999px',
                    }}
                  >
                    {item.quantity}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              width: '100%',
              padding: '14px',
              marginTop: '24px',
              background: `linear-gradient(135deg, ${stitchTheme.colors.primary} 0%, ${stitchTheme.colors.primaryContainer} 100%)`,
              color: 'white',
              border: 'none',
              borderRadius: '9999px',
              fontSize: '14px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s',
              boxShadow: stitchTheme.shadows.md,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)'
              e.currentTarget.style.boxShadow = stitchTheme.shadows.glow
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.boxShadow = stitchTheme.shadows.md
            }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
