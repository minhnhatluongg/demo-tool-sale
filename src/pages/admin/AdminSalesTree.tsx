import React, { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import {
    ArrowPathIcon,
    ChevronRightIcon,
    ChevronDownIcon,
    UserGroupIcon,
    UserIcon,
    BuildingOffice2Icon,
    MagnifyingGlassIcon,
    XMarkIcon,
} from '@heroicons/react/24/outline';
import { getSalesHierarchy, SalesHierarchyNode } from '../../api/adminService';

/* ─── Level color mapping ──────────────────────────────────────────────── */

const levelStyle: Record<string, { bg: string; text: string; border: string; icon: string }> = {
    MNG:     { bg: 'bg-rose-500/15', text: 'text-rose-300', border: 'border-rose-500/30', icon: '👑' },
    SUP:     { bg: 'bg-violet-500/15', text: 'text-violet-300', border: 'border-violet-500/30', icon: '⭐' },
    TEAM:    { bg: 'bg-indigo-500/15', text: 'text-indigo-300', border: 'border-indigo-500/30', icon: '🏷️' },
    'TDV/CTV': { bg: 'bg-cyan-500/15', text: 'text-cyan-300', border: 'border-cyan-500/30', icon: '👤' },
};

const getLevelStyle = (level: string) =>
    levelStyle[level] || { bg: 'bg-white/5', text: 'text-gray-300', border: 'border-white/10', icon: '•' };

/* ─── Search/Filter helpers ─────────────────────────────────────────────── */

/** Check if a node matches the search keyword (by id, name, or loginName) */
const nodeMatches = (node: SalesHierarchyNode, keyword: string): boolean => {
    const kw = keyword.toLowerCase();
    return (
        node.id.toLowerCase().includes(kw) ||
        node.name.toLowerCase().includes(kw) ||
        node.loginName.toLowerCase().includes(kw)
    );
};

/** Recursively filter tree — keep node if it matches OR any descendant matches */
const filterTree = (nodes: SalesHierarchyNode[], keyword: string): SalesHierarchyNode[] => {
    if (!keyword.trim()) return nodes;
    const result: SalesHierarchyNode[] = [];
    for (const node of nodes) {
        const filteredChildren = filterTree(node.children || [], keyword);
        if (nodeMatches(node, keyword) || filteredChildren.length > 0) {
            result.push({ ...node, children: filteredChildren.length > 0 ? filteredChildren : node.children });
        }
    }
    return result;
};

/** Collect all node IDs that match, for highlighting */
const collectMatchIds = (nodes: SalesHierarchyNode[], keyword: string): Set<string> => {
    const ids = new Set<string>();
    const walk = (list: SalesHierarchyNode[]) => {
        for (const n of list) {
            if (nodeMatches(n, keyword)) ids.add(n.id);
            if (n.children?.length) walk(n.children);
        }
    };
    walk(nodes);
    return ids;
};

/* ─── Tree Node Component ──────────────────────────────────────────────── */

const TreeNode: React.FC<{
    node: SalesHierarchyNode;
    depth?: number;
    highlightIds?: Set<string>;
    forceExpand?: boolean;
}> = ({ node, depth = 0, highlightIds, forceExpand = false }) => {
    const [expanded, setExpanded] = useState(forceExpand || depth < 2);
    const hasChildren = node.children && node.children.length > 0;
    const style = getLevelStyle(node.level);
    const isHighlighted = highlightIds?.has(node.id);

    // When forceExpand changes (search active), auto expand
    React.useEffect(() => {
        if (forceExpand) setExpanded(true);
    }, [forceExpand]);

    return (
        <div className="select-none">
            <div
                className={`group flex items-center gap-2 py-1.5 px-2 rounded-lg hover:bg-white/[0.04] transition-colors cursor-pointer ${
                    isHighlighted ? 'bg-yellow-500/10 ring-1 ring-yellow-500/30' : ''
                }`}
                style={{ paddingLeft: `${depth * 20 + 8}px` }}
                onClick={() => hasChildren && setExpanded(!expanded)}
            >
                {/* Expand/Collapse toggle */}
                <span className="w-4 h-4 flex items-center justify-center flex-shrink-0">
                    {hasChildren ? (
                        expanded ? (
                            <ChevronDownIcon className="w-3.5 h-3.5 text-gray-400" />
                        ) : (
                            <ChevronRightIcon className="w-3.5 h-3.5 text-gray-500" />
                        )
                    ) : (
                        <span className="w-1.5 h-1.5 rounded-full bg-gray-600" />
                    )}
                </span>

                {/* Icon */}
                <span className="text-sm flex-shrink-0">{style.icon}</span>

                {/* Level badge */}
                <span className={`px-1.5 py-0.5 text-[10px] font-bold rounded border ${style.bg} ${style.text} ${style.border} flex-shrink-0`}>
                    {node.level}
                </span>

                {/* Name */}
                <span className="text-sm text-gray-100 truncate font-medium">
                    {node.name.replace(/^(MNG|SUP|TEAM|TDV\/CTV)\s*-\s*/, '')}
                </span>

                {/* ID */}
                <span className="text-[10px] font-mono text-gray-500 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                    #{node.id}
                </span>

                {/* Login name */}
                {node.loginName && (
                    <span className="text-[10px] text-indigo-400/60 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity ml-auto">
                        @{node.loginName}
                    </span>
                )}

                {/* Children count */}
                {hasChildren && (
                    <span className="text-[10px] text-gray-500 flex-shrink-0 ml-1">
                        ({node.children.length})
                    </span>
                )}
            </div>

            {/* Children */}
            {hasChildren && expanded && (
                <div className="relative">
                    {/* Vertical line connector */}
                    <div
                        className="absolute top-0 bottom-2 border-l border-white/10"
                        style={{ left: `${depth * 20 + 20}px` }}
                    />
                    {node.children.map(child => (
                        <TreeNode key={child.id} node={child} depth={depth + 1} highlightIds={highlightIds} forceExpand={forceExpand} />
                    ))}
                </div>
            )}
        </div>
    );
};

/* ─── Stats Summary ────────────────────────────────────────────────────── */

const countByLevel = (nodes: SalesHierarchyNode[]): Record<string, number> => {
    const counts: Record<string, number> = {};
    const walk = (list: SalesHierarchyNode[]) => {
        for (const n of list) {
            counts[n.level] = (counts[n.level] || 0) + 1;
            if (n.children?.length) walk(n.children);
        }
    };
    walk(nodes);
    return counts;
};

/* ─── Page ─────────────────────────────────────────────────────────────── */

const AdminSalesTree: React.FC = () => {
    const [tree, setTree] = useState<SalesHierarchyNode[]>([]);
    const [loading, setLoading] = useState(false);
    const [managerId, setManagerId] = useState('21:000');
    const [inputId, setInputId] = useState('21:000');
    const [search, setSearch] = useState('');

    const fetchTree = async (id: string = managerId) => {
        setLoading(true);
        try {
            const res = await getSalesHierarchy(id, false);
            const payload = res?.data ?? res;
            const data: SalesHierarchyNode[] = Array.isArray(payload) ? payload : payload?.data ?? [];
            setTree(data);
            setManagerId(id);
        } catch (e: any) {
            toast.error(e?.response?.data?.message || e?.message || 'Không tải được cây ASM');
            setTree([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTree();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const stats = countByLevel(tree);
    const isSearching = search.trim().length > 0;
    const filteredTree = useMemo(() => filterTree(tree, search), [tree, search]);
    const highlightIds = useMemo(() => isSearching ? collectMatchIds(tree, search) : new Set<string>(), [tree, search, isSearching]);

    return (
        <div className="max-w-[1200px] mx-auto">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3 mb-5">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
                        <BuildingOffice2Icon className="w-7 h-7 text-indigo-400" />
                        Cây ASM — Sales Hierarchy
                    </h1>
                    <p className="text-sm text-gray-400 mt-1">
                        Xem cấu trúc quản lý kinh doanh theo cây phân cấp.
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <input
                        type="text"
                        value={inputId}
                        onChange={e => setInputId(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') fetchTree(inputId); }}
                        placeholder="Manager ID (vd: 21:000)"
                        className="w-44 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-sm placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <button
                        onClick={() => fetchTree(inputId)}
                        disabled={loading}
                        className="px-4 py-2 rounded-xl text-sm font-semibold bg-indigo-500/20 text-indigo-200 hover:bg-indigo-500/30 transition-colors flex items-center gap-2"
                    >
                        <ArrowPathIcon className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                        Tải
                    </button>
                </div>
            </div>

            {/* Stats badges */}
            {Object.keys(stats).length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                    {Object.entries(stats).map(([level, count]) => {
                        const s = getLevelStyle(level);
                        return (
                            <div key={level} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border ${s.bg} ${s.border}`}>
                                <span className="text-sm">{s.icon}</span>
                                <span className={`text-xs font-bold ${s.text}`}>{level}</span>
                                <span className="text-xs text-gray-300 font-semibold">{count}</span>
                            </div>
                        );
                    })}
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border bg-white/5 border-white/10">
                        <UserGroupIcon className="w-4 h-4 text-gray-400" />
                        <span className="text-xs text-gray-300 font-semibold">
                            Tổng: {Object.values(stats).reduce((a, b) => a + b, 0)}
                        </span>
                    </div>
                </div>
            )}

            {/* Search */}
            <div className="mb-4">
                <div className="relative w-full md:w-80">
                    <MagnifyingGlassIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                        type="text"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="Tìm theo mã NV, tên, login..."
                        className="w-full pl-9 pr-8 py-2 rounded-xl bg-white/5 border border-white/10 text-sm placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    {search && (
                        <button
                            onClick={() => setSearch('')}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-200"
                        >
                            <XMarkIcon className="w-4 h-4" />
                        </button>
                    )}
                </div>
                {isSearching && (
                    <p className="text-xs text-gray-500 mt-1.5">
                        Tìm thấy <span className="text-indigo-300 font-semibold">{highlightIds.size}</span> kết quả
                        {filteredTree.length === 0 && ' — không khớp'}
                    </p>
                )}
            </div>

            {/* Tree container */}
            <div className="rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 shadow-xl overflow-hidden">
                <div className="px-4 py-3 border-b border-white/10 flex items-center gap-2">
                    <UserGroupIcon className="w-4 h-4 text-indigo-300" />
                    <span className="text-sm font-semibold text-indigo-200">Cấu trúc phân cấp</span>
                    <span className="text-xs text-gray-500 ml-auto">Click để mở/đóng nhánh</span>
                </div>

                <div className="p-3 max-h-[70vh] overflow-y-auto">
                    {loading && (
                        <div className="flex items-center justify-center py-12 gap-2 text-gray-400">
                            <ArrowPathIcon className="w-5 h-5 animate-spin" />
                            <span>Đang tải cây ASM...</span>
                        </div>
                    )}
                    {!loading && filteredTree.length === 0 && (
                        <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                            <UserIcon className="w-10 h-10 mb-2 text-gray-600" />
                            <span>{isSearching ? 'Không tìm thấy kết quả' : 'Không có dữ liệu'}</span>
                        </div>
                    )}
                    {!loading && filteredTree.map(node => (
                        <TreeNode key={node.id} node={node} depth={0} highlightIds={highlightIds} forceExpand={isSearching} />
                    ))}
                </div>
            </div>
        </div>
    );
};

export default AdminSalesTree;
