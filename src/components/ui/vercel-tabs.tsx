import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';

export interface TabItem {
    key: string;
    label: React.ReactNode;
    hint?: string;
}

/**
 * VercelTabs — port thủ công component "Vercel Tabs" của JolyUI về Tailwind 3 + framer-motion.
 * Pill active trượt mượt giữa các tab bằng layoutId (shared layout animation).
 */
export const VercelTabs: React.FC<{
    items: TabItem[];
    value: string;
    onChange: (key: string) => void;
    className?: string;
}> = ({ items, value, onChange, className }) => (
    <div className={cn('inline-flex items-center gap-1 p-1 bg-[#F1F0EC] rounded-lg', className)}>
        {items.map(item => {
            const active = item.key === value;
            return (
                <button
                    key={item.key}
                    type="button"
                    onClick={() => onChange(item.key)}
                    title={item.hint}
                    className={cn(
                        'relative px-3.5 h-8 rounded-md text-xs font-medium transition-colors duration-200',
                        'focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#111111]',
                        active ? 'text-[#111111]' : 'text-[#787774] hover:text-[#111111]',
                    )}
                >
                    {active && (
                        <motion.span
                            layoutId="vercel-tab-pill"
                            className="absolute inset-0 bg-white rounded-md shadow-sm border border-[#E4E7EC]"
                            transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                        />
                    )}
                    <span className="relative z-10">{item.label}</span>
                </button>
            );
        })}
    </div>
);
