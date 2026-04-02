import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export type Time = bigint;
export interface ClinicSettings {
    address: string;
    phone: string;
    doctorName: string;
    clinicName: string;
    qualification: string;
}
export interface Medicine {
    id: bigint;
    name: string;
    isActive: boolean;
    potency: string;
    minStockLevel: bigint;
    quantity: bigint;
    category: string;
    unitPrice: bigint;
}
export interface Bill {
    id: bigint;
    paymentStatus: PaymentStatus;
    patientId: bigint;
    isActive: boolean;
    billDate: Time;
    totalAmount: bigint;
    billNumber: string;
    items: string;
    paidAmount: bigint;
}
export interface Visit {
    id: bigint;
    prescription: string;
    patientId: bigint;
    visitDate: Time;
    diagnosis: string;
    isActive: boolean;
    notes: string;
    followUpDate?: Time;
    chiefComplaint: string;
}
export interface UserProfile {
    name: string;
    role: string;
}
export interface Patient {
    id: bigint;
    age: bigint;
    chiefComplaints: string;
    name: string;
    isActive: boolean;
    state: string;
    medicalHistory: string;
    address: string;
    gender: Gender;
    patientCode: string;
    phone: string;
}
export enum Gender {
    other = "other",
    female = "female",
    male = "male"
}
export enum PaymentStatus {
    pending = "pending",
    paid = "paid"
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    addBill(bill: Bill): Promise<bigint>;
    addMedicine(medicine: Medicine): Promise<bigint>;
    addPatient(patient: Patient): Promise<bigint>;
    addVisit(visit: Visit): Promise<bigint>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    deleteBill(id: bigint): Promise<void>;
    deleteMedicine(id: bigint): Promise<void>;
    deletePatient(id: bigint): Promise<void>;
    deleteVisit(id: bigint): Promise<void>;
    getBillsByPatient(patientId: bigint): Promise<Array<Bill>>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getClinicSettings(): Promise<ClinicSettings>;
    getLowStockMedicines(): Promise<Array<Medicine>>;
    getMedicine(id: bigint): Promise<Medicine>;
    getPatient(id: bigint): Promise<Patient>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    getVisitsByPatient(patientId: bigint): Promise<Array<Visit>>;
    initSampleData(): Promise<void>;
    isCallerAdmin(): Promise<boolean>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    searchPatients(searchTerm: string): Promise<Array<Patient>>;
    updateBill(id: bigint, bill: Bill): Promise<void>;
    updateClinicSettings(settings: ClinicSettings): Promise<void>;
    updateMedicine(id: bigint, medicine: Medicine): Promise<void>;
    updatePatient(id: bigint, patient: Patient): Promise<void>;
    updateVisit(id: bigint, visit: Visit): Promise<void>;
}
