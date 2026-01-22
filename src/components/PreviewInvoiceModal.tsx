import React from "react";

interface PreviewInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  xmlContent: string;
  invoiceType: string;
}

export default function PreviewInvoiceModal({
  isOpen,
  onClose,
  xmlContent,
  invoiceType,
}: PreviewInvoiceModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-800">
            Xem trước hóa đơn - {invoiceType}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl leading-none"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto px-6 py-4">
          {xmlContent ? (
            <pre className="bg-gray-50 p-4 rounded text-xs overflow-auto">
              <code>{xmlContent}</code>
            </pre>
          ) : (
            <div className="text-center py-8 text-gray-500">
              Không có dữ liệu để hiển thị
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t bg-gray-50 flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Preview - Dữ liệu mẫu cho kiểm tra
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => {
                const blob = new Blob([xmlContent], { type: "text/xml" });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = `preview_${invoiceType}.xml`;
                a.click();
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Tải XML
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
            >
              Đóng
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

