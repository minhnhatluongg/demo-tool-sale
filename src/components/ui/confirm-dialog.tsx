import React from 'react';
import { Dialog } from '@headlessui/react';
import { AnimatePresence, motion } from 'framer-motion';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { Button } from './button';

/**
 * ConfirmDialog — Headless UI Dialog + framer-motion (scale/fade theo phong cách JolyUI).
 * Dùng cho các hành động cần xác nhận (hủy gia hạn, gia hạn...).
 */
export const ConfirmDialog: React.FC<{
    open: boolean;
    title: string;
    description?: React.ReactNode;
    confirmText?: string;
    tone?: 'danger' | 'default';
    loading?: boolean;
    onConfirm: () => void;
    onClose: () => void;
}> = ({ open, title, description, confirmText = 'Xác nhận', tone = 'default', loading, onConfirm, onClose }) => (
    <AnimatePresence>
        {open && (
            <Dialog static open={open} onClose={loading ? () => {} : onClose} className="relative z-50">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-black/30"
                    aria-hidden="true"
                />
                <div className="fixed inset-0 flex items-center justify-center p-4">
                    <Dialog.Panel
                        as={motion.div}
                        initial={{ opacity: 0, scale: 0.95, y: 8 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 8 }}
                        className="w-full max-w-md bg-white rounded-xl border border-[#E4E7EC] shadow-xl p-5"
                    >
                        <div className="flex items-start gap-3">
                            {tone === 'danger' && (
                                <span className="mt-0.5 w-9 h-9 shrink-0 rounded-lg bg-[#FDEBEC] text-[#9F2F2D] flex items-center justify-center">
                                    <ExclamationTriangleIcon className="w-5 h-5" />
                                </span>
                            )}
                            <div className="min-w-0">
                                <Dialog.Title className="text-sm font-semibold text-[#111111]">{title}</Dialog.Title>
                                {description && (
                                    <div className="mt-1.5 text-sm text-[#5f5e5b] leading-relaxed">{description}</div>
                                )}
                            </div>
                        </div>
                        <div className="mt-5 flex justify-end gap-2">
                            <Button variant="ghost" size="sm" onClick={onClose} disabled={loading}>
                                Đóng
                            </Button>
                            <Button
                                variant={tone === 'danger' ? 'destructive' : 'default'}
                                size="sm"
                                onClick={onConfirm}
                                loading={loading}
                            >
                                {confirmText}
                            </Button>
                        </div>
                    </Dialog.Panel>
                </div>
            </Dialog>
        )}
    </AnimatePresence>
);
