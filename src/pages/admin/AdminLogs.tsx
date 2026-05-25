import React, { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import {
    DocumentMagnifyingGlassIcon,
    MagnifyingGlassIcon,
    ArrowPathIcon,
    ChevronDoubleLeftIcon,
    ChevronDoubleRightIcon,
} from '@heroicons/react/24/outline';
import {
    adminLogListFiles,
    adminLogReadFile,
    adminLogSearch,
} from '../../api/adminService';

type Category = 'econtract' | 'externalapi' | 'stdout';

// Khi user chọn "Tất cả" → gửi pageSize rất lớn để BE trả về toàn bộ trong 1 trang
const VIEW_ALL_PAGE_SIZE = 100000;
const PAGE_SIZE_OPTIONS = [200, 500, 1000, 2000, VIEW_ALL_PAGE_SIZE];

const formatPageSizeLabel = (size: number) =>
    size === VIEW_ALL_PAGE_SIZE ? 'Tất cả' : `${size} dòng/trang`;

// Trích ngày yyyy-MM-dd trong tên file để sort cho chắc chắn (mới nhất ở đầu)
const extractDate = (name: string): string => {
    const m = name.match(/(\d{4}-\d{2}-\d{2})/);
    return m ? m[1] : '';
};

const AdminLogs: React.FC = () => {
    const [category, setCategory] = useState<Category>('econtract');
    const [files, setFiles] = useState<any[]>([]);
    const [loadingFiles, setLoadingFiles] = useState(false);

    const [selectedFile, setSelectedFile] = useState<string | null>(null);
    const [lines, setLines] = useState<string[]>([]);
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState<number>(200);
    const [totalPages, setTotalPages] = useState(1);
    const [totalLines, setTotalLines] = useState(0);
    const [loadingRead, setLoadingRead] = useState(false);

    // Ô input nhảy trang (không sync trực tiếp với `page` để user gõ thoải mái)
    const [pageInput, setPageInput] = useState<string>('1');

    const [keyword, setKeyword] = useState('');
    const [searchMode, setSearchMode] = useState(false);

    const loadFiles = async () => {
        setLoadingFiles(true);
        try {
            const res = await adminLogListFiles({ category });
            const list = res?.data ?? res ?? [];
            setFiles(Array.isArray(list) ? list : []);
        } catch (e: any) {
            toast.error(e?.response?.data?.message || 'Không tải được danh sách file log');
            setFiles([]);
        } finally {
            setLoadingFiles(false);
        }
    };

    // Sort lại ở FE để đảm bảo: ngày mới nhất luôn ở trên cùng
    const sortedFiles = useMemo(() => {
        const arr = [...files];
        arr.sort((a, b) => {
            const nameA = String(a.fileName ?? a.FileName ?? a.name ?? '');
            const nameB = String(b.fileName ?? b.FileName ?? b.name ?? '');
            const dA = extractDate(nameA);
            const dB = extractDate(nameB);
            if (dA && dB && dA !== dB) return dB.localeCompare(dA); // ngày desc
            // cùng ngày (hoặc không có ngày) → fallback theo lastModified, rồi tên
            const mA = String(a.lastModified ?? a.LastModified ?? '');
            const mB = String(b.lastModified ?? b.LastModified ?? '');
            if (mA && mB && mA !== mB) return mB.localeCompare(mA);
            return nameB.localeCompare(nameA);
        });
        return arr;
    }, [files]);

    const readFile = async (file: string, p = 1, size: number = pageSize) => {
        setLoadingRead(true);
        setSearchMode(false);
        try {
            const res = await adminLogReadFile({ category, fileName: file, page: p, pageSize: size });
            const data = res?.data ?? res;
            setLines(data?.lines ?? data?.Lines ?? []);
            const tp = data?.totalPages ?? data?.TotalPages ?? 1;
            const tl = data?.totalLines ?? data?.TotalLines ?? 0;
            const pg = data?.page ?? data?.Page ?? p;
            setTotalPages(tp);
            setTotalLines(tl);
            setPage(pg);
            setPageInput(String(pg));
            setSelectedFile(file);
        } catch (e: any) {
            toast.error(e?.response?.data?.message || 'Không đọc được file');
            setLines([]);
        } finally {
            setLoadingRead(false);
        }
    };

    const goToPage = (target: number) => {
        if (!selectedFile) return;
        const clamped = Math.max(1, Math.min(totalPages || 1, Math.floor(target) || 1));
        if (clamped === page && !loadingRead) return;
        readFile(selectedFile, clamped);
    };

    const onPageInputCommit = () => {
        const n = parseInt(pageInput, 10);
        if (Number.isNaN(n)) {
            setPageInput(String(page));
            return;
        }
        goToPage(n);
    };

    const onChangePageSize = (size: number) => {
        setPageSize(size);
        if (selectedFile) {
            // Đổi pageSize → quay về trang 1 với size mới
            readFile(selectedFile, 1, size);
        }
    };

    const doSearch = async () => {
        if (!selectedFile) {
            toast.error('Chọn file trước khi tìm');
            return;
        }
        if (!keyword.trim()) {
            toast.error('Nhập từ khoá');
            return;
        }
        setLoadingRead(true);
        setSearchMode(true);
        try {
            const res = await adminLogSearch({
                category,
                fileName: selectedFile,
                keyword: keyword.trim(),
                maxLines: 1000,
            });
            const data = res?.data ?? res;
            setLines(data?.lines ?? []);
            setTotalLines(data?.matchCount ?? data?.lines?.length ?? 0);
            setTotalPages(1);
            setPage(1);
            setPageInput('1');
        } catch (e: any) {
            toast.error(e?.response?.data?.message || 'Tìm kiếm lỗi');
            setLines([]);
        } finally {
            setLoadingRead(false);
        }
    };

    useEffect(() => {
        setSelectedFile(null);
        setLines([]);
        setPage(1);
        setPageInput('1');
        setTotalPages(1);
        setTotalLines(0);
        loadFiles();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [category]);

    const colorLine = (line: string) => {
        const l = line.toLowerCase();
        if (l.includes('error') || l.includes('exception') || l.includes('fail')) return 'text-rose-300';
        if (l.includes('warn'))   return 'text-amber-300';
        if (l.includes('info'))   return 'text-cyan-200';
        return 'text-gray-300';
    };

    return (
        <div className="max-w-[1500px] mx-auto">
            <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2 mb-1">
                <DocumentMagnifyingGlassIcon className="w-7 h-7 text-indigo-300" />
                Server logs
            </h1>
            <p className="text-sm text-gray-400 mb-5">
                Đọc trực tiếp file log trên server qua <code className="text-indigo-300">/api/admin/logs/*</code>.
            </p>

            {/* Category tabs */}
            <div className="inline-flex p-1 rounded-xl bg-white/5 border border-white/10 mb-5">
                {(['econtract', 'externalapi', 'stdout'] as Category[]).map(c => (
                    <button
                        key={c}
                        onClick={() => setCategory(c)}
                        className={`px-4 py-1.5 text-sm rounded-lg transition-colors ${
                            category === c
                                ? 'bg-gradient-to-r from-indigo-500 to-fuchsia-500 text-white font-semibold'
                                : 'text-gray-300 hover:text-white'
                        }`}
                    >
                        {c}
                    </button>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                {/* Files panel */}
                <div className="lg:col-span-1 rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 shadow-xl p-4">
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="text-sm font-semibold text-indigo-200">
                            Files <span className="text-[10px] text-gray-500 font-normal">(mới → cũ)</span>
                        </h3>
                        <button
                            onClick={loadFiles}
                            className="p-1.5 rounded-md bg-white/5 hover:bg-white/10 transition-colors"
                            title="Refresh"
                        >
                            <ArrowPathIcon className={`w-4 h-4 ${loadingFiles ? 'animate-spin' : ''}`} />
                        </button>
                    </div>
                    <div className="max-h-[60vh] overflow-y-auto space-y-1 pr-1">
                        {loadingFiles && <p className="text-xs text-gray-400">Đang tải...</p>}
                        {!loadingFiles && sortedFiles.length === 0 && (
                            <p className="text-xs text-gray-500">Không có file</p>
                        )}
                        {sortedFiles.map((f: any, i: number) => {
                            const name = f.fileName ?? f.FileName ?? f.name ?? String(f);
                            const sizeKB = f.sizeKB ?? f.SizeKB ?? (f.sizeBytes ? Math.round(f.sizeBytes / 1024) : null);
                            const isActive = selectedFile === name;
                            return (
                                <button
                                    key={name + i}
                                    onClick={() => readFile(name, 1)}
                                    className={`w-full text-left px-3 py-2 rounded-lg text-xs transition-colors ${
                                        isActive
                                            ? 'bg-indigo-500/20 text-white border border-indigo-500/40'
                                            : 'hover:bg-white/5 text-gray-300 border border-transparent'
                                    }`}
                                >
                                    <div className="font-mono truncate">{name}</div>
                                    {sizeKB !== null && (
                                        <div className="text-[10px] text-gray-500 mt-0.5">{sizeKB} KB</div>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Reader */}
                <div className="lg:col-span-2 rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 shadow-xl p-4 flex flex-col min-h-[60vh]">
                    <div className="flex flex-col md:flex-row gap-2 mb-3">
                        <div className="flex-1 flex items-center gap-2">
                            <h3 className="text-sm font-semibold text-indigo-200 truncate">
                                {selectedFile ? <span className="font-mono">{selectedFile}</span> : 'Chọn 1 file ở cột bên trái'}
                            </h3>
                            {selectedFile && (
                                <span className="text-xs text-gray-500">
                                    · {searchMode ? `match: ${totalLines}` : `${totalLines} dòng`}
                                </span>
                            )}
                        </div>
                        <div className="flex gap-2 flex-wrap">
                            {/* Page-size selector */}
                            {selectedFile && !searchMode && (
                                <select
                                    value={pageSize}
                                    onChange={e => onChangePageSize(parseInt(e.target.value, 10))}
                                    className="px-2 py-1.5 rounded-lg bg-white/5 border border-white/10 text-sm text-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    title="Số dòng mỗi trang"
                                >
                                    {PAGE_SIZE_OPTIONS.map(s => (
                                        <option key={s} value={s} className="bg-slate-900">
                                            {formatPageSizeLabel(s)}
                                        </option>
                                    ))}
                                </select>
                            )}

                            <div className="relative">
                                <MagnifyingGlassIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input
                                    type="text"
                                    value={keyword}
                                    onChange={e => setKeyword(e.target.value)}
                                    onKeyDown={e => { if (e.key === 'Enter') doSearch(); }}
                                    placeholder="Search keyword..."
                                    className="pl-9 pr-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-sm placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                />
                            </div>
                            <button
                                onClick={doSearch}
                                disabled={!selectedFile}
                                className="px-3 py-1.5 rounded-lg text-sm bg-indigo-500/20 text-indigo-200 hover:bg-indigo-500/30 disabled:opacity-50"
                            >
                                Tìm
                            </button>
                            {searchMode && (
                                <button
                                    onClick={() => selectedFile && readFile(selectedFile, 1)}
                                    className="px-3 py-1.5 rounded-lg text-sm bg-white/5 hover:bg-white/10"
                                >
                                    Xem full
                                </button>
                            )}
                        </div>
                    </div>

                    <pre className="flex-1 overflow-auto rounded-xl bg-black/40 border border-white/5 p-3 text-xs leading-relaxed font-mono whitespace-pre-wrap">
                        {loadingRead && <span className="text-gray-400">Đang tải...</span>}
                        {!loadingRead && lines.length === 0 && (
                            <span className="text-gray-500">— Chưa có nội dung —</span>
                        )}
                        {!loadingRead && lines.map((line, i) => (
                            <div key={i} className={colorLine(String(line))}>{String(line)}</div>
                        ))}
                    </pre>

                    {!searchMode && selectedFile && (
                        <div className="flex flex-wrap items-center justify-between gap-2 pt-3 text-xs">
                            <span className="text-gray-400">
                                Trang <span className="text-gray-200 font-semibold">{page}</span> / {totalPages}
                                {pageSize === VIEW_ALL_PAGE_SIZE && (
                                    <span className="ml-2 px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 text-[10px]">
                                        Đang xem toàn bộ file
                                    </span>
                                )}
                            </span>
                            <div className="flex items-center gap-2">
                                {/* Trang đầu */}
                                <button
                                    disabled={page <= 1 || loadingRead}
                                    onClick={() => goToPage(1)}
                                    className="p-1.5 rounded-md bg-white/5 hover:bg-white/10 disabled:opacity-40"
                                    title="Trang đầu"
                                >
                                    <ChevronDoubleLeftIcon className="w-3.5 h-3.5" />
                                </button>
                                <button
                                    disabled={page <= 1 || loadingRead}
                                    onClick={() => goToPage(page - 1)}
                                    className="px-3 py-1 rounded-md bg-white/5 hover:bg-white/10 disabled:opacity-40"
                                >
                                    ← Trước
                                </button>

                                {/* Input nhảy trang */}
                                <div className="flex items-center gap-1">
                                    <input
                                        type="number"
                                        min={1}
                                        max={totalPages}
                                        value={pageInput}
                                        onChange={e => setPageInput(e.target.value)}
                                        onKeyDown={e => { if (e.key === 'Enter') onPageInputCommit(); }}
                                        onBlur={onPageInputCommit}
                                        className="w-16 text-center px-2 py-1 rounded-md bg-white/5 border border-white/10 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                        title="Nhập số trang rồi Enter để nhảy"
                                    />
                                    <span className="text-gray-500">/ {totalPages}</span>
                                </div>

                                <button
                                    disabled={page >= totalPages || loadingRead}
                                    onClick={() => goToPage(page + 1)}
                                    className="px-3 py-1 rounded-md bg-white/5 hover:bg-white/10 disabled:opacity-40"
                                >
                                    Sau →
                                </button>
                                {/* Trang cuối */}
                                <button
                                    disabled={page >= totalPages || loadingRead}
                                    onClick={() => goToPage(totalPages)}
                                    className="p-1.5 rounded-md bg-white/5 hover:bg-white/10 disabled:opacity-40"
                                    title="Trang cuối"
                                >
                                    <ChevronDoubleRightIcon className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AdminLogs;
