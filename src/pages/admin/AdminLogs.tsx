import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import {
    DocumentMagnifyingGlassIcon,
    MagnifyingGlassIcon,
    ArrowPathIcon,
} from '@heroicons/react/24/outline';
import {
    adminLogListFiles,
    adminLogReadFile,
    adminLogSearch,
} from '../../api/adminService';

type Category = 'econtract' | 'externalapi' | 'stdout';

const AdminLogs: React.FC = () => {
    const [category, setCategory] = useState<Category>('econtract');
    const [files, setFiles] = useState<any[]>([]);
    const [loadingFiles, setLoadingFiles] = useState(false);

    const [selectedFile, setSelectedFile] = useState<string | null>(null);
    const [lines, setLines] = useState<string[]>([]);
    const [page, setPage] = useState(1);
    const [pageSize] = useState(200);
    const [totalPages, setTotalPages] = useState(1);
    const [totalLines, setTotalLines] = useState(0);
    const [loadingRead, setLoadingRead] = useState(false);

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

    const readFile = async (file: string, p = 1) => {
        setLoadingRead(true);
        setSearchMode(false);
        try {
            const res = await adminLogReadFile({ category, fileName: file, page: p, pageSize });
            const data = res?.data ?? res;
            setLines(data?.lines ?? data?.Lines ?? []);
            setTotalPages(data?.totalPages ?? data?.TotalPages ?? 1);
            setTotalLines(data?.totalLines ?? data?.TotalLines ?? 0);
            setPage(data?.page ?? data?.Page ?? p);
            setSelectedFile(file);
        } catch (e: any) {
            toast.error(e?.response?.data?.message || 'Không đọc được file');
            setLines([]);
        } finally {
            setLoadingRead(false);
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
                maxLines: 500,
            });
            const data = res?.data ?? res;
            setLines(data?.lines ?? []);
            setTotalLines(data?.matchCount ?? data?.lines?.length ?? 0);
            setTotalPages(1);
            setPage(1);
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
                        <h3 className="text-sm font-semibold text-indigo-200">Files</h3>
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
                        {!loadingFiles && files.length === 0 && (
                            <p className="text-xs text-gray-500">Không có file</p>
                        )}
                        {files.map((f: any, i: number) => {
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
                        <div className="flex gap-2">
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
                        <div className="flex items-center justify-between pt-3 text-xs">
                            <span className="text-gray-400">Trang {page}/{totalPages}</span>
                            <div className="flex gap-2">
                                <button
                                    disabled={page <= 1 || loadingRead}
                                    onClick={() => selectedFile && readFile(selectedFile, page - 1)}
                                    className="px-3 py-1 rounded-md bg-white/5 hover:bg-white/10 disabled:opacity-40"
                                >
                                    ← Trước
                                </button>
                                <button
                                    disabled={page >= totalPages || loadingRead}
                                    onClick={() => selectedFile && readFile(selectedFile, page + 1)}
                                    className="px-3 py-1 rounded-md bg-white/5 hover:bg-white/10 disabled:opacity-40"
                                >
                                    Sau →
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
