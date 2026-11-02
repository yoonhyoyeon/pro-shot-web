import type { ButtonHTMLAttributes } from 'react'

type Variant = 'primary' | 'secondary'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
}

const variants: Record<Variant, string> = {
  primary: 'bg-accent text-bg shadow-glow hover:brightness-110 active:brightness-95',
  secondary:
    'bg-white/[0.03] text-fg-muted shadow-[0_0_0_1px_rgb(255_255_255/0.1)] hover:bg-white/[0.06] hover:text-fg',
}

export function Button({ variant = 'primary', className = '', type = 'button', ...props }: ButtonProps) {
  return (
    <button
      type={type}
      className={`inline-flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 pointer-coarse:min-h-11 text-sm leading-5 font-semibold whitespace-nowrap transition disabled:opacity-50 ${variants[variant]} ${className}`}
      {...props}
    />
  )
}
