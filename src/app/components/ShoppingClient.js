'use client'

import { useEffect, useState } from 'react'
import { createClient } from '../../lib/supabase/client'
import { stitchTheme } from '../styles/stitchTheme'
import { getWeekStart } from '../../lib/week'
import { useWindowWidth } from '../hooks/useWindowWidth'
import PageShell from './PageShell'
import Link from 'next/link'

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
const MEAL_TIMES = ['breakfast', 'lunch', 'dinner']

export default function ShoppingClient({ user, userRole, initialMeals, initialPlans }) {
  const supabase = createClient()
  const width = useWindowWidth()
  const isMobile = width < 768

  const [meals] = useState(initialMeals)
  const [currentWeek] = useState(() => getWeekStart())
  const [weeklyPlan, setWeeklyPlan] = useState(() =>
    initialPlans.find((p) => p.week_start === getWeekStart()) || null
  )
  const [shoppingItems, setShoppingItems] = useState([])
  const [checkedItems, setCheckedItems] = useState({})

  useEffect(() => {
    if (weeklyPlan && meals.length > 0) {
      generateShoppingList()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [weeklyPlan, meals])

  function generateShoppingList() {
    const allIngredients = []

    DAYS.forEach((day) => {
      MEAL_TIMES.forEach((time) => {
        const mealId = weeklyPlan[`${day}_${time}`]
        const meal = meals.find((m) => m.id === mealId)
        if (meal && meal.ingredients) {
          meal.ingredients.forEach((ing) => {
            allIngredients.push({
              ...ing,
              mealName: meal.name,
              day,
              time,
            })
          })
        }
      })
    })

    const consolidated = {}
    allIngredients.forEach((ing) => {
      const key = ing.name.toLowerCase().trim()
      if (!consolidated[key]) {
        consolidated[key] = {
          name: ing.name,
          quantities: [ing.quantity],
          occurrences: [ing],
        }
      } else {
        consolidated[key].quantities.push(ing.quantity)
        consolidated[key].occurrences.push(ing)
      }
    })

    const sortedItems = Object.values(consolidated).sort((a, b) =>
      a.name.localeCompare(b.name)
    )

    setShoppingItems(sortedItems)

    const initialChecked = {}
    sortedItems.forEach((_, index) => {
      initialChecked[index] = false
    })
    setCheckedItems(initialChecked)
  }

  const toggleItem = (index) => {
    setCheckedItems((prev) => ({
      ...prev,
      [index]: !prev[index],
    }))
  }

  const clearChecked = () => {
    const resetChecked = {}
    shoppingItems.forEach((_, index) => {
      resetChecked[index] = false
    })
    setCheckedItems(resetChecked)
  }

  const getCheckedCount = () =>
    Object.values(checkedItems).filter((v) => v === true).length

  return (
    <PageShell
      title="🛒 Shopping List"
      active="list"
      maxWidth={800}
      user={user}
      userRole={userRole}
    >
      {/* Week Header */}
      <div
        style={{
          background: stitchTheme.colors.surfaceContainerLow,
          borderRadius: '16px',
          padding: '24px',
          marginBottom: '32px',
          textAlign: 'center',
        }}
      >
        <div style={{ fontSize: '48px', marginBottom: '12px' }}>🛒</div>
        <h2
          style={{
            fontFamily: stitchTheme.typography.headline,
            fontSize: '20px',
            fontWeight: 600,
            color: stitchTheme.colors.onSurface,
            margin: 0,
          }}
        >
          Week of {new Date(currentWeek).toLocaleDateString('en-US', {
            month: 'long',
            day: 'numeric',
            year: 'numeric',
          })}
        </h2>
        <p
          style={{
            color: stitchTheme.colors.onSurfaceVariant,
            fontSize: '14px',
            marginTop: '8px',
          }}
        >
          {shoppingItems.length} items to buy
        </p>
      </div>

      {/* Progress Bar */}
      {shoppingItems.length > 0 && (
        <div style={{ marginBottom: '24px' }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginBottom: '8px',
              fontSize: '12px',
              color: stitchTheme.colors.onSurfaceVariant,
            }}
          >
            <span>Progress</span>
            <span>{getCheckedCount()} / {shoppingItems.length}</span>
          </div>
          <div
            style={{
              height: '8px',
              background: stitchTheme.colors.outlineVariant,
              borderRadius: '4px',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                width: `${(getCheckedCount() / shoppingItems.length) * 100}%`,
                height: '100%',
                background: `linear-gradient(90deg, ${stitchTheme.colors.secondary}, ${stitchTheme.colors.secondaryContainer})`,
                borderRadius: '4px',
                transition: 'width 0.3s ease',
              }}
            />
          </div>
        </div>
      )}

      {/* Shopping List Items */}
      {shoppingItems.length === 0 ? (
        <div
          style={{
            textAlign: 'center',
            padding: '48px',
            background: stitchTheme.colors.surfaceContainerLow,
            borderRadius: '24px',
            border: `2px dashed ${stitchTheme.colors.outlineVariant}`,
          }}
        >
          <div style={{ fontSize: '64px', marginBottom: '16px' }}>🛒</div>
          <h3
            style={{
              fontFamily: stitchTheme.typography.headline,
              fontSize: '18px',
              fontWeight: 600,
              color: stitchTheme.colors.onSurface,
              marginBottom: '8px',
            }}
          >
            No active shopping list
          </h3>
          <p style={{ color: stitchTheme.colors.onSurfaceVariant }}>
            Generate a weekly plan to see your shopping list
          </p>
          <Link
            href="/weekly"
            style={{
              display: 'inline-block',
              marginTop: '24px',
              background: `linear-gradient(135deg, ${stitchTheme.colors.primary}, ${stitchTheme.colors.primaryContainer})`,
              color: stitchTheme.colors.onPrimary,
              textDecoration: 'none',
              padding: '12px 24px',
              borderRadius: '9999px',
              fontWeight: 600,
            }}
          >
            Go to Weekly Planner
          </Link>
        </div>
      ) : (
        <>
          <div style={{ marginBottom: '32px' }}>
            <div style={{ marginBottom: '24px' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  marginBottom: '16px',
                }}
              >
                <div
                  style={{
                    height: '2px',
                    flex: 1,
                    background: stitchTheme.colors.outlineVariant,
                  }}
                />
                <span
                  style={{
                    fontSize: '12px',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: '1px',
                    color: stitchTheme.colors.onSurfaceVariant,
                  }}
                >
                  All Items
                </span>
                <div
                  style={{
                    height: '2px',
                    flex: 1,
                    background: stitchTheme.colors.outlineVariant,
                  }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {shoppingItems.map((item, index) => (
                <div
                  key={index}
                  onClick={() => toggleItem(index)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '16px',
                    padding: '16px',
                    background: checkedItems[index]
                      ? stitchTheme.colors.surfaceContainerLow
                      : stitchTheme.colors.surface,
                    borderRadius: '16px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    border: `1px solid ${stitchTheme.colors.outlineVariant}`,
                    opacity: checkedItems[index] ? 0.6 : 1,
                    textDecoration: checkedItems[index] ? 'line-through' : 'none',
                  }}
                  onMouseEnter={(e) => {
                    if (!checkedItems[index]) {
                      e.currentTarget.style.transform = 'translateX(4px)'
                      e.currentTarget.style.borderColor = stitchTheme.colors.primary
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateX(0)'
                    e.currentTarget.style.borderColor = stitchTheme.colors.outlineVariant
                  }}
                >
                  <div
                    style={{
                      width: '24px',
                      height: '24px',
                      borderRadius: '8px',
                      border: `2px solid ${checkedItems[index] ? stitchTheme.colors.secondary : stitchTheme.colors.primary}`,
                      background: checkedItems[index] ? stitchTheme.colors.secondary : 'transparent',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'all 0.2s',
                    }}
                  >
                    {checkedItems[index] && (
                      <span style={{ color: 'white', fontSize: '14px' }}>✓</span>
                    )}
                  </div>

                  <div style={{ flex: 1 }}>
                    <div
                      style={{
                        fontWeight: 600,
                        color: stitchTheme.colors.onSurface,
                        fontSize: isMobile ? '15px' : '16px',
                      }}
                    >
                      {item.name}
                    </div>
                    <div
                      style={{
                        fontSize: '12px',
                        color: stitchTheme.colors.onSurfaceVariant,
                        marginTop: '4px',
                      }}
                    >
                      {item.quantities.join(', ')}
                    </div>
                  </div>

                  <div
                    style={{
                      fontSize: '11px',
                      color: stitchTheme.colors.primary,
                      background: `${stitchTheme.colors.primary}10`,
                      padding: '4px 8px',
                      borderRadius: '9999px',
                    }}
                  >
                    {item.occurrences.length} meal{item.occurrences.length > 1 ? 's' : ''}
                  </div>
                </div>
              ))}
            </div>

            {getCheckedCount() > 0 && (
              <button
                onClick={clearChecked}
                style={{
                  marginTop: '24px',
                  width: '100%',
                  padding: '14px',
                  background: 'transparent',
                  border: `1px solid ${stitchTheme.colors.outlineVariant}`,
                  borderRadius: '9999px',
                  color: stitchTheme.colors.onSurfaceVariant,
                  fontSize: '14px',
                  fontWeight: 500,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = stitchTheme.colors.surfaceContainerLow
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent'
                }}
              >
                Clear Checked Items
              </button>
            )}
          </div>

          <div style={{ textAlign: 'center', marginTop: '24px' }}>
            <button
              onClick={() => window.print()}
              style={{
                background: stitchTheme.colors.surfaceContainer,
                border: 'none',
                padding: '12px 24px',
                borderRadius: '9999px',
                color: stitchTheme.colors.onSurface,
                fontSize: '14px',
                fontWeight: 500,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <span>🖨️</span> Print Shopping List
            </button>
          </div>
        </>
      )}
    </PageShell>
  )
}
