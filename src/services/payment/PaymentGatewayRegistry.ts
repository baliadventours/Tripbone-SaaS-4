import { PaymentGateway } from './PaymentGateway';
import { StripeGateway } from './providers/StripeGateway';
import { XenditGateway } from './providers/XenditGateway';
import { RazorpayGateway } from './providers/RazorpayGateway';
import { AdyenGateway } from './providers/AdyenGateway';
import { PaypalGateway } from './providers/PaypalGateway';
import { MidtransGateway } from './providers/MidtransGateway';
import { WiseGateway } from './providers/WiseGateway';
import { BankTransferGateway } from './providers/BankTransferGateway';
import { PayOnArrivalGateway } from './providers/PayOnArrivalGateway';
import { PaymentGatewayError, PaymentErrorCode } from './errors';

export class PaymentGatewayRegistry {
  private static instance: PaymentGatewayRegistry;
  private gateways: Map<string, PaymentGateway> = new Map();

  private constructor() {
    // Register built-in payment providers
    this.registerGateway(new StripeGateway());
    this.registerGateway(new XenditGateway());
    this.registerGateway(new RazorpayGateway());
    this.registerGateway(new AdyenGateway());
    this.registerGateway(new PaypalGateway());
    this.registerGateway(new MidtransGateway());
    this.registerGateway(new WiseGateway());
    this.registerGateway(new BankTransferGateway());
    this.registerGateway(new PayOnArrivalGateway());
  }

  public static getInstance(): PaymentGatewayRegistry {
    if (!PaymentGatewayRegistry.instance) {
      PaymentGatewayRegistry.instance = new PaymentGatewayRegistry();
    }
    return PaymentGatewayRegistry.instance;
  }

  /**
   * Register a new payment gateway provider.
   * Enables seamless addition of future providers (DOKU, Airwallex, Mollie, Checkout.com, etc.)
   * without altering the booking engine.
   */
  public registerGateway(gateway: PaymentGateway): void {
    this.gateways.set(gateway.providerId.toLowerCase(), gateway);
  }

  /**
   * Retrieves a registered gateway instance by provider ID.
   */
  public getGateway(providerId: string): PaymentGateway {
    const gateway = this.gateways.get(providerId.toLowerCase());
    if (!gateway) {
      throw new PaymentGatewayError(
        PaymentErrorCode.CONFIG_MISSING,
        providerId,
        `Payment provider '${providerId}' is not registered.`
      );
    }
    return gateway;
  }

  /**
   * Returns list of all registered payment gateways.
   */
  public getAllGateways(): PaymentGateway[] {
    return Array.from(this.gateways.values());
  }

  /**
   * Checks if a gateway is registered.
   */
  public hasGateway(providerId: string): boolean {
    return this.gateways.has(providerId.toLowerCase());
  }
}
