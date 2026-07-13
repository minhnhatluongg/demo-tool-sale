import React from 'react';
import { cn } from '../../lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    hint?: string;
}

/** Input — JolyUI-style: hairline border, focus ring đen mảnh. */
export const Input = React.forwardRef<HTMLInputElement, InputProps>(
    ({ className, label, hint, id, ...props }, ref) => {
        const inputId = id || props.name;
        return (
            <div className="w-full">
                {label && (
                    <label htmlFor={inputId} className="block text-xs font-medium text-[#5f5e5b] mb-1.5">
                        {label}
                    </label>
                )}
                <input
                    ref={ref}
                    id={inputId}
                    className={cn(
                        'w-full h-10 px-3 rounded-lg text-sm text-[#111111] placeholder-[#B3B2AE]',
                        'bg-white border border-[#E4E7EC]',
                        'transition-all duration-200',
                        'focus:outline-none focus:border-[#111111] focus:ring-2 focus:ring-[#11111114]',
                        className,
                    )}
                    {...props}
                />
                {hint && <p className="mt-1 text-[11px] text-[#787774]">{hint}</p>}
            </div>
        );
    },
);
Input.displayName = 'Input';
