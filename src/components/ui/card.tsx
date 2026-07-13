import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';

/** Card — JolyUI-style: trắng, hairline border, bo góc lớn, fade-up khi mount. */
export const Card: React.FC<React.PropsWithChildren<{ className?: string; animate?: boolean }>> = ({
    className,
    animate = true,
    children,
}) => (
    <motion.div
        initial={animate ? { opacity: 0, y: 8 } : false}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        className={cn('bg-white border border-[#E4E7EC] rounded-xl', className)}
    >
        {children}
    </motion.div>
);

export const CardHeader: React.FC<React.PropsWithChildren<{ className?: string }>> = ({ className, children }) => (
    <div className={cn('px-5 pt-5 pb-3 flex items-start justify-between gap-3', className)}>{children}</div>
);

export const CardTitle: React.FC<React.PropsWithChildren<{ className?: string }>> = ({ className, children }) => (
    <h3 className={cn('text-sm font-semibold text-[#111111] tracking-tight', className)}>{children}</h3>
);

export const CardContent: React.FC<React.PropsWithChildren<{ className?: string }>> = ({ className, children }) => (
    <div className={cn('px-5 pb-5', className)}>{children}</div>
);
