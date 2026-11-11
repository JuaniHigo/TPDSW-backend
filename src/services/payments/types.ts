export type PaymentProvider = 'demo' | 'mercadopago';
interface PaymentDetails {
  id: string;
  status: string;
  externalReference: string;
  amount: string;
  currency: string;
}
export type ProviderPayment = PaymentDetails &
  (
    | { provider: 'demo' }
    | { provider: 'mercadopago'; collectorId: string; liveMode: boolean }
  );
export interface PreferenceInput {
  compraId: number;
  quantity: number;
  price: string;
  expiresAt: Date;
}
export interface PaymentGateway {
  createPreference(
    input: PreferenceInput,
  ): Promise<{ id: string; url: string }>;
  getPayment(id: string): Promise<ProviderPayment>;
  searchPayments(compraId: number): Promise<ProviderPayment[]>;
  refund(id: string, key: string): Promise<void>;
}
