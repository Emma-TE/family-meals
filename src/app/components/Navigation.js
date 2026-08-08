import React from 'react';
import Link from 'next/link';
import UserMenu from './UserMenu';
import styles from './Navigation.module.css';
import { stitchTheme } from '../styles/stitchTheme';

const NAV_ITEMS = [
  { id: 'library', href: '/', icon: '🍽️', label: 'Library' },
  { id: 'planner', href: '/weekly', icon: '📅', label: 'Planner' },
  { id: 'list', href: '/shopping', icon: '🛒', label: 'List' },
];

export function Header({ user, userRole, title = '🍽️ Meal Library' }) {
  return (
    <header
      className={styles.header}
      style={{
        background: `${stitchTheme.colors.surface}cc`,
        borderBottom: `1px solid ${stitchTheme.colors.outlineVariant}`,
      }}
    >
      <div className={styles.headerInner}>
        <h1
          className={styles.logo}
          style={{
            background: `linear-gradient(135deg, ${stitchTheme.colors.primary} 0%, ${stitchTheme.colors.primaryContainer} 100%)`,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          {title}
        </h1>

        <UserMenu user={user} userRole={userRole} />
      </div>
    </header>
  );
}

export function BottomNav({ active = 'library' }) {
  return (
    <nav
      className={styles.bottomNav}
      style={{
        background: `${stitchTheme.colors.surface}cc`,
        borderTop: `1px solid ${stitchTheme.colors.outlineVariant}`,
      }}
    >
      <div className={styles.navInner}>
        {NAV_ITEMS.map((item) => {
          const isActive = active === item.id;
          return isActive ? (
            <div
              key={item.id}
              className={styles.navItemActive}
              style={{
                background: `${stitchTheme.colors.primary}10`,
                color: stitchTheme.colors.primary,
              }}
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </div>
          ) : (
            <Link
              key={item.id}
              href={item.href}
              className={styles.navItem}
              style={{ color: stitchTheme.colors.onSurfaceVariant }}
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
