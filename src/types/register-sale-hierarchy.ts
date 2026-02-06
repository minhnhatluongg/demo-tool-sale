export interface SaleRegistrationModel {
    fullname: string;
    email: string;
    phoneNumber?: string;
    parentID: string;
    isCreateAccount: boolean;
    loginName?: string;
    passWord?: string;
}