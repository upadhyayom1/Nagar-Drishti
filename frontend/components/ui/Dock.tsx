'use client';

import {
  motion,
  MotionValue,
  useMotionValue,
  useSpring,
  useTransform,
  type SpringOptions,
  AnimatePresence
} from 'framer-motion';
import React, { Children, cloneElement, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';

import './Dock.css';

export type DockItemData = {
  icon: React.ReactNode;
  label: React.ReactNode;
  onClick?: () => void;
  href?: string;
  className?: string;
  active?: boolean;
  color?: string;
  badge?: React.ReactNode;
};

export type DockProps = {
  items: DockItemData[];
  className?: string;
  distance?: number;
  panelHeight?: number;
  baseItemSize?: number;
  dockHeight?: number;
  magnification?: number;
  spring?: SpringOptions;
  direction?: 'horizontal' | 'vertical';
};

type DockItemProps = {
  className?: string;
  children: React.ReactNode;
  onClick?: () => void;
  href?: string;
  mousePos: MotionValue<number>;
  spring: SpringOptions;
  distance: number;
  baseItemSize: number;
  magnification: number;
  label?: React.ReactNode;
  direction?: 'horizontal' | 'vertical';
  active?: boolean;
  color?: string;
};

function DockItem({
  children,
  className = '',
  onClick,
  href,
  mousePos,
  spring,
  distance,
  magnification,
  baseItemSize,
  label,
  direction = 'horizontal',
  active = false,
  color
}: DockItemProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isHovered = useMotionValue(0);

  const mouseDistance = useTransform(mousePos, (val: number) => {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return Infinity;
    const center = direction === 'vertical' ? rect.y + rect.height / 2 : rect.x + rect.width / 2;
    return val - center;
  });

  const targetSize = useTransform(
    mouseDistance,
    [-distance, 0, distance],
    [baseItemSize, magnification, baseItemSize]
  );
  const size = useSpring(targetSize, spring);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onClick?.();
    }
  };

  const itemContent = (
    <motion.div
      ref={ref}
      style={{
        width: size,
        height: size,
        ...({
          '--item-color': color || '#00f59b',
          '--item-glow': color ? `${color}44` : 'rgba(0, 245, 155, 0.25)',
        } as React.CSSProperties),
      }}
      whileTap={{ scale: 0.88 }}
      onHoverStart={() => isHovered.set(1)}
      onHoverEnd={() => isHovered.set(0)}
      onFocus={() => isHovered.set(1)}
      onBlur={() => isHovered.set(0)}
      onClick={onClick}
      onKeyDown={handleKeyDown}
      className={`dock-item ${direction === 'vertical' ? 'dock-item-vertical' : ''} ${active ? 'dock-item-active' : ''} ${className}`.trim()}
      tabIndex={0}
      role="button"
      aria-haspopup="true"
      aria-label={typeof label === 'string' ? label : undefined}
    >
      {active && (
        <span
          className="dock-active-dot"
          style={color ? { backgroundColor: color, boxShadow: `0 0 12px ${color}` } : undefined}
        />
      )}
      {Children.map(children, child =>
        React.isValidElement(child)
          ? cloneElement(child as React.ReactElement<{ isHovered?: MotionValue<number> }>, { isHovered })
          : child
      )}
    </motion.div>
  );

  if (href) {
    return (
      <Link href={href} className="dock-link" onClick={onClick} scroll={false}>
        {itemContent}
      </Link>
    );
  }

  return itemContent;
}

type DockLabelProps = {
  className?: string;
  children: React.ReactNode;
  isHovered?: MotionValue<number>;
  direction?: 'horizontal' | 'vertical';
};

function DockLabel({ children, className = '', isHovered, direction = 'horizontal' }: DockLabelProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (!isHovered) return;
    const unsubscribe = isHovered.on('change', latest => {
      setIsVisible(latest === 1);
    });
    return () => unsubscribe();
  }, [isHovered]);

  const initialAnim = direction === 'vertical' ? { opacity: 0, x: -10, y: '-50%', scale: 0.92 } : { opacity: 0, y: 0, x: '-50%', scale: 0.92 };
  const animateAnim = direction === 'vertical' ? { opacity: 1, x: 0, y: '-50%', scale: 1 } : { opacity: 1, y: -10, x: '-50%', scale: 1 };
  const exitAnim = direction === 'vertical' ? { opacity: 0, x: -6, y: '-50%', scale: 0.94 } : { opacity: 0, y: 0, x: '-50%', scale: 0.94 };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={initialAnim}
          animate={animateAnim}
          exit={exitAnim}
          transition={{ type: 'spring', stiffness: 380, damping: 26 }}
          className={`dock-label ${direction === 'vertical' ? 'dock-label-vertical' : ''} ${className}`.trim()}
          role="tooltip"
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

type DockIconProps = {
  className?: string;
  children: React.ReactNode;
  isHovered?: MotionValue<number>;
};

function DockIcon({ children, className = '' }: DockIconProps) {
  return <div className={`dock-icon ${className}`.trim()}>{children}</div>;
}

export default function Dock({
  items,
  className = '',
  spring = { mass: 0.1, stiffness: 150, damping: 12 },
  magnification = 56,
  distance = 130,
  panelHeight = 68,
  dockHeight = 256,
  baseItemSize = 40,
  direction = 'horizontal'
}: DockProps) {
  const mousePos = useMotionValue(Infinity);
  const isHovered = useMotionValue(0);

  const isVertical = direction === 'vertical';

  const maxHeight = useMemo(
    () => Math.max(dockHeight, magnification + magnification / 2 + 4),
    [magnification, dockHeight]
  );
  const heightRow = useTransform(isHovered, [0, 1], [panelHeight, maxHeight]);
  const height = useSpring(heightRow, spring);

  return (
    <motion.div
      style={!isVertical ? { height, scrollbarWidth: 'none' } : { scrollbarWidth: 'none' }}
      className={`dock-outer ${isVertical ? 'dock-outer-vertical' : ''}`}
    >
      <motion.div
        onMouseMove={(e: React.MouseEvent) => {
          isHovered.set(1);
          mousePos.set(isVertical ? e.clientY : e.pageX);
        }}
        onMouseLeave={() => {
          isHovered.set(0);
          mousePos.set(Infinity);
        }}
        className={`dock-panel ${isVertical ? 'dock-panel-vertical' : ''} ${className}`.trim()}
        style={!isVertical ? { height: panelHeight } : undefined}
        role="toolbar"
        aria-label="Application dock"
      >
        {items.map((item, index) => (
          <DockItem
            key={index}
            onClick={item.onClick}
            href={item.href}
            className={item.className}
            mousePos={mousePos}
            spring={spring}
            distance={distance}
            magnification={magnification}
            baseItemSize={baseItemSize}
            label={item.label}
            direction={direction}
            active={item.active}
            color={item.color}
          >
            <DockIcon>{item.icon}</DockIcon>
            <DockLabel direction={direction}>{item.label}</DockLabel>
          </DockItem>
        ))}
      </motion.div>
    </motion.div>
  );
}

export { Dock };
