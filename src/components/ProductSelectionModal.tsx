import React, { useState, useEffect } from "react";
import api from "../api/apiClient";
import { Product, SelectedProduct } from "../types";
import { useTheme } from "../contexts/ThemeContext";

interface ProductSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (products: SelectedProduct[]) => void;
  customerType?: string;
}

export default function ProductSelectionModal({
  isOpen,
  onClose,
  onConfirm,
}: ProductSelectionModalProps) {
  const { isDark } = useTheme(); // Use Theme Hook
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<Map<string, SelectedProduct>>(new Map());
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    if (isOpen) {
      loadProducts();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const loadProducts = async () => {
    setLoading(true);
    try {
      const res = await api.get("/odoo/orders/get-products", {
        params: {
          ClnID: "",
          ZoneID: "",
          RegionID: "",
          ASM: "",
          SUB: "",
          TEAM: "",
          CustomerID: "",
          MembType: "",
          onlyTVAN: 0,
        },
      });
      console.log("Products API response:", res);
      console.log("Response data:", res.data);

      if (res.data) {
        if (res.data.success && res.data.data && Array.isArray(res.data.data)) {
          // Format: {success: true, data: [...]}
          console.log("Loading products from data.data:", res.data.data.length);
          setProducts(res.data.data);
        } else if (Array.isArray(res.data)) {
          // Format: [...]
          console.log("Loading products from direct array:", res.data.length);
          setProducts(res.data);
        } else {
          console.warn("Unexpected response format:", res.data);
        }
      } else {
        console.warn("No data in response");
      }
    } catch (e: any) {
      console.error("Error loading products:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleProduct = (product: Product) => {
    const newSelected = new Map(selectedProducts);
    if (newSelected.has(product.itemID)) {
      newSelected.delete(product.itemID);
    } else {
      // Quantity = số lượng gói mua (mặc định 1)
      console.log("Selected product:", product);
      console.log("Product itemPrice:", product.itemPrice);
      newSelected.set(product.itemID, {
        ...product,
        Quantity: 1, // Mặc định mua 1 gói
        TotalAmount: (product.itemPrice || 0) * 1,
      });
    }
    setSelectedProducts(newSelected);
  };

  const handleQuantityChange = (itemId: string, quantity: number) => {
    const newSelected = new Map(selectedProducts);
    const product = newSelected.get(itemId);
    if (product) {
      // Quantity là số gói mua, không phải số tờ hóa đơn
      product.Quantity = quantity;
      product.TotalAmount = (product.itemPrice || 0) * quantity;
      newSelected.set(itemId, product);
      setSelectedProducts(newSelected);
    }
  };

  const handleConfirm = () => {
    onConfirm(Array.from(selectedProducts.values()));
    onClose();
  };

  const filteredProducts = products.filter(
    (p) =>
      (p.itemID?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
      (p.itemName?.toLowerCase() || "").includes(searchTerm.toLowerCase())
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className={`w-full max-w-5xl max-h-[90vh] flex flex-col rounded-xl shadow-2xl transition-colors duration-200 ${isDark ? "bg-slate-800 border border-slate-700" : "bg-white"
        }`}>
        {/* Header */}
        <div className={`px-6 py-4 border-b flex items-center justify-between ${isDark ? "border-slate-700" : "border-gray-200"
          }`}>
          <h2 className={`text-xl font-bold ${isDark ? "text-white" : "text-gray-800"
            }`}>Danh sách sản phẩm</h2>
          <button
            onClick={onClose}
            className={`p-2 rounded-lg transition-colors leading-none text-2xl ${isDark
                ? "text-gray-400 hover:text-white hover:bg-slate-700"
                : "text-gray-500 hover:text-gray-700 hover:bg-gray-100"
              }`}
          >
            ×
          </button>
        </div>

        {/* Search */}
        <div className={`px-6 py-3 border-b ${isDark ? "bg-slate-800 border-slate-700" : "bg-gray-50 border-gray-200"
          }`}>
          <div className="flex gap-3">
            <input
              type="text"
              placeholder="Tìm kiếm theo mã gói hoặc tên gói..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`flex-1 border rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${isDark
                  ? "bg-slate-700 border-slate-600 text-white placeholder-gray-400"
                  : "bg-white border-gray-300 text-gray-900 placeholder-gray-500"
                }`}
            />
            <button
              onClick={loadProducts}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium transition-colors"
            >
              Tìm kiếm
            </button>
            <button
              onClick={() => setSearchTerm("")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${isDark
                  ? "bg-slate-700 text-gray-300 hover:bg-slate-600"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                }`}
            >
              Làm mới
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="flex-1 overflow-auto px-6 py-4">
          {loading ? (
            <div className={`text-center py-12 ${isDark ? "text-gray-400" : "text-gray-500"}`}>
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-500 border-t-transparent mb-2"></div>
              <p>Đang tải...</p>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className={`text-center py-12 ${isDark ? "text-gray-400" : "text-gray-500"}`}>
              Không có sản phẩm nào
            </div>
          ) : (
            <div className={`border rounded-lg overflow-hidden ${isDark ? "border-slate-700" : "border-gray-200"
              }`}>
              <table className="w-full border-collapse">
                <thead className={`sticky top-0 z-10 ${isDark ? "bg-slate-900/90" : "bg-gray-100"
                  }`}>
                  <tr>
                    <th className={`p-3 text-left text-sm font-semibold border-b w-12 ${isDark ? "border-slate-700 text-gray-300" : "border-gray-200 text-gray-700"
                      }`}>
                      <input
                        type="checkbox"
                        checked={selectedProducts.size === filteredProducts.length && filteredProducts.length > 0}
                        onChange={() => {
                          const newSelected = new Map(selectedProducts);
                          if (selectedProducts.size === filteredProducts.length) {
                            // Unselect all
                            filteredProducts.forEach(p => newSelected.delete(p.itemID));
                          } else {
                            // Select all với Quantity = 1 (số gói mua)
                            filteredProducts.forEach(p => {
                              if (!newSelected.has(p.itemID)) {
                                newSelected.set(p.itemID, {
                                  ...p,
                                  Quantity: 1, // Mặc định mua 1 gói
                                  TotalAmount: p.itemPrice * 1,
                                });
                              }
                            });
                          }
                          setSelectedProducts(newSelected);
                        }}
                        className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    </th>
                    <th className={`p-3 text-left text-sm font-semibold border-b w-28 ${isDark ? "border-slate-700 text-gray-300" : "border-gray-200 text-gray-700"
                      }`}>Mã gói</th>
                    <th className={`p-3 text-left text-sm font-semibold border-b w-20 ${isDark ? "border-slate-700 text-gray-300" : "border-gray-200 text-gray-700"
                      }`}>Đơn vị</th>
                    <th className={`p-3 text-left text-sm font-semibold border-b ${isDark ? "border-slate-700 text-gray-300" : "border-gray-200 text-gray-700"
                      }`}>Tên gói</th>
                    <th className={`p-3 text-center text-sm font-semibold border-b w-28 ${isDark ? "border-slate-700 text-gray-300" : "border-gray-200 text-gray-700"
                      }`}>Tờ hóa đơn</th>
                    <th className={`p-3 text-center text-sm font-semibold border-b w-24 ${isDark ? "border-slate-700 text-gray-300" : "border-gray-200 text-gray-700"
                      }`}>Số lượng</th>
                    <th className={`p-3 text-right text-sm font-semibold border-b w-36 ${isDark ? "border-slate-700 text-gray-300" : "border-gray-200 text-gray-700"
                      }`}>Thành tiền</th>
                    <th className={`p-3 text-center text-sm font-semibold border-b w-24 ${isDark ? "border-slate-700 text-gray-300" : "border-gray-200 text-gray-700"
                      }`}>VAT</th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${isDark ? "divide-slate-700" : "divide-gray-200"}`}>
                  {filteredProducts.map((product) => {
                    const isSelected = selectedProducts.has(product.itemID);
                    const selectedProduct = selectedProducts.get(product.itemID);

                    const rowClass = isSelected
                      ? (isDark ? "bg-blue-900/20" : "bg-blue-50")
                      : (isDark ? "hover:bg-slate-700/50" : "hover:bg-gray-50");

                    const textClass = isDark ? "text-gray-300" : "text-gray-700";
                    const borderClass = isDark ? "border-slate-700" : "border-gray-200";

                    return (
                      <tr key={product.itemID} className={`${rowClass} transition-colors`}>
                        <td className={`p-3 text-center`}>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleToggleProduct(product)}
                            className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                        </td>
                        <td className={`p-3 text-sm ${textClass}`}>{product.itemID}</td>
                        <td className={`p-3 text-sm ${textClass}`}>{product.itemUnitName || "Gói"}</td>
                        <td className={`p-3 text-sm ${textClass}`}>{product.itemName}</td>
                        {/* Cột Tờ hóa đơn - read only */}
                        <td className={`p-3 text-center text-sm ${textClass}`}>
                          {product.itemPerBox?.toLocaleString()}
                        </td>
                        {/* Cột Số lượng mua - có thể chỉnh sửa */}
                        <td className={`p-3 text-center`}>
                          {isSelected ? (
                            <input
                              type="number"
                              min="1"
                              value={selectedProduct?.Quantity || 1}
                              onChange={(e) =>
                                handleQuantityChange(product.itemID, parseInt(e.target.value) || 1)
                              }
                              className={`w-20 border rounded px-2 py-1 text-sm text-center focus:outline-none focus:ring-1 focus:ring-blue-500 ${isDark
                                  ? "bg-slate-700 border-slate-600 text-white"
                                  : "bg-white border-gray-300 text-gray-900"
                                }`}
                            />
                          ) : (
                            <span className={`text-sm ${isDark ? "text-gray-500" : "text-gray-500"}`}>1</span>
                          )}
                        </td>
                        <td className={`p-3 text-right text-sm font-medium ${isDark ? "text-blue-400" : "text-blue-600"
                          }`}>
                          {isSelected
                            ? (selectedProduct?.TotalAmount || 0).toLocaleString()
                            : (product.itemPrice || 0).toLocaleString()} đ
                        </td>
                        <td className={`p-3 text-center text-sm ${textClass}`}>-</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className={`px-6 py-4 border-t flex items-center justify-between ${isDark ? "bg-slate-800 border-slate-700" : "bg-gray-50 border-gray-200"
          }`}>
          <div className={`text-sm space-x-4 ${isDark ? "text-gray-400" : "text-gray-600"}`}>
            <span>Đã chọn: <strong className={isDark ? "text-white" : "text-gray-900"}>{selectedProducts.size}</strong> sản phẩm</span>
            <span>Tổng HĐ: <strong className="text-blue-500">{Array.from(selectedProducts.values()).reduce((sum, product) => sum + (product.itemPerBox * product.Quantity), 0).toLocaleString()}</strong> tờ</span>
            <span>Tổng tiền: <strong className={isDark ? "text-white" : "text-gray-900"}>{Array.from(selectedProducts.values()).reduce((sum, product) => sum + (product.TotalAmount || 0), 0).toLocaleString()}</strong> VNĐ</span>
          </div>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className={`px-6 py-2 rounded-lg text-sm font-medium transition-colors ${isDark
                  ? "bg-slate-700 text-gray-300 hover:bg-slate-600"
                  : "bg-gray-300 text-gray-700 hover:bg-gray-400"
                }`}
            >
              Hủy
            </button>
            <button
              onClick={handleConfirm}
              disabled={selectedProducts.size === 0}
              className={`px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg`}
            >
              Xác nhận
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

