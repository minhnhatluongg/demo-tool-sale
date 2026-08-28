import React, { useEffect, useMemo, useRef, useState } from 'react';
import { MagnifyingGlassIcon, ChevronUpDownIcon } from '@heroicons/react/24/outline';

/**
 * SearchableSelect — combobox có ô tìm kiếm (thay <select> khi danh sách dài,
 * vd 80+ chức danh). Lọc theo label, BỎ DẤU tiếng Việt ("nhan vien kinh doanh"
 * khớp "Nhân Viên Kinh Doanh"). Click ra ngoài để đóng.
 */
export interface SsOption {
    value: string;
    label: string;
}

interface Props {
    value: string;
    onChange: (value: string) => void;
    options: SsOption[];
    placeholder?: string;
    disabled?: boolean;
    className?: string;
}

const strip = (s: string) =>
    (s || '')
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '')
        .replace(/đ/g, 'd')
        .replace(/Đ/g, 'D')
        .toLowerCase();

const base =
    'w-full h-10 px-3 rounded-lg text-sm text-[#111111] bg-white border border-[#E4E7EC] ' +
    'transition-all duration-200 focus:outline-none focus:border-[#111111] focus:ring-2 focus:ring-[#11111114]';

export const SearchableSelect: React.FC<Props> = ({
    value,
    onChange,
    options,
    placeholder = 'Chọn…',
    disabled,
    className,
}) => {
    const [open, setOpen] = useState(false);
    const [q, setQ] = useState('');
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!open) return;
        const onDoc = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
        };
        document.addEventListener('mousedown', onDoc);
        return () => document.removeEventListener('mousedown', onDoc);
    }, [open]);

    const selected = useMemo(() => options.find(o => o.value === value) || null, [options, value]);

    const filtered = useMemo(() => {
        const nq = strip(q.trim());
        if (!nq) return options.slice(0, 300);
        return options.filter(o => strip(o.label).includes(nq)).slice(0, 300);
    }, [options, q]);

    return (
        <div className={`relative ${className || ''}`} ref={ref}>
            <button
                type="button"
                disabled={disabled}
                onClick={() => !disabled && setOpen(o => !o)}
                className={`${base} flex items-center justify-between text-left disabled:opacity-50 disabled:cursor-not-allowed`}
            >
                <span className={selected ? 'truncate' : 'truncate text-[#9b9a96]'}>
                    {selected ? selected.label : placeholder}
                </span>
                <ChevronUpDownIcon className="w-4 h-4 text-[#9b9a96] flex-shrink-0 ml-2" />
            </button>

            {open && (
                <div className="absolute z-30 mt-1 w-full bg-white border border-[#E4E7EC] rounded-lg shadow-lg overflow-hidden">
                    <div className="relative p-2 border-b border-[#F1F0EC]">
                        <MagnifyingGlassIcon className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-[#B3B2AE]" />
                        <input
                            autoFocus
                            value={q}
                            onChange={e => setQ(e.target.value)}
                            placeholder="Tìm theo tên hoặc mã…"
                            className="w-full h-9 pl-8 pr-3 rounded-md text-sm bg-[#F7F8FA] border border-transparent focus:outline-none focus:border-[#E4E7EC]"
                        />
                    </div>
                    <div className="max-h-64 overflow-y-auto py-1">
                        {filtered.map(o => (
                            <button
                                key={o.value}
                                type="button"
                                onClick={() => {
                                    onChange(o.value);
                                    setOpen(false);
                                    setQ('');
                                }}
                                className={`w-full text-left px-3 py-2 text-sm truncate hover:bg-[#F7F8FA] ${
                                    o.value === value ? 'bg-[#EEF2FF] text-[#111111] font-medium' : 'text-[#2F3437]'
                                }`}
                            >
                                {o.label}
                            </button>
                        ))}
                        {filtered.length === 0 && (
                            <p className="px-3 py-6 text-center text-xs text-[#787774]">Không có mục nào khớp.</p>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default SearchableSelect;
