import React from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';
import { cn } from '../../lib/utils';

/**
 * Button — JolyUI-style (port thủ công về Tailwind 3 + framer-motion).
 * Micro-interaction: scale khi nhấn, spring transition.
 */
type Variant = 'default' | 'outline' | 'ghost' | 'destructive' | 'success';
type Size = 'sm' | 'md' | 'lg' | 'icon';

export interface ButtonProps extends Omit<HTMLMotionProps<'button'>, 'ref'> {
    variant?: Variant;
    size?: Size;
    loading?: boolean;
}

const variantClasses: Record<Variant, string> = {
    default:
        'bg-[#111111] text-white hover:bg-[#2F3437] shadow-sm',
    outline:
        'bg-white text-[#2F3437] border border-[#E4E7EC] hover:border-[#111111] hover:text-[#111111]',
    ghost:
        'bg-transparent text-[#5f5e5b] hover:bg-[#F1F0EC] hover:text-[#111111]',
    destructive:
        'bg-[#FDEBEC] text-[#9F2F2D] hover:bg-[#f9dfe1] border border-transparent',
    success:
        'bg-[#EDF3EC] text-[#346538] hover:bg-[#e0ecdf] border border-transparent',
};

const sizeClasses: Record<Size, string> = {
    sm: 'h-8 px-3 text-xs rounded-md gap-1.5',
    md: 'h-10 px-4 text-sm rounded-lg gap-2',
    lg: 'h-11 px-6 text-sm rounded-lg gap-2',
    icon: 'h-9 w-9 rounded-lg',
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant = 'default', size = 'md', loading = false, disabled, children, ...props }, ref) => (
        <motion.button
            ref={ref}
            whileTap={{ scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            disabled={disabled || loading}
            className={cn(
                'inline-flex items-center justify-center font-medium select-none',
                'transition-colors duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#111111]',
                'disabled:opacity-50 disabled:pointer-events-none',
                variantClasses[variant],
                sizeClasses[size],
                className,
            )}
            {...props}
        >
            <>
                {loading && (
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                    </svg>
                )}
                {children}
            </>
        </motion.button>
    ),
);
Button.displayName = 'Button';
