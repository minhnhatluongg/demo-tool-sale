import React, { useState } from "react";
import CompanyInfoLayout from "../components/CompanyInfoLayout";
import api from "../api/apiClient";
import { Dialog } from "@headlessui/react";
import toast, { Toaster } from "react-hot-toast";
import { FullInfoResponse, SelectedProduct } from "../types";

export default function RegisterAccount() {
  const [form, setForm] = useState({ userCode: "", mst: "" });
  const [companyData, setCompanyData] = useState<FullInfoResponse | null>(null);
  const [hasAccount, setHasAccount] = useState<boolean | null>(null);
  const [serverInfo, setServerInfo] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [loadingCheck, setLoadingCheck] = useState(false);
  const [openConfirm, setOpenConfirm] = useState(false);

  const handleDataLoaded = (
    data: FullInfoResponse,
    _selectedProducts: SelectedProduct[],
    _currentRemaining: number
  ) => {
    setCompanyData(data);
  };

  // --- Check tài khoản EVAT ---
  const checkAccount = async () => {
    const mst = form.mst.trim();
    if (!mst) {
      toast.error("Vui lòng nhập mã số thuế để kiểm tra.");
      return;
    }

    setLoadingCheck(true);
    try {
      const res = await api.get("/Win/check-account", {
        params: { mst },
      });
      const data = res.data?.data;
      setHasAccount(res.data.hasAccount);
      setServerInfo(data?.serverName || "");
      if (res.data.hasAccount)
        toast(`KH đã có tài khoản EVAT (${data.serverName})`, {
          icon: "⚠️",
          style: { background: "#FEF3C7", color: "#92400E" },
        });
      else
        toast.success(
          "Khách hàng chưa có tài khoản, có thể cấp TK hoặc tạo đơn."
        );
    } catch (e: any) {
      toast.error(e.response?.data?.message || e.message);
    } finally {
      setLoadingCheck(false);
    }
  };

  // --- Cấp tài khoản ---
  const submitCreateAccount = async () => {
    if (!companyData) {
      toast.error("Vui lòng lấy thông tin công ty trước!");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        CusTax: companyData.cusTax,
        CusName: companyData.sName,
        CusAddress: companyData.address,
        CusEmail: companyData.cusEmail,
        CusTel: companyData.cusTel,
        UserCode: form.userCode,
        CusCMND_ID: companyData.cusCMND_ID,
      };
      const res = await api.post("/odoo/orders/createAccount", payload);
      toast.success(res.data.message || "Cấp tài khoản thành công!");
      setHasAccount(true);
    } catch (e: any) {
      toast.error(e.response?.data?.message || e.message);
    } finally {
      setLoading(false);
    }
  };

  // --- Xác nhận trước khi tạo đơn ---
  const handleConfirmCreateFull = () => {
    if (hasAccount === null) {
      toast.error("Vui lòng kiểm tra tài khoản trước khi tạo đơn!");
      return;
    }
    if (hasAccount === true) {
      toast("Khách hàng đã có tài khoản, không thể tạo đơn mới.", {
        icon: "⚠️",
        style: { background: "#FEF3C7", color: "#92400E" },
      });
      return;
    }
    setOpenConfirm(true);
  };

  // --- Tạo đơn + cấp TK ---
  const submitCreateFull = async () => {
    setOpenConfirm(false);
    if (!companyData) {
      toast.error("Vui lòng lấy thông tin công ty trước!");
      return;
    }

    setLoading(true);
    try {
      // Payload match BE format (camelCase)
      const payload = {
        cusTax: companyData.cusTax,
        cusName: companyData.sName,
        cusAddress: companyData.address,
        cusEmail: companyData.cusEmail,
        cusTel: companyData.cusTel,
        cusFax: companyData.cusFax || "",
        cusWebsite: companyData.cusWebsite || "",
        cusBankNo: companyData.cusBankNumber || "",
        cusBankTitle: companyData.cusBankAddress || "",
        userCode: form.userCode,
        userName: "",
        isOnline: 1,
        cusCMND_ID: companyData.cusCMND_ID || "",
        cusContactName: companyData.cusPeopleSign || "",
        cusPosition_BySign: "Giám Đốc",
        cusLegalValue: "",
        invCusName: "",
        invCusAddress: "",
        invCusPhone: "",
        invCusEmail: "",
        description: "",
        invSample: companyData.invcSample || "1",
        invSign: companyData.invcSign || "AA/24E",
        invFrom: 1,
        invTo: 0,
        products: companyData.selectedProducts
          ? companyData.selectedProducts.map((p: any) => ({
              productCode: p.ProductCode || p.productCode,
              productName: p.ProductName || p.productName,
              qty: p.Qty || p.qty || 1,
              uom: p.Uom || p.uom || "gói",
              price: p.Price || p.price || 0,
              vatRate: "0%",
              vatName: "Không VAT",
            }))
          : [
              {
                productCode: "UN:0044",
                productName: "Gói mua eHĐĐT",
                qty: 1,
                uom: "gói",
                price: 0,
                vatRate: "0%",
                vatName: "Không VAT",
              },
            ],
      };
      const res = await api.post("/odoo/orders/createFull", payload);
      toast.success(`✅ ${res.data.message} (OID: ${res.data.oid})`);
      setHasAccount(true);
    } catch (e: any) {
      toast.error(e.response?.data?.message || e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow space-y-8 relative">
      <Toaster position="top-right" toastOptions={{ duration: 4000 }} />

      {/* Hướng dẫn quy trình */}
      <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-6 rounded">
        <h3 className="text-sm font-semibold text-blue-700 mb-1">
          🔍 Quy trình thao tác:
        </h3>
        <ul className="list-disc list-inside text-xs text-blue-800 space-y-1">
          <li>
            1️⃣ Nhập <strong>MST/CCCD</strong> rồi bấm{" "}
            <strong>"Kiểm tra tài khoản"</strong>.
          </li>
          <li>
            2️⃣ Nếu khách hàng <strong>chưa có tài khoản</strong>:
            <ul className="list-[circle] list-inside ml-5 mt-1 space-y-1">
              <li>👉 Chọn "Cấp tài khoản" để tạo tài khoản EVAT.</li>
              <li>
                👉 Hoặc "Tạo đơn + Cấp TK" để tạo hợp đồng và tài khoản cùng
                lúc.
              </li>
            </ul>
          </li>
          <li>
            3️⃣ Các trường bắt buộc khi tạo đơn / tài khoản:
            <ul className="list-[circle] list-inside ml-5 mt-1 space-y-1">
              <li>
                <code>Mã số thuế / CCCD</code> — xác định khách hàng
              </li>
              <li>
                <code>Mã nhân viên</code> — người tạo đơn / cấp tài khoản
              </li>
              <li>
                <code>Thông tin công ty</code> — từ API GetFullInfoByMst (tự
                động load)
              </li>
            </ul>
          </li>
        </ul>
      </div>

      {/* --- Nhập MST --- */}
      <div className="border border-red-400 p-4 mb-4 bg-red-50 rounded">
        <p className="text-red-600 text-sm font-medium mb-3">
          *MST/CCCD bắt buộc nhập trước khi kiểm tra tài khoản
        </p>
        <div className="flex items-end gap-3">
          <div className="flex-1 max-w-xs">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Mã số thuế / CCCD
            </label>
            <input
              type="text"
              value={form.mst}
              onChange={(e) => setForm({ ...form, mst: e.target.value })}
              placeholder="Nhập MST hoặc CCCD"
              className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            onClick={checkAccount}
            disabled={loadingCheck || !form.mst}
            className="px-5 py-2 bg-indigo-600 text-white rounded-md font-semibold hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {loadingCheck ? "Đang kiểm tra..." : "Kiểm tra tài khoản"}
          </button>
        </div>

        {/* Hiển thị trạng thái tài khoản */}
        {hasAccount !== null && (
          <div className="mt-3">
            {hasAccount ? (
              <div className="bg-yellow-50 border border-yellow-300 rounded p-3">
                <div className="flex items-center gap-2">
                  <span className="text-yellow-600 text-lg">⚠️</span>
                  <div>
                    <p className="text-sm font-semibold text-yellow-800">
                      Khách hàng ĐÃ CÓ tài khoản EVAT
                    </p>
                    {serverInfo && (
                      <p className="text-xs text-yellow-700 mt-1">
                        Server: <strong>{serverInfo}</strong>
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-green-50 border border-green-300 rounded p-3">
                <div className="flex items-center gap-2">
                  <span className="text-green-600 text-lg">✅</span>
                  <p className="text-sm font-semibold text-green-800">
                    Khách hàng CHƯA CÓ tài khoản - Có thể cấp TK hoặc tạo đơn
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* --- Thông tin công ty --- */}
      <CompanyInfoLayout
        loaiCap={0}
        onDataLoaded={handleDataLoaded}
        readonlyProducts={false}
        hideCheckboxes={false}
      />

      {/* --- Mã nhân viên --- */}
      <div className="border-t pt-4">
        <div className="max-w-xs">
          <label className="text-sm font-medium text-gray-700 mb-1 block">
            Mã nhân viên
          </label>
          <input
            type="text"
            value={form.userCode}
            onChange={(e) => setForm({ ...form, userCode: e.target.value })}
            placeholder="Nhập mã NVKD"
            className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* --- Buttons --- */}
      <div className="flex justify-center gap-4 pt-4 border-t">
        <button
          onClick={submitCreateAccount}
          disabled={loading || hasAccount === true || !companyData}
          className="px-6 py-3 bg-blue-600 text-white rounded-md font-semibold hover:bg-blue-700 disabled:bg-gray-400 flex items-center gap-2 shadow-sm transition-transform active:scale-95"
        >
          {loading ? "Đang xử lý..." : "Cấp Tài Khoản"}
        </button>

        <button
          onClick={handleConfirmCreateFull}
          disabled={loading || hasAccount === true || !companyData}
          className="px-6 py-3 bg-green-600 text-white rounded-md font-semibold hover:bg-green-700 disabled:bg-gray-400 flex items-center gap-2 shadow-sm transition-transform active:scale-95"
        >
          {loading ? "Đang xử lý..." : "Tạo đơn + Cấp TK"}
        </button>
      </div>

      {/* --- Popup xác nhận --- */}
      <Dialog
        open={openConfirm}
        onClose={() => setOpenConfirm(false)}
        className="relative z-50"
      >
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="bg-white rounded-lg p-6 max-w-md w-full shadow-lg">
            <Dialog.Title className="text-lg font-semibold text-gray-800">
              Xác nhận tạo đơn + cấp tài khoản
            </Dialog.Title>
            <p className="mt-2 text-sm text-gray-600">
              Hệ thống sẽ tạo hợp đồng mới và cấp tài khoản EVAT cho khách hàng{" "}
              <strong>{companyData?.sName}</strong>.
              <br />
              Bạn có chắc muốn thực hiện không?
            </p>

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setOpenConfirm(false)}
                className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900"
              >
                Hủy
              </button>
              <button
                onClick={submitCreateFull}
                className="px-5 py-2 text-sm font-semibold bg-green-600 text-white rounded-md hover:bg-green-700 shadow"
              >
                Xác nhận
              </button>
            </div>
          </Dialog.Panel>
        </div>
      </Dialog>
    </div>
  );
}
