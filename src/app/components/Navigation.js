import React from 'react';
import Link from 'next/link';
import UserMenu from './UserMenu';
import styles from './Navigation.module.css';
import { stitchTheme } from '../styles/stitchTheme';

export function Header({ user, userRole }) {
  return (
    <header 
      className={styles.header}
      style={{
        background: `${stitchTheme.colors.surface}cc`, // 0.8 opacity roughly
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
          🍽️ Meal Library
        </h1>
        
        <UserMenu user={user} userRole={userRole} />
      </div>
    </header>
  );
}

export function BottomNav() {
  return (
    <nav 
      className={styles.bottomNav}
      style={{
        background: `${stitchTheme.colors.surface}cc`,
        borderTop: `1px solid ${stitchTheme.colors.outlineVariant}`,
      }}
    >
      <div className={styles.navInner}>
        <div 
          className={styles.navItemActive}
          style={{
            background: `${stitchTheme.colors.primary}10`,
            color: stitchTheme.colors.primary,
          }}
        >
          <span>🍽️</span>
          <span>Library</span>
        </div>
        <Link href="/weekly" className={styles.navItem} style={{ color: stitchTheme.colors.onSurfaceVariant }}>
          <span>📅</span>
          <span>Planner</span>
        </Link>
        <Link href="/shopping" className={styles.navItem} style={{ color: stitchTheme.colors.onSurfaceVariant }}>
          <span>🛒</span>
          <span>List</span>
        </Link>
      </div>
    </nav>
  );
}
