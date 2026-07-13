import React, { useEffect } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';

/**
 * NumberCounter — port thủ công component "Number Counter" của JolyUI.
 * Số chạy spring từ 0 (hoặc giá trị cũ) đến value.
 */
export const NumberCounter: React.FC<{ value: number; className?: string }> = ({ value, className }) => {
    const mv = useMotionValue(0);
    const spring = useSpring(mv, { stiffness: 120, damping: 22 });
    const rounded = useTransform(spring, (v: number) => Math.round(v).toLocaleString('vi-VN'));

    useEffect(() => {
        mv.set(value);
    }, [value, mv]);

    return <motion.span className={className}>{rounded}</motion.span>;
};
