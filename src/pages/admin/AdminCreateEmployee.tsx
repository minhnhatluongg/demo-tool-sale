import React, { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import {
    UserPlusIcon,
    MagnifyingGlassIcon,
    NoSymbolIcon,
    CheckCircleIcon,
    ExclamationTriangleIcon,
    ArrowPathIcon,
} from '@heroicons/react/24/outline';

import { Button } from '../../components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';
import { SearchableSelect } from '../../components/ui/searchable-select';

import {
    getHrCatalogs,
    getHrGroups,
    getHrGroupPermissions,
    createHrEmployee,
    asmDepthOfLevelVal,
    HrCatalogs,
    GroupListItem,
    GroupPermissions,
    CreateEmployeeResult,
} from '../../api/hrService';
import { getSalesHierarchy, SalesHierarchyNode } from '../../api/adminService';

/*
 * Tạo nhân viên + tài khoản cho BẤT KỲ vị trí / phòng ban nào.
 *
 * Hai hệ ĐỘC LẬP, phải set cả hai:
 *   1. Cấp trong cây ASM (asmLevel + sếp trực tiếp)  -> quyết định THẤY DỮ LIỆU CỦA AI (tự động)
 *   2. Nhóm quyền (grpCodes từ bosGroup)             -> quyết định LÀM ĐƯỢC GÌ (menu, nút bấm)
 *
 * Lên cấp trong cây ASM KHÔNG tự động cho thêm menu — phải gán nhóm quyền tương ứng.
 */

const CHANNEL_DEFAULT = '21:000';

/** Sếp trực tiếp — phẳng hoá từ cây ASM để đổ vào <select>. */
interface FlatManager {
    id: string;
    name: string;
    levelVal: string;
    depth: number;
    indent: number;
}

/** Preset cho các vị trí hay tạo — bấm 1 phát điền sẵn 3 trường. */
const PRESETS: { label: string; asmLevel: string; psID: string; pcID: string; hint: string }[] = [
    { label: 'NV Kinh doanh / CTV', asmLevel: 'TDV', psID: '00084', pcID: '00000', hint: 'Node lá, không quản ai' },
    { label: 'Trưởng nhóm KD', asmLevel: 'TEAM', psID: '00083', pcID: '00001', hint: 'TeamID = %, quản 1 tổ' },
    { label: 'Nhân viên Kỹ thuật', asmLevel: 'TDV', psID: '00006', pcID: '00000', hint: 'Node lá, quyền theo nhóm KT CKS' },
];

const flattenTree = (nodes: SalesHierarchyNode[], indent = 0, acc: FlatManager[] = []): FlatManager[] => {
    for (const n of nodes || []) {
        acc.push({
            id: n.id,
            name: n.name,
            levelVal: n.level,
            depth: asmDepthOfLevelVal(n.level),
            indent,
        });
        if (n.children?.length) flattenTree(n.children, indent + 1, acc);
    }
    return acc;
};

const selectCls =
    'w-full h-10 px-3 rounded-lg text-sm text-[#111111] bg-white border border-[#E4E7EC] ' +
    'transition-all duration-200 focus:outline-none focus:border-[#111111] focus:ring-2 focus:ring-[#11111114]';

const labelCls = 'block text-xs font-medium text-[#5f5e5b] mb-1.5';

const AdminCreateEmployee: React.FC = () => {
    /* ── Danh mục ── */
    const [catalogs, setCatalogs] = useState<HrCatalogs | null>(null);
    const [managers, setManagers] = useState<FlatManager[]>([]);
    const [groups, setGroups] = useState<GroupListItem[]>([]);
    const [loadingRefs, setLoadingRefs] = useState(true);

    /* ── Form ── */
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [soCMND, setSoCMND] = useState('');

    const [clnID, setClnID] = useState(CHANNEL_DEFAULT);
    const [did, setDid] = useState('');
    const [psID, setPsID] = useState('00084');
    const [pcID, setPcID] = useState('00000');

    const [managerEmplID, setManagerEmplID] = useState('');
    const [asmLevel, setAsmLevel] = useState('TDV');

    const [createAccount, setCreateAccount] = useState(true);
    const [loginName, setLoginName] = useState('');
    const [password, setPassword] = useState('');

    const [grpCodes, setGrpCodes] = useState<string[]>([]);
    const [groupSearch, setGroupSearch] = useState('');

    /* ── Panel xem quyền của nhóm ── */
    const [permGrpCode, setPermGrpCode] = useState<string | null>(null);
    const [perms, setPerms] = useState<GroupPermissions | null>(null);
    const [loadingPerms, setLoadingPerms] = useState(false);

    /* ── Submit ── */
    const [submitting, setSubmitting] = useState(false);
    const [result, setResult] = useState<CreateEmployeeResult | null>(null);

    /* ── Nạp danh mục + cây ASM + nhóm quyền ── */
    useEffect(() => {
        let alive = true;
        (async () => {
            try {
                const [cat, tree, grp] = await Promise.all([
                    getHrCatalogs(),
                    getSalesHierarchy(CHANNEL_DEFAULT, false),
                    getHrGroups(),
                ]);
                if (!alive) return;

                if (cat.success && cat.data) setCatalogs(cat.data);
                else toast.error(cat.message || 'Không tải được danh mục.');

                // getSalesHierarchy trả về envelope không đồng nhất — bóc phòng thủ (như AdminSalesTree)
                const payload: any = (tree as any)?.data ?? tree;
                const nodes: SalesHierarchyNode[] = Array.isArray(payload) ? payload : payload?.data ?? [];
                setManagers(flattenTree(nodes));

                if (grp.success && grp.data) setGroups(grp.data);
            } catch (e: any) {
                if (alive) toast.error(e?.response?.data?.message || 'Không tải được dữ liệu danh mục.');
            } finally {
                if (alive) setLoadingRefs(false);
            }
        })();
        return () => {
            alive = false;
        };
    }, []);

    /* ── Xem quyền của 1 nhóm ── */
    const openPermissions = async (code: string) => {
        setPermGrpCode(code);
        setPerms(null);
        setLoadingPerms(true);
        try {
            const res = await getHrGroupPermissions(code);
            if (res.success && res.data) setPerms(res.data);
            else toast.error(res.message || 'Không tải được quyền của nhóm.');
        } catch (e: any) {
            toast.error(e?.response?.data?.message || 'Không tải được quyền của nhóm.');
        } finally {
            setLoadingPerms(false);
        }
    };

    /* ── Dẫn xuất ── */
    const selectedManager = useMemo(
        () => managers.find(m => m.id === managerEmplID) || null,
        [managers, managerEmplID],
    );

    const targetDepth = useMemo(
        () => catalogs?.asmLevels.find(l => l.code === asmLevel)?.depth ?? 5,
        [catalogs, asmLevel],
    );

    /**
     * Guard client-side (BE cũng chặn lại): cấp cần tạo phải THẤP HƠN cấp của sếp.
     * Ví dụ sếp là SUP (độ sâu 3) thì chỉ tạo được TEAM (4) hoặc TDV (5).
     */
    const levelError = useMemo(() => {
        if (asmLevel === 'MNG') return null;
        if (!selectedManager) return null;
        if (targetDepth <= selectedManager.depth) {
            return `Sếp "${selectedManager.name}" đang ở cấp ${selectedManager.levelVal} (độ sâu ${selectedManager.depth}). ` +
                `Cấp cần tạo phải THẤP HƠN — chọn cấp có độ sâu > ${selectedManager.depth}.`;
        }
        return null;
    }, [asmLevel, targetDepth, selectedManager]);

    const filteredGroups = useMemo(() => {
        const q = groupSearch.trim().toLowerCase();
        if (!q) return groups.slice(0, 60);
        return groups
            .filter(
                g =>
                    g.grpCode.toLowerCase().includes(q) ||
                    (g.postName || '').toLowerCase().includes(q) ||
                    (g.jobsName || '').toLowerCase().includes(q),
            )
            .slice(0, 60);
    }, [groups, groupSearch]);

    const applyPreset = (p: (typeof PRESETS)[number]) => {
        setAsmLevel(p.asmLevel);
        setPsID(p.psID);
        setPcID(p.pcID);
        toast.success(`Đã áp preset: ${p.label}`);
    };

    const toggleGroup = (code: string) => {
        setGrpCodes(prev => (prev.includes(code) ? prev.filter(c => c !== code) : [...prev, code]));
    };

    /* ── Validate + Submit ── */
    const validate = (): string[] => {
        const errs: string[] = [];
        if (!fullName.trim()) errs.push('Vui lòng nhập họ và tên.');
        if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errs.push('Email không hợp lệ.');
        if (asmLevel !== 'MNG' && !managerEmplID) errs.push('Vui lòng chọn sếp trực tiếp.');
        if (levelError) errs.push(levelError);
        if (createAccount) {
            if (loginName.trim().length < 5) errs.push('LoginName tối thiểu 5 ký tự.');
            if (password.length < 6) errs.push('Password tối thiểu 6 ký tự.');
            if (grpCodes.length === 0)
                errs.push('Chưa chọn nhóm quyền — user sẽ đăng nhập được nhưng KHÔNG thấy menu nào.');
        }
        return errs;
    };

    const handleSubmit = async () => {
        const errs = validate();
        if (errs.length) {
            errs.forEach(e => toast.error(e));
            return;
        }

        setSubmitting(true);
        setResult(null);
        try {
            const res = await createHrEmployee({
                fullName: fullName.trim(),
                email: email.trim() || undefined,
                phone: phone.trim() || undefined,
                soCMND: soCMND.trim() || undefined,
                clnID: clnID || undefined,
                did: did || undefined,
                psID: psID || undefined,
                pcID: pcID || undefined,
                managerEmplID: asmLevel === 'MNG' ? undefined : managerEmplID,
                asmLevel,
                createAccount,
                loginName: createAccount ? loginName.trim() : undefined,
                password: createAccount ? password : undefined,
                osLogin: createAccount ? ['WEB'] : undefined,
                systemRights: createAccount ? ['SystemUser', 'SystemLogin_WebApp'] : undefined,
                grpCodes: createAccount ? grpCodes : undefined,
            });

            if (res.success && res.data) {
                setResult(res.data);
                toast.success(res.message || `Đã tạo nhân viên ${res.data.employeeID}.`);
            } else {
                showApiErrors(res.message, res.errors);
            }
        } catch (e: any) {
            const body = e?.response?.data;
            showApiErrors(body?.message, body?.errors);
        } finally {
            setSubmitting(false);
        }
    };

    /**
     * BE trả TẤT CẢ lỗi validate trong mảng `errors`; `message` chỉ là dòng tóm tắt
     * ("Dữ liệu không hợp lệ (4 lỗi)"). Hiện từng lỗi để người dùng sửa một lượt.
     */
    const showApiErrors = (message?: string, errors?: string[] | null) => {
        if (errors?.length) {
            errors.forEach(err => toast.error(err));
            return;
        }
        toast.error(message || 'Tạo nhân viên thất bại.');
    };

    /* ── Render ── */
    return (
        <div className="max-w-6xl mx-auto space-y-5">
            {/* Header */}
            <div>
                <p className="text-[11px] uppercase tracking-[0.12em] text-[#787774]">Nhân sự</p>
                <h1 className="text-xl font-semibold text-[#111111] tracking-tight mt-0.5 flex items-center gap-2">
                    <UserPlusIcon className="w-5 h-5" strokeWidth={1.8} /> Tạo nhân viên
                </h1>
                <p className="text-sm text-[#787774] mt-1">
                    Tạo hồ sơ + vị trí trong cây ASM + tài khoản đăng nhập + nhóm quyền — cho bất kỳ vị trí / phòng ban nào.
                </p>
            </div>

            {/* Preset */}
            <Card>
                <CardHeader>
                    <CardTitle>Chọn nhanh vị trí</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-wrap gap-2">
                        {PRESETS.map(p => (
                            <button
                                key={p.label}
                                onClick={() => applyPreset(p)}
                                className="text-left px-3 py-2 rounded-lg border border-[#E4E7EC] bg-white hover:border-[#111111] transition-colors duration-200"
                            >
                                <p className="text-sm font-medium text-[#111111]">{p.label}</p>
                                <p className="text-[11px] text-[#787774] mt-0.5">{p.hint}</p>
                            </button>
                        ))}
                    </div>
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                {/* ── Cột trái: form ── */}
                <div className="lg:col-span-2 space-y-5">
                    {/* 1. Thông tin cá nhân */}
                    <Card>
                        <CardHeader>
                            <CardTitle>1 · Thông tin cá nhân</CardTitle>
                        </CardHeader>
                        <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <Input
                                label="Họ và tên *"
                                name="fullName"
                                value={fullName}
                                onChange={e => setFullName(e.target.value)}
                                placeholder="Nguyễn Văn A"
                            />
                            <Input
                                label="Email"
                                name="email"
                                type="email"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                placeholder="a@lotviet.com"
                            />
                            <Input
                                label="Điện thoại"
                                name="phone"
                                value={phone}
                                onChange={e => setPhone(e.target.value)}
                                placeholder="0901234567"
                            />
                            <Input
                                label="Số CMND / CCCD"
                                name="soCMND"
                                value={soCMND}
                                onChange={e => setSoCMND(e.target.value)}
                            />
                        </CardContent>
                    </Card>

                    {/* 2. Vị trí tổ chức */}
                    <Card>
                        <CardHeader>
                            <CardTitle>2 · Vị trí tổ chức</CardTitle>
                        </CardHeader>
                        <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className={labelCls}>Kênh</label>
                                <select className={selectCls} value={clnID} onChange={e => setClnID(e.target.value)}>
                                    {(catalogs?.channels || []).map(c => (
                                        <option key={c.code} value={c.code}>
                                            {c.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className={labelCls}>Phòng ban</label>
                                <select className={selectCls} value={did} onChange={e => setDid(e.target.value)}>
                                    <option value="">— Không chọn —</option>
                                    {(catalogs?.departments || []).map(d => (
                                        <option key={d.code} value={d.code}>
                                            {d.code} · {d.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className={labelCls}>Chức danh (PsID)</label>
                                <SearchableSelect
                                    value={psID}
                                    onChange={setPsID}
                                    placeholder="Tìm/chọn chức danh…"
                                    options={(catalogs?.positions || []).map(p => ({
                                        value: p.code,
                                        label: `${p.code} · ${p.name}`,
                                    }))}
                                />
                            </div>

                            <div>
                                <label className={labelCls}>Cấp quản lý (PcID)</label>
                                <select className={selectCls} value={pcID} onChange={e => setPcID(e.target.value)}>
                                    {(catalogs?.positionControls || []).map(p => (
                                        <option key={p.code} value={p.code}>
                                            {p.code} · {p.name || '(không quản ai)'}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </CardContent>
                    </Card>

                    {/* 3. Vị trí trong cây ASM */}
                    <Card>
                        <CardHeader>
                            <CardTitle>3 · Vị trí trong cây ASM</CardTitle>
                            <span className="text-[11px] text-[#787774]">Quyết định “thấy dữ liệu của ai”</span>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className={labelCls}>Sếp trực tiếp {asmLevel !== 'MNG' && '*'}</label>
                                    <SearchableSelect
                                        value={managerEmplID}
                                        onChange={setManagerEmplID}
                                        disabled={asmLevel === 'MNG'}
                                        placeholder="Tìm/chọn sếp theo tên…"
                                        options={managers.map(m => ({
                                            value: m.id,
                                            label: m.name,
                                        }))}
                                    />
                                    {selectedManager && (
                                        <p className="mt-1 text-[11px] text-[#787774]">
                                            Cấp của sếp: <b>{selectedManager.levelVal}</b> (độ sâu {selectedManager.depth})
                                        </p>
                                    )}
                                </div>

                                <div>
                                    <label className={labelCls}>Cấp cần tạo</label>
                                    <select className={selectCls} value={asmLevel} onChange={e => setAsmLevel(e.target.value)}>
                                        {(catalogs?.asmLevels || []).map(l => (
                                            <option
                                                key={l.code}
                                                value={l.code}
                                                disabled={!!selectedManager && l.depth <= selectedManager.depth && l.code !== 'MNG'}
                                            >
                                                {l.name} (độ sâu {l.depth})
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {levelError && (
                                <div className="flex items-start gap-2 px-3 py-2 rounded-lg bg-[#FDEBEC] text-[#9F2F2D]">
                                    <ExclamationTriangleIcon className="w-4 h-4 mt-0.5 flex-shrink-0" />
                                    <p className="text-xs">{levelError}</p>
                                </div>
                            )}

                            <div className="px-3 py-2 rounded-lg bg-[#E1F3FE] text-[#1F6C9F]">
                                <p className="text-xs">
                                    Cấp trong cây ASM chỉ quyết định <b>phạm vi dữ liệu</b> (thấy hợp đồng/doanh số của ai) —
                                    nó <b>không</b> tự cấp thêm menu. Quyền chức năng phải gán ở mục 5.
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    {/* 4. Tài khoản */}
                    <Card>
                        <CardHeader>
                            <CardTitle>4 · Tài khoản đăng nhập</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <label className="flex items-center gap-2 cursor-pointer select-none">
                                <input
                                    type="checkbox"
                                    checked={createAccount}
                                    onChange={e => setCreateAccount(e.target.checked)}
                                    className="w-4 h-4 rounded border-[#E4E7EC] accent-[#111111]"
                                />
                                <span className="text-sm text-[#2F3437]">Tạo tài khoản đăng nhập cho nhân viên này</span>
                            </label>

                            {createAccount && (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <Input
                                        label="Login name *"
                                        name="loginName"
                                        value={loginName}
                                        onChange={e => setLoginName(e.target.value)}
                                        hint="Tối thiểu 5 ký tự. Trùng thì hệ thống tự thêm hậu tố _1, _2…"
                                    />
                                    <Input
                                        label="Mật khẩu *"
                                        name="password"
                                        type="password"
                                        value={password}
                                        onChange={e => setPassword(e.target.value)}
                                        hint="Tối thiểu 6 ký tự."
                                    />
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* 5. Nhóm quyền */}
                    <Card>
                        <CardHeader>
                            <CardTitle>5 · Nhóm quyền</CardTitle>
                            <span className="text-[11px] text-[#787774]">Quyết định “làm được gì”</span>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div className="relative">
                                <MagnifyingGlassIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#B3B2AE]" />
                                <input
                                    value={groupSearch}
                                    onChange={e => setGroupSearch(e.target.value)}
                                    placeholder="Tìm nhóm: mã, chức vụ, chức danh…"
                                    className={`${selectCls} pl-9`}
                                />
                            </div>

                            {grpCodes.length > 0 && (
                                <div className="flex flex-wrap gap-1.5">
                                    {grpCodes.map(c => (
                                        <button
                                            key={c}
                                            onClick={() => toggleGroup(c)}
                                            className="px-2 py-1 rounded-md bg-[#EDF3EC] text-[#346538] text-[11px] font-medium hover:bg-[#e0ecdf] transition-colors"
                                        >
                                            {c} ✕
                                        </button>
                                    ))}
                                </div>
                            )}

                            <div className="border border-[#EAEAEA] rounded-lg divide-y divide-[#F1F0EC] max-h-72 overflow-y-auto">
                                {filteredGroups.map(g => {
                                    const checked = grpCodes.includes(g.grpCode);
                                    return (
                                        <div
                                            key={g.grpCode}
                                            className={`flex items-center gap-3 px-3 py-2 ${checked ? 'bg-[#F7F8FA]' : 'bg-white'}`}
                                        >
                                            <input
                                                type="checkbox"
                                                checked={checked}
                                                onChange={() => toggleGroup(g.grpCode)}
                                                className="w-4 h-4 rounded border-[#E4E7EC] accent-[#111111] flex-shrink-0"
                                            />
                                            <div className="min-w-0 flex-1">
                                                <p className="text-xs font-medium text-[#111111] truncate">
                                                    {g.postName} · {g.jobsName}
                                                </p>
                                                <p className="text-[11px] text-[#787774] truncate">
                                                    {g.grpCode} · {g.levelName} · {g.userCount} user · {g.menuCount} menu
                                                </p>
                                            </div>
                                            <Button size="sm" variant="ghost" onClick={() => openPermissions(g.grpCode)}>
                                                Xem quyền
                                            </Button>
                                        </div>
                                    );
                                })}
                                {filteredGroups.length === 0 && (
                                    <p className="px-3 py-6 text-center text-xs text-[#787774]">Không có nhóm nào khớp.</p>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Submit */}
                    <div className="flex items-center gap-3">
                        <Button size="lg" loading={submitting} disabled={loadingRefs} onClick={handleSubmit}>
                            <UserPlusIcon className="w-4 h-4" /> Tạo nhân viên
                        </Button>
                        {loadingRefs && (
                            <span className="text-xs text-[#787774] flex items-center gap-1.5">
                                <ArrowPathIcon className="w-3.5 h-3.5 animate-spin" /> Đang tải danh mục…
                            </span>
                        )}
                    </div>

                    {/* Kết quả */}
                    {result && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-[#346538]">
                                    <CheckCircleIcon className="w-4 h-4" /> Đã tạo nhân viên {result.employeeID}
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                                    <div>
                                        <p className="text-[#787774]">Mã nhân viên</p>
                                        <p className="font-medium text-[#111111]">{result.employeeID}</p>
                                    </div>
                                    <div>
                                        <p className="text-[#787774]">Cấp ASM</p>
                                        <p className="font-medium text-[#111111]">
                                            {result.asmLevel} (độ sâu {result.asmDepth})
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-[#787774]">Tài khoản</p>
                                        <p className="font-medium text-[#111111]">{result.loginName || '— không tạo —'}</p>
                                    </div>
                                    <div>
                                        <p className="text-[#787774]">Nhóm quyền</p>
                                        <p className="font-medium text-[#111111]">{result.assignedGroups.length}</p>
                                    </div>
                                </div>

                                {/* 5 cột ASM đã ghi — để đối chiếu */}
                                <div className="px-3 py-2 rounded-lg bg-[#F7F8FA] border border-[#EAEAEA]">
                                    <p className="text-[11px] text-[#787774] mb-1">
                                        5 cột ASM đã ghi (<b>%</b> = “chính là cấp này”, <b>*****</b> = cấp khuyết)
                                    </p>
                                    <code className="text-[11px] text-[#2F3437] break-all">
                                        ClnID_Mng={result.asmColumns.clnID_Mng} · MngOffice={result.asmColumns.clnID_MngOffice} ·
                                        ZoneID={result.asmColumns.zoneID} · Sup={result.asmColumns.sup} · TeamID=
                                        {result.asmColumns.teamID}
                                    </code>
                                </div>

                                {result.warnings.length > 0 && (
                                    <div className="px-3 py-2 rounded-lg bg-[#FBF3DB] text-[#956400] space-y-1">
                                        {result.warnings.map((w, i) => (
                                            <p key={i} className="text-xs flex items-start gap-1.5">
                                                <ExclamationTriangleIcon className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" /> {w}
                                            </p>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    )}
                </div>

                {/* ── Cột phải: panel xem quyền ── */}
                <div className="lg:col-span-1">
                    <Card className="sticky top-6">
                        <CardHeader>
                            <CardTitle>Quyền của nhóm</CardTitle>
                            {permGrpCode && <Badge>{permGrpCode}</Badge>}
                        </CardHeader>
                        <CardContent>
                            {!permGrpCode && (
                                <p className="text-xs text-[#787774] py-6 text-center">
                                    Bấm “Xem quyền” ở một nhóm bên trái để xem nhóm đó làm được gì.
                                </p>
                            )}

                            {loadingPerms && (
                                <p className="text-xs text-[#787774] py-6 text-center flex items-center justify-center gap-1.5">
                                    <ArrowPathIcon className="w-3.5 h-3.5 animate-spin" /> Đang tải…
                                </p>
                            )}

                            {perms && !loadingPerms && (
                                <div className="space-y-4 max-h-[70vh] overflow-y-auto">
                                    <div className="flex items-center gap-4 text-xs">
                                        <span className="text-[#787774]">
                                            Menu: <b className="text-[#111111]">{perms.menuCount}</b>
                                        </span>
                                        <span className="text-[#787774]">
                                            Xem dữ liệu:{' '}
                                            <b className="text-[#111111]">
                                                {perms.viewNumb === -1 ? 'không giới hạn' : `${perms.viewNumb} ngày`}
                                            </b>
                                        </span>
                                    </div>

                                    {/* Hành động — TÁCH quyền được cấp vs điều CẤM */}
                                    <div>
                                        <p className="text-[11px] uppercase tracking-[0.1em] text-[#787774] mb-1.5">
                                            Hành động
                                        </p>
                                        <div className="space-y-1">
                                            {perms.actions.filter(a => !a.isRestriction).map(a => (
                                                <p
                                                    key={a.variantID}
                                                    className="text-[11px] text-[#346538] bg-[#EDF3EC] px-2 py-1 rounded flex items-start gap-1.5"
                                                >
                                                    <CheckCircleIcon className="w-3 h-3 mt-0.5 flex-shrink-0" />
                                                    {a.descrip}
                                                </p>
                                            ))}
                                            {/* ⚠️ bit N* = ĐIỀU CẤM, không phải quyền */}
                                            {perms.actions.filter(a => a.isRestriction).map(a => (
                                                <p
                                                    key={a.variantID}
                                                    className="text-[11px] text-[#9F2F2D] bg-[#FDEBEC] px-2 py-1 rounded flex items-start gap-1.5"
                                                >
                                                    <NoSymbolIcon className="w-3 h-3 mt-0.5 flex-shrink-0" />
                                                    {a.descrip}
                                                </p>
                                            ))}
                                            {perms.actions.length === 0 && (
                                                <p className="text-[11px] text-[#787774]">— không có —</p>
                                            )}
                                        </div>
                                    </div>

                                    <div>
                                        <p className="text-[11px] uppercase tracking-[0.1em] text-[#787774] mb-1.5">
                                            Phạm vi dữ liệu
                                        </p>
                                        <div className="space-y-1">
                                            {perms.dataScopes.map(d => (
                                                <p key={d.conditionsID} className="text-[11px] text-[#2F3437]">
                                                    · {d.descrip}
                                                </p>
                                            ))}
                                            {perms.dataScopes.length === 0 && (
                                                <p className="text-[11px] text-[#787774]">— không có —</p>
                                            )}
                                        </div>
                                    </div>

                                    <div>
                                        <p className="text-[11px] uppercase tracking-[0.1em] text-[#787774] mb-1.5">
                                            Menu ({perms.menus.length})
                                        </p>
                                        <div className="space-y-0.5">
                                            {perms.menus.slice(0, 40).map(m => (
                                                <p key={m.menuID} className="text-[11px] text-[#2F3437] truncate">
                                                    <span className="text-[#a8a6a1]">{m.menuID}</span> {m.menuDscpt}
                                                </p>
                                            ))}
                                            {perms.menus.length > 40 && (
                                                <p className="text-[11px] text-[#787774]">
                                                    … và {perms.menus.length - 40} menu nữa
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default AdminCreateEmployee;
