/** Ghép className có điều kiện — thay cho clsx/tailwind-merge (đủ dùng cho UI kit). */
export function cn(...classes: Array<string | false | null | undefined>): string {
    return classes.filter(Boolean).join(' ');
}
