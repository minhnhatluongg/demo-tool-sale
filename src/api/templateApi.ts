import api from "./apiClient";

export interface Template {
  templateID: number;
  templateCode: string;
  templateName: string;
  invoiceType: string;
  previewImage?: string;
  displayOrder: number;
}

export interface TemplateListResponse {
  success: boolean;
  data: Template[];
  total: number;
}

export const templateApi = {
  /**
   * Lấy danh sách mẫu hóa đơn
   * @param invoiceType - Filter theo loại (VAT, VCNB, CTT, DTS, ...)
   */
  async getTemplates(invoiceType?: string): Promise<Template[]> {
    try {
      const response = await api.get<TemplateListResponse>("/api/invoice/templates", {
        params: { invoiceType }
      });
      return response.data.data || [];
    } catch (error) {
      console.error("Error fetching templates:", error);
      throw error;
    }
  },

  /**
   * Preview hóa đơn
   */
  async previewInvoice(request: any) {
    const response = await api.post("/api/invoice/preview", request);
    return response.data;
  },

  /**
   * Phát hành mẫu hóa đơn
   */
  async publishInvoice(request: any) {
    const response = await api.post("/api/invoice/publish", request);
    return response.data;
  }
};

