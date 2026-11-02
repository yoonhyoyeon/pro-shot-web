import type { HTMLAttributes } from 'react'

export function Card({ className = '', ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={`bg-card shadow-ring overflow-hidden rounded-2xl ${className}`} {...props} />
}

export function Eyebrow({ className = '', ...props }: HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p
      className={`text-fg-subtle font-mono text-[10px] leading-[15px] tracking-[1px] uppercase ${className}`}
      {...props}
    />
  )
}
