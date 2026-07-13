import React from 'react';
import { cn } from '../../lib/utils';

type Tone = 'neutral' | 'success' | 'warning' | 'danger' | 'info';

const tones: Record<Tone, string> = {
    neutral: 'bg-[#F1F0EC] text-[#5f5e5b]',
    success: 'bg-[#EDF3EC] text-[#346538]',
    warning: 'bg-[#FBF3DB] text-[#956400]',
    danger: 'bg-[#FDEBEC] text-[#9F2F2D]',
    info: 'bg-[#E1F3FE] text-[#1F6C9F]',
};

/** Badge — pastel tone khớp bảng màu admin console. */
export const Badge: React.FC<React.PropsWithChildren<{ tone?: Tone; className?: string }>> = ({
    tone = 'neutral',
    className,
    children,
}) => (
    <span
        className={cn(
            'inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium whitespace-nowrap',
            tones[tone],
            className,
        )}
    >
        {children}
    </span>
);
