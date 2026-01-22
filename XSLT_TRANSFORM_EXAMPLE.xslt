<?xml version="1.0" encoding="UTF-8"?>
<!-- File: Templates/invoice_default.xslt -->
<!-- XSLT để transform XML hóa đơn thành HTML đẹp -->

<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
    <xsl:output method="html" encoding="UTF-8" indent="yes"/>
    
    <xsl:template match="/">
        <html>
            <head>
                <meta charset="UTF-8"/>
                <title>Hóa Đơn Điện Tử</title>
                <style>
                    body {
                        font-family: 'Times New Roman', Times, serif;
                        max-width: 800px;
                        margin: 20px auto;
                        padding: 20px;
                        background: #fff;
                    }
                    .invoice-header {
                        text-align: center;
                        border-bottom: 2px solid #000;
                        padding-bottom: 20px;
                        margin-bottom: 20px;
                    }
                    .invoice-title {
                        font-size: 24px;
                        font-weight: bold;
                        color: #d32f2f;
                        margin: 10px 0;
                    }
                    .invoice-info {
                        display: grid;
                        grid-template-columns: 1fr 1fr;
                        gap: 20px;
                        margin: 20px 0;
                    }
                    .info-section {
                        border: 1px solid #ccc;
                        padding: 15px;
                        border-radius: 5px;
                    }
                    .info-title {
                        font-weight: bold;
                        font-size: 16px;
                        margin-bottom: 10px;
                        color: #1976d2;
                    }
                    .info-row {
                        margin: 5px 0;
                        font-size: 14px;
                    }
                    .label {
                        font-weight: bold;
                        display: inline-block;
                        width: 150px;
                    }
                    .preview-badge {
                        background: #ff9800;
                        color: white;
                        padding: 5px 15px;
                        border-radius: 20px;
                        font-size: 12px;
                        display: inline-block;
                        margin: 10px 0;
                    }
                    .footer {
                        margin-top: 30px;
                        text-align: center;
                        font-size: 12px;
                        color: #666;
                        border-top: 1px solid #ccc;
                        padding-top: 15px;
                    }
                </style>
            </head>
            <body>
                <div class="invoice-header">
                    <div class="preview-badge">🔍 XEM TRƯỚC - PREVIEW</div>
                    <div class="invoice-title">
                        <xsl:value-of select="//invoiceName"/>
                    </div>
                    <div>
                        Mẫu số: <strong><xsl:value-of select="//templateCode"/></strong> | 
                        Ký hiệu: <strong><xsl:value-of select="//invoiceSeries"/></strong>
                    </div>
                    <div>
                        Số hóa đơn: <strong><xsl:value-of select="//invoiceNumber"/></strong>
                    </div>
                </div>

                <div class="invoice-info">
                    <!-- Seller Info -->
                    <div class="info-section">
                        <div class="info-title">🏢 Đơn vị bán hàng</div>
                        <div class="info-row">
                            <span class="label">Tên đơn vị:</span>
                            <xsl:value-of select="//sellerLegalName"/>
                        </div>
                        <div class="info-row">
                            <span class="label">Mã số thuế:</span>
                            <xsl:value-of select="//sellerTaxCode"/>
                        </div>
                        <div class="info-row">
                            <span class="label">Địa chỉ:</span>
                            <xsl:value-of select="//sellerAddressLine"/>
                        </div>
                        <div class="info-row">
                            <span class="label">Điện thoại:</span>
                            <xsl:value-of select="//sellerPhoneNumber"/>
                        </div>
                        <div class="info-row">
                            <span class="label">Email:</span>
                            <xsl:value-of select="//sellerEmail"/>
                        </div>
                        <div class="info-row">
                            <span class="label">Số TK:</span>
                            <xsl:value-of select="//sellerBankAccount"/>
                        </div>
                        <div class="info-row">
                            <span class="label">Ngân hàng:</span>
                            <xsl:value-of select="//sellerBankName"/>
                        </div>
                    </div>

                    <!-- Buyer Info -->
                    <div class="info-section">
                        <div class="info-title">👤 Đơn vị mua hàng</div>
                        <div class="info-row">
                            <span class="label">Tên đơn vị:</span>
                            <xsl:value-of select="//buyerLegalName"/>
                            <xsl:if test="not(//buyerLegalName) or //buyerLegalName=''">
                                <em style="color: #999;">(Trống)</em>
                            </xsl:if>
                        </div>
                        <div class="info-row">
                            <span class="label">Mã số thuế:</span>
                            <xsl:value-of select="//buyerTaxCode"/>
                            <xsl:if test="not(//buyerTaxCode) or //buyerTaxCode=''">
                                <em style="color: #999;">(Trống)</em>
                            </xsl:if>
                        </div>
                        <div class="info-row">
                            <span class="label">Địa chỉ:</span>
                            <xsl:value-of select="//buyerAddressLine"/>
                            <xsl:if test="not(//buyerAddressLine) or //buyerAddressLine=''">
                                <em style="color: #999;">(Trống)</em>
                            </xsl:if>
                        </div>
                    </div>
                </div>

                <div class="footer">
                    <p>⚠️ Đây là bản xem trước (Preview) - Không có giá trị pháp lý</p>
                    <p>Dữ liệu mẫu phục vụ kiểm tra template</p>
                </div>
            </body>
        </html>
    </xsl:template>
</xsl:stylesheet>

