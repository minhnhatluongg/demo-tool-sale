// API Response Types
export interface ContractRange {
  oid: string;
  invcSample: string;
  invcSign: string;
  invcFrm: number;
  invcEnd: number;
  crt_User: string;
}

export interface Sample {
  sampleID: string;
  sampleCode: string;
  govSampleSign: string;
  govInvcSign: string;
  invcRemn: number;
}

export interface Product {
  itemID: string;
  itemName: string;
  itemUnit?: string;
  itemUnitName: string;
  itemPerBox: number;
  invcFrm?: number;
  invcEnd?: number;
  itemPrice: number;
}

export interface FullInfoResponse {
  cusTax: string;
  cusCMND_ID: string | null;
  cusEmail: string;
  cusTel: string;
  cusBankNumber: string;
  cusBankAddress: string;
  cusFax: string;
  cusWebsite: string;
  sName: string;
  address: string;
  merchantID: string;
  oid: string | null;
  invcSample: string | null;
  invcSign: string | null;
  oDate?: string;
  cusDes?: string;
  CusContactName?: string;
  cusPeopleSign?: string; // Đại diện công ty (backend trả về field này)
  cusPosition?: string; // Chức vụ người đại diện
  isToKhai?: boolean; // Tờ khai đã được duyệt hay chưa
  contractRange?: ContractRange | null;
  samples: Sample[];
  products: Product[];
  selectedProducts?: SelectedProduct[];
}

export interface SelectedProduct extends Product {
  Quantity: number;
  TotalAmount: number;
}

export interface OIDInfo {
  oid: string;
  cusTax: string;
  cusCMND_ID: string;
  createdAt: string;
  invcSample: string;
  invcSign: string;
}

export interface ContractOptions {
  oid : string,
  label : string,
  invcFrm : number,
  invcEnd : number,
  invcSample : string,
  invcSign : string;
}

// Contract Renewal Types
export interface RenewContractProduct {
  ItemID: string;
  ItemName: string;
  ItemUnit?: string;
  ItemUnitName: string;
  ItemPrice: number;
  ItemQtty: number;
  VAT_Rate: number;
  Sum_Amnt: number;
  ItemPerBox: number;
  InvcSample?: string;
  InvcSign?: string;
  InvcFrm?: number;
  InvcEnd?: number;
}

export interface RenewContractRequest {
  CusName: string;
  CusAddress: string;
  CusTax: string;
  CusCMND_ID: string;
  CusTel: string;
  CusEmail: string;
  CusPeopleSign: string;
  CusPositionBySign: string;
  CusBankNumber: string;
  CusBankAddress: string;
  CusFax: string;
  CusWebsite: string;
  DescriptCus: string;
  SampleID: string;
  OIDContract: string;
  DateBusLicence: string;
  RefeContractDate: string;
  SaleEmID: string;
  InvcSample: string;
  InvcSign: string;
  InvFrom: number;
  InvTo: number;
  InvcRemn: number; // Số HD còn lại hiện tại
  CmpnTax: string;
  Products: RenewContractProduct[];
}

export interface RenewContractResponse {
  success: boolean;
  message: string;
  newOID?: string;
  jobOid?: string;
  traceId: string;
}

export interface ContractInfo {
  oid: string;
  cusName: string;
  cusTax: string;
  cusAddress: string;
  oDate: string;
  invcSample: string;
  invcSign: string;
  invcRemn: number;
}

