import React, { useEffect, useMemo, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import {
    MagnifyingGlassIcon,
    ArrowPathIcon,
    ChevronDoubleLeftIcon,
    ChevronDoubleRightIcon,
    ChevronLeftIcon,
    ChevronRightIcon,
    DocumentTextIcon,
    ClipboardIcon,
    ArrowDownIcon,
    Bars3BottomLeftIcon,
    FolderOpenIcon,
} from '@heroicons/react/24/outline';
import {
    adminLogListFiles,
    adminLogReadFile,
    adminLogSearch,
} from '../../api/adminService';

type Category = 'econtract' | 'externalapi' | 'stdout';
type LevelFilter = 'all' | 'error' | 'warn' | 'info';

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

/* ─── Line level detection + tone (log viewer vẫn dark — chuẩn terminal) ── */

type LineLevel = 'error' | 'warn' | 'info' | 'plain';

const detectLevel = (line: string): LineLevel => {
    const l = line.toLowerCase();
    if (l.includes('error') || l.includes('exception') || l.includes('fail')) return 'error';
    if (l.includes('warn')) return 'warn';
    if (l.includes('info')) return 'info';
    return 'plain';
};

const levelColor: Record<LineLevel, string> = {
    error: 'text-[#f1968f]',
    warn:  'text-[#e3c08d]',
    info:  'text-[#8fc7e8]',
    plain: 'text-[#b8b6b2]',
};

/* ─── Highlight keyword bên trong dòng log ─────────────────────────────── */

const HighlightedLine: React.FC<{ text: string; keyword: string }> = ({ text, keyword }) => {
    if (!keyword) return <>{text}</>;
    const lower = text.toLowerCase();
    const kw = keyword.toLowerCase();
    const parts: React.ReactNode[] = [];
    let i = 0;
    let idx = lower.indexOf(kw);
    let k = 0;
    while (idx !== -1) {
        if (idx > i) parts.push(text.slice(i, idx));
        parts.push(
            <mark key={k++} className="bg-[#FBF3DB] text-[#956400] rounded-sm px-0.5">
                {text.slice(idx, idx + kw.length)}
            </mark>
        );
        i = idx + kw.length;
        idx = lower.indexOf(kw, i);
    }
    if (i < text.length) parts.push(text.slice(i));
    return <>{parts}</>;
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
    const [appliedKeyword, setAppliedKeyword] = useState('');

    /* ─── Viewer UX state ─── */
    const [levelFilter, setLevelFilter] = useState<LevelFilter>('all');
    const [wrapLines, setWrapLines] = useState(true);
    const viewerRef = useRef<HTMLDivElement>(null);

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
        setAppliedKeyword('');
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
            setAppliedKeyword(keyword.trim());
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
        setLevelFilter('all');
        loadFiles();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [category]);

    /* ─── Level filter + counts (trên trang hiện tại) ─── */
    const levelCounts = useMemo(() => {
        const c = { error: 0, warn: 0, info: 0, plain: 0 };
        for (const line of lines) c[detectLevel(String(line))]++;
        return c;
    }, [lines]);

    const visibleLines = useMemo(() => {
        if (levelFilter === 'all') return lines.map((l, i) => ({ text: String(l), idx: i }));
        return lines
            .map((l, i) => ({ text: String(l), idx: i }))
            .filter(x => detectLevel(x.text) === levelFilter);
    }, [lines, levelFilter]);

    const copyVisible = async () => {
        try {
            await navigator.clipboard.writeText(visibleLines.map(x => x.text).join('\n'));
            toast.success(`Đã copy ${visibleLines.length} dòng`);
        } catch {
            toast.error('Không copy được — trình duyệt chặn clipboard');
        }
    };

    const scrollToBottom = () => {
        viewerRef.current?.scrollTo({ top: viewerRef.current.scrollHeight, behavior: 'smooth' });
    };

    const levelFilterOptions: { key: LevelFilter; label: string; activeCls: string; count?: number }[] = [
        { key: 'all',   label: 'Tất cả', activeCls: 'bg-[#111111] text-white' },
        { key: 'error', label: `Error · ${levelCounts.error}`, activeCls: 'bg-[#FDEBEC] text-[#9F2F2D]' },
        { key: 'warn',  label: `Warn · ${levelCounts.warn}`,  activeCls: 'bg-[#FBF3DB] text-[#956400]' },
        { key: 'info',  label: `Info · ${levelCounts.info}`,  activeCls: 'bg-[#E1F3FE] text-[#1F6C9F]' },
    ];

    return (
        <div className="max-w-[1500px] mx-auto">
            {/* Header */}
            <div className="pb-6 mb-6 border-b border-[#EAEAEA]">
                <h1 className="text-2xl md:text-[28px] font-semibold tracking-tight text-[#111111]">Server logs</h1>
                <p className="text-sm text-[#787774] mt-1">
                    Đọc trực tiếp file log trên server qua <code className="font-mono text-xs bg-[#F7F6F3] border border-[#EAEAEA] rounded px-1.5 py-0.5 text-[#2F3437]">/api/admin/logs/*</code>.
                </p>
            </div>

            {/* Category tabs — underline style */}
            <div className="flex gap-6 mb-5 border-b border-[#EAEAEA]">
                {(['econtract', 'externalapi', 'stdout'] as Category[]).map(c => (
                    <button
                        key={c}
                        onClick={() => setCategory(c)}
                        className={`pb-2.5 -mb-px text-sm font-mono border-b-2 transition-colors duration-200 ${
                            category === c
                                ? 'border-[#111111] text-[#111111] font-medium'
                                : 'border-transparent text-[#787774] hover:text-[#111111]'
                        }`}
                    >
                        {c}
                    </button>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Files panel */}
                <div className="lg:col-span-1 rounded-lg bg-white border border-[#EAEAEA] overflow-hidden">
                    <div className="flex items-center justify-between px-4 py-3 border-b border-[#EAEAEA] bg-[#FBFBFA]">
                        <h3 className="text-sm font-medium text-[#111111]">
                            Files <span className="text-[10px] text-[#a8a6a1] font-normal">mới → cũ</span>
                        </h3>
                        <button
                            onClick={loadFiles}
                            className="p-1.5 rounded-md text-[#787774] hover:text-[#111111] hover:bg-[#F1F0EC] transition-colors duration-150"
                            title="Tải lại danh sách"
                        >
                            <ArrowPathIcon className={`w-4 h-4 ${loadingFiles ? 'animate-spin' : ''}`} />
                        </button>
                    </div>
                    <div className="max-h-[62vh] overflow-y-auto p-2 space-y-0.5">
                        {loadingFiles && Array.from({ length: 6 }).map((_, i) => (
                            <div key={i} className="px-3 py-2">
                                <div className="h-3.5 rounded bg-[#EFEEEA] animate-pulse" style={{ maxWidth: 150 + (i * 31) % 80 }} />
                                <div className="h-2.5 w-12 rounded bg-[#EFEEEA] animate-pulse mt-1.5" />
                            </div>
                        ))}
                        {!loadingFiles && sortedFiles.length === 0 && (
                            <div className="flex flex-col items-center gap-2 py-10 text-center">
                                <FolderOpenIcon className="w-8 h-8 text-[#d4d2cc]" />
                                <p className="text-xs text-[#787774]">Không có file log trong mục này</p>
                            </div>
                        )}
                        {sortedFiles.map((f: any, i: number) => {
                            const name = f.fileName ?? f.FileName ?? f.name ?? String(f);
                            const sizeKB = f.sizeKB ?? f.SizeKB ?? (f.sizeBytes ? Math.round(f.sizeBytes / 1024) : null);
                            const isActive = selectedFile === name;
                            return (
                                <button
                                    key={name + i}
                                    onClick={() => readFile(name, 1)}
                                    className={`w-full text-left px-3 py-2 rounded-md text-xs transition-colors duration-150 flex items-start gap-2 ${
                                        isActive
                                            ? 'bg-[#EFEEEA] text-[#111111]'
                                            : 'hover:bg-[#F7F6F3] text-[#5f5e5b]'
                                    }`}
                                >
                                    <DocumentTextIcon className={`w-3.5 h-3.5 mt-0.5 shrink-0 ${isActive ? 'text-[#111111]' : 'text-[#a8a6a1]'}`} />
                                    <span className="min-w-0">
                                        <span className={`font-mono truncate block ${isActive ? 'font-medium' : ''}`}>{name}</span>
                                        {sizeKB !== null && (
                                            <span className="text-[10px] text-[#a8a6a1] mt-0.5 block" style={{ fontVariantNumeric: 'tabular-nums' }}>{sizeKB} KB</span>
                                        )}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Reader */}
                <div className="lg:col-span-2 rounded-lg bg-white border border-[#EAEAEA] flex flex-col min-h-[62vh] overflow-hidden">
                    {/* Toolbar */}
                    <div className="px-4 py-3 border-b border-[#EAEAEA] bg-[#FBFBFA] space-y-2">
                        <div className="flex flex-col md:flex-row gap-2">
                            <div className="flex-1 flex items-center gap-2 min-w-0">
                                <h3 className="text-sm font-medium text-[#111111] truncate">
                                    {selectedFile
                                        ? <span className="font-mono text-xs">{selectedFile}</span>
                                        : <span className="text-[#787774] font-normal">Chọn một file ở cột bên trái</span>}
                                </h3>
                                {selectedFile && (
                                    <span className="text-xs text-[#787774] whitespace-nowrap" style={{ fontVariantNumeric: 'tabular-nums' }}>
                                        · {searchMode ? `${totalLines} kết quả` : `${totalLines.toLocaleString('vi-VN')} dòng`}
                                    </span>
                                )}
                            </div>
                            <div className="flex gap-2 flex-wrap">
                                {/* Page-size selector */}
                                {selectedFile && !searchMode && (
                                    <select
                                        value={pageSize}
                                        onChange={e => onChangePageSize(parseInt(e.target.value, 10))}
                                        className="px-2 py-1.5 rounded-md bg-white border border-[#EAEAEA] text-xs text-[#2F3437] focus:outline-none focus:border-[#111111] transition-colors duration-200"
                                        title="Số dòng mỗi trang"
                                    >
                                        {PAGE_SIZE_OPTIONS.map(s => (
                                            <option key={s} value={s}>
                                                {formatPageSizeLabel(s)}
                                            </option>
                                        ))}
                                    </select>
                                )}

                                <div className="relative">
                                    <MagnifyingGlassIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#787774]" />
                                    <input
                                        type="text"
                                        value={keyword}
                                        onChange={e => setKeyword(e.target.value)}
                                        onKeyDown={e => { if (e.key === 'Enter') doSearch(); }}
                                        placeholder="Tìm trong file"
                                        className="pl-9 pr-3 py-1.5 rounded-md bg-white border border-[#EAEAEA] text-sm text-[#2F3437] placeholder:text-[#a8a6a1] focus:outline-none focus:border-[#111111] transition-colors duration-200 w-44"
                                    />
                                </div>
                                <button
                                    onClick={doSearch}
                                    disabled={!selectedFile}
                                    className="px-3 py-1.5 rounded-md text-sm font-medium bg-[#111111] text-white hover:bg-[#333333] active:scale-[0.98] disabled:opacity-40 disabled:pointer-events-none transition-all duration-200"
                                >
                                    Tìm
                                </button>
                                {searchMode && (
                                    <button
                                        onClick={() => selectedFile && readFile(selectedFile, 1)}
                                        className="px-3 py-1.5 rounded-md text-sm bg-white border border-[#EAEAEA] text-[#2F3437] hover:bg-[#F7F6F3] transition-colors duration-200"
                                    >
                                        Xem toàn bộ
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Viewer controls: level filter + wrap + copy + bottom */}
                        {selectedFile && lines.length > 0 && (
                            <div className="flex items-center gap-2 flex-wrap">
                                <div className="flex gap-1">
                                    {levelFilterOptions.map(o => (
                                        <button
                                            key={o.key}
                                            onClick={() => setLevelFilter(o.key)}
                                            className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition-all duration-150 ${
                                                levelFilter === o.key
                                                    ? o.activeCls
                                                    : 'bg-white border border-[#EAEAEA] text-[#787774] hover:text-[#111111] hover:bg-[#F7F6F3]'
                                            }`}
                                            style={{ fontVariantNumeric: 'tabular-nums' }}
                                        >
                                            {o.label}
                                        </button>
                                    ))}
                                </div>
                                <div className="ml-auto flex items-center gap-1">
                                    <button
                                        onClick={() => setWrapLines(w => !w)}
                                        className={`p-1.5 rounded-md transition-colors duration-150 ${
                                            wrapLines ? 'bg-[#EFEEEA] text-[#111111]' : 'text-[#787774] hover:text-[#111111] hover:bg-[#F1F0EC]'
                                        }`}
                                        title={wrapLines ? 'Đang wrap dòng dài — bấm để tắt' : 'Bật wrap dòng dài'}
                                    >
                                        <Bars3BottomLeftIcon className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={copyVisible}
                                        className="p-1.5 rounded-md text-[#787774] hover:text-[#111111] hover:bg-[#F1F0EC] transition-colors duration-150"
                                        title="Copy các dòng đang hiển thị"
                                    >
                                        <ClipboardIcon className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={scrollToBottom}
                                        className="p-1.5 rounded-md text-[#787774] hover:text-[#111111] hover:bg-[#F1F0EC] transition-colors duration-150"
                                        title="Cuộn xuống cuối"
                                    >
                                        <ArrowDownIcon className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Log viewer — giữ nền tối kiểu terminal cho dễ đọc log */}
                    <div
                        ref={viewerRef}
                        className="flex-1 overflow-auto bg-[#1c1b1a] p-3 text-xs leading-relaxed font-mono"
                    >
                        {loadingRead && (
                            <div className="space-y-1.5 p-1">
                                {Array.from({ length: 12 }).map((_, i) => (
                                    <div key={i} className="h-3 rounded bg-white/[0.06] animate-pulse" style={{ maxWidth: `${30 + (i * 23) % 65}%` }} />
                                ))}
                            </div>
                        )}
                        {!loadingRead && lines.length === 0 && (
                            <div className="flex flex-col items-center justify-center h-full gap-2 text-center py-16">
                                <DocumentTextIcon className="w-8 h-8 text-white/15" />
                                <p className="text-[#787774] font-sans">
                                    {selectedFile ? 'File trống hoặc không có nội dung' : 'Chọn file để xem nội dung log'}
                                </p>
                            </div>
                        )}
                        {!loadingRead && visibleLines.length === 0 && lines.length > 0 && (
                            <p className="text-[#787774] font-sans p-2">
                                Không có dòng nào ở mức «{levelFilter}» trên trang này.
                            </p>
                        )}
                        {!loadingRead && visibleLines.map(({ text, idx }) => {
                            const level = detectLevel(text);
                            const lineNo = (page - 1) * (searchMode ? 0 : pageSize) + idx + 1;
                            return (
                                <div key={idx} className={`flex gap-3 hover:bg-white/[0.04] rounded-sm px-1 ${wrapLines ? '' : 'w-max min-w-full'}`}>
                                    <span className="text-white/20 select-none shrink-0 text-right w-12" style={{ fontVariantNumeric: 'tabular-nums' }}>
                                        {searchMode ? '•' : lineNo}
                                    </span>
                                    <span className={`${levelColor[level]} ${wrapLines ? 'whitespace-pre-wrap break-all' : 'whitespace-pre'}`}>
                                        <HighlightedLine text={text} keyword={appliedKeyword} />
                                    </span>
                                </div>
                            );
                        })}
                    </div>

                    {/* Pagination */}
                    {!searchMode && selectedFile && (
                        <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 border-t border-[#EAEAEA] bg-[#FBFBFA] text-xs">
                            <span className="text-[#787774]" style={{ fontVariantNumeric: 'tabular-nums' }}>
                                Trang <span className="text-[#111111] font-medium">{page}</span> / {totalPages}
                                {pageSize === VIEW_ALL_PAGE_SIZE && (
                                    <span className="ml-2 px-2 py-0.5 rounded-full bg-[#EDF3EC] text-[#346538] text-[10px] font-medium">
                                        Đang xem toàn bộ file
                                    </span>
                                )}
                            </span>
                            <div className="flex items-center gap-1">
                                <button
                                    disabled={page <= 1 || loadingRead}
                                    onClick={() => goToPage(1)}
                                    className="p-1.5 rounded-md text-[#787774] hover:text-[#111111] hover:bg-[#F1F0EC] disabled:opacity-30 disabled:pointer-events-none transition-colors duration-150"
                                    title="Trang đầu"
                                >
                                    <ChevronDoubleLeftIcon className="w-3.5 h-3.5" />
                                </button>
                                <button
                                    disabled={page <= 1 || loadingRead}
                                    onClick={() => goToPage(page - 1)}
                                    className="p-1.5 rounded-md text-[#787774] hover:text-[#111111] hover:bg-[#F1F0EC] disabled:opacity-30 disabled:pointer-events-none transition-colors duration-150"
                                    title="Trang trước"
                                >
                                    <ChevronLeftIcon className="w-3.5 h-3.5" />
                                </button>

                                {/* Input nhảy trang */}
                                <div className="flex items-center gap-1 mx-1">
                                    <input
                                        type="number"
                                        min={1}
                                        max={totalPages}
                                        value={pageInput}
                                        onChange={e => setPageInput(e.target.value)}
                                        onKeyDown={e => { if (e.key === 'Enter') onPageInputCommit(); }}
                                        onBlur={onPageInputCommit}
                                        className="w-16 text-center px-2 py-1 rounded-md bg-white border border-[#EAEAEA] text-[#2F3437] focus:outline-none focus:border-[#111111] transition-colors duration-200"
                                        title="Nhập số trang rồi Enter để nhảy"
                                        style={{ fontVariantNumeric: 'tabular-nums' }}
                                    />
                                    <span className="text-[#a8a6a1]" style={{ fontVariantNumeric: 'tabular-nums' }}>/ {totalPages}</span>
                                </div>

                                <button
                                    disabled={page >= totalPages || loadingRead}
                                    onClick={() => goToPage(page + 1)}
                                    className="p-1.5 rounded-md text-[#787774] hover:text-[#111111] hover:bg-[#F1F0EC] disabled:opacity-30 disabled:pointer-events-none transition-colors duration-150"
                                    title="Trang sau"
                                >
                                    <ChevronRightIcon className="w-3.5 h-3.5" />
                                </button>
                                <button
                                    disabled={page >= totalPages || loadingRead}
                                    onClick={() => goToPage(totalPages)}
                                    className="p-1.5 rounded-md text-[#787774] hover:text-[#111111] hover:bg-[#F1F0EC] disabled:opacity-30 disabled:pointer-events-none transition-colors duration-150"
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
