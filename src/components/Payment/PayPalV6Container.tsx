import React, { useEffect, useState, useRef } from 'react';
import { AlertCircle, CheckCircle2, Loader2, ShieldCheck } from 'lucide-react';
import { PayPalScriptProvider, PayPalButtons } from '@paypal/react-paypal-js';
import axios from 'axios';
import {
  initPayPalV6Instance,
  fetchPayPalV6ClientToken,
  createPayPalOrderOnServer,
  capturePayPalOrderOnServer,
  PayPalV6Instance,
} from '../../services/payment/providers/paypalV6';

interface PayPalV6ContainerProps {
  tenantId: string;
  clientId: string;
  sandboxClientId?: string;
  mode: 'live' | 'sandbox';
  amount: number;
  currency: string;
  description: string;
  bookingId?: string;
  agreedToTerms: boolean;
  onSuccess: (orderId: string, captureId?: string) => Promise<void> | void;
  onError: (errorMsg: string) => void;
}

export const PayPalV6Container: React.FC<PayPalV6ContainerProps> = ({
  tenantId,
  clientId,
  sandboxClientId,
  mode,
  amount,
  currency,
  description,
  bookingId,
  agreedToTerms,
  onSuccess,
  onError,
}) => {
  const [v6Supported, setV6Supported] = useState<boolean | null>(null);
  const [sdkInstance, setSdkInstance] = useState<PayPalV6Instance | null>(null);
  const [eligibleMethods, setEligibleMethods] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [processing, setProcessing] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const activeClientId = (mode === 'live' ? clientId : (sandboxClientId || clientId))?.trim();

  // 1. Initialize PayPal v6 SDK
  useEffect(() => {
    let isMounted = true;

    async function setupV6() {
      if (!activeClientId) {
        if (isMounted) setLoading(false);
        return;
      }

      setLoading(true);
      setErrorMessage(null);

      try {
        // Attempt to fetch server client token
        const clientToken = await fetchPayPalV6ClientToken(tenantId);

        const instance = await initPayPalV6Instance({
          clientId: activeClientId,
          clientToken: clientToken || undefined,
          mode,
          currency,
          pageType: 'checkout',
          components: ['paypal-payments', 'paypal-messages'],
        });

        if (!isMounted) return;

        if (instance) {
          setSdkInstance(instance);
          setV6Supported(true);

          // Check payment eligibility
          try {
            const eligibility = await instance.findEligibleMethods();
            const eligibleList: string[] = [];
            if (eligibility.isEligible('paypal')) eligibleList.push('paypal');
            if (eligibility.isEligible('paylater')) eligibleList.push('paylater');
            if (eligibility.isEligible('venmo')) eligibleList.push('venmo');
            if (isMounted) {
              setEligibleMethods(eligibleList.length > 0 ? eligibleList : ['paypal']);
            }
          } catch (eligErr) {
            console.warn('[PayPal v6] Eligibility check note:', eligErr);
            if (isMounted) setEligibleMethods(['paypal']);
          }
        } else {
          if (isMounted) setV6Supported(false);
        }
      } catch (err: any) {
        console.warn('[PayPal v6 Setup Note - Falling back to Standard PayPal Buttons]:', err?.message || err);
        if (isMounted) {
          setV6Supported(false);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    setupV6();

    return () => {
      isMounted = false;
    };
  }, [activeClientId, mode, currency, tenantId]);

  // Handle PayPal v6 One-Time Payment Session Trigger
  const handleV6Click = async () => {
    if (!agreedToTerms) {
      setErrorMessage('Please accept the Terms & Conditions before proceeding.');
      return;
    }

    setProcessing(true);
    setErrorMessage(null);

    try {
      // 1. Create order on server
      const { orderId } = await createPayPalOrderOnServer({
        tenantId,
        amount,
        currency,
        description,
        bookingId,
      });

      if (!orderId) {
        throw new Error('Could not generate PayPal Order ID.');
      }

      // 2. If v6 createPayPalOneTimePaymentSession is available
      if (sdkInstance?.createPayPalOneTimePaymentSession) {
        const session = await sdkInstance.createPayPalOneTimePaymentSession({
          onApprove: async (data) => {
            try {
              const approvedOrderId = data.orderID || orderId;
              const captureRes = await capturePayPalOrderOnServer({
                tenantId,
                orderId: approvedOrderId,
              });
              await onSuccess(approvedOrderId, captureRes.captureId);
            } catch (capErr: any) {
              console.error('PayPal capture error:', capErr);
              setErrorMessage('Payment capture encountered an issue. Our team is verifying your payment.');
            } finally {
              setProcessing(false);
            }
          },
          onCancel: () => {
            setProcessing(false);
          },
          onError: (err: any) => {
            console.error('PayPal Session Error:', err);
            const errStr = String(err?.message || err || '');
            if (errStr.includes('PAYEE_ACCOUNT_RESTRICTED') || errStr.includes('restricted')) {
              setErrorMessage('The merchant PayPal account is currently restricted. Please choose another payment method.');
            } else {
              setErrorMessage('PayPal encountered an issue. Please try another payment method.');
            }
            setProcessing(false);
          },
        });

        await session.start({ orderId });
      } else {
        // Fallback to standard flow
        setV6Supported(false);
      }
    } catch (err: any) {
      console.error('PayPal v6 Checkout error:', err);
      const msg = err.response?.data?.error || err.message || 'Payment initiation failed.';
      setErrorMessage(msg);
      onError(msg);
      setProcessing(false);
    }
  };

  if (!activeClientId) {
    return (
      <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 text-xs text-gray-500 text-center">
        PayPal is not fully configured for this store.
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col items-center">
      {errorMessage && (
        <div className="w-full mb-4 p-4 rounded-2xl bg-amber-50/90 border border-amber-200 text-amber-900 text-xs flex items-start gap-3 shadow-xs">
          <AlertCircle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-bold text-amber-950">{errorMessage}</p>
            <p className="text-[11px] text-amber-800 mt-1 font-medium">
              You can switch to another payment method (e.g. Bank Transfer / Credit Card / Pay on Arrival) to complete your reservation.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setErrorMessage(null)}
            className="text-amber-500 hover:text-amber-800 font-black text-sm"
          >
            ✕
          </button>
        </div>
      )}

      {loading ? (
        <div className="w-full py-6 flex flex-col items-center justify-center gap-2 bg-gray-50/70 border border-gray-100 rounded-2xl">
          <Loader2 className="h-6 w-6 animate-spin text-amber-500" />
          <span className="text-xs font-semibold text-gray-500">Initializing secure PayPal gateway...</span>
        </div>
      ) : v6Supported && sdkInstance?.createPayPalOneTimePaymentSession ? (
        // PayPal Web SDK v6 Experience
        <div className="w-full flex flex-col gap-3">
          <button
            type="button"
            disabled={processing || !agreedToTerms}
            onClick={handleV6Click}
            className={`w-full h-14 rounded-2xl font-bold flex items-center justify-center gap-2 text-sm shadow-md transition-all ${
              !agreedToTerms
                ? 'bg-amber-100 text-amber-800 cursor-not-allowed opacity-70'
                : processing
                ? 'bg-amber-400 text-gray-950 cursor-wait'
                : 'bg-[#FFC439] hover:bg-[#F2BA36] text-[#003087] hover:shadow-lg active:scale-[0.99]'
            }`}
          >
            {processing ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin text-[#003087]" />
                <span>Connecting to PayPal...</span>
              </>
            ) : (
              <>
                <span className="italic font-black text-base text-[#003087]">Pay</span>
                <span className="italic font-black text-base text-[#0079C1]">Pal</span>
                <span className="ml-2 font-semibold text-xs text-gray-800">Checkout</span>
              </>
            )}
          </button>

          <div className="flex items-center justify-center gap-2 text-[11px] text-gray-400 font-medium mt-1">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
            <span>Powered by PayPal Web SDK v6 • End-to-End Encrypted</span>
          </div>
        </div>
      ) : (
        // Standard PayPal Script / Buttons Fallback
        <div className="w-full">
          <PayPalScriptProvider
            options={{
              clientId: activeClientId,
              currency: (currency || 'USD').toUpperCase(),
              intent: 'capture',
              components: 'buttons,messages',
            }}
          >
            <PayPalButtons
              disabled={!agreedToTerms}
              style={{
                layout: 'vertical',
                color: 'gold',
                shape: 'rect',
                label: 'paypal',
                height: 54,
              }}
              forceReRender={[amount, currency, activeClientId, mode, agreedToTerms]}
              createOrder={async (data, actions) => {
                setErrorMessage(null);
                try {
                  const res = await axios.post('/api/payment/paypal/create-order', {
                    tenantId,
                    amount,
                    currency,
                    description,
                    bookingId: bookingId || `bk_${Date.now()}`,
                  });

                  if (res.data?.orderId) {
                    return res.data.orderId;
                  }
                  if (res.data?.error) {
                    setErrorMessage(res.data.error);
                    throw new Error(res.data.error);
                  }
                } catch (serverErr: any) {
                  const errMsg = serverErr.response?.data?.error || serverErr.message || '';
                  if (errMsg.includes('restricted') || errMsg.includes('PAYEE_ACCOUNT_RESTRICTED')) {
                    const userFriendlyMsg =
                      'The merchant PayPal account is currently restricted or pending business verification by PayPal. Please select another payment method.';
                    setErrorMessage(userFriendlyMsg);
                    throw new Error(userFriendlyMsg);
                  }
                }

                // Fallback to actions.order.create
                const upperCurr = (currency || 'USD').toUpperCase();
                const zeroDecimalCurrencies = ['JPY', 'HUF', 'TWD', 'KRW'];
                const formattedVal = zeroDecimalCurrencies.includes(upperCurr)
                  ? Math.round(amount).toString()
                  : amount.toFixed(2);
                const sanitizedDesc =
                  (description || 'Tour Booking').replace(/[^\w\s.,\-()]/g, '').trim().substring(0, 100) ||
                  'Tour Booking';

                return actions.order.create({
                  intent: 'CAPTURE',
                  purchase_units: [
                    {
                      amount: {
                        value: formattedVal,
                        currency_code: upperCurr,
                      },
                      description: sanitizedDesc,
                    },
                  ],
                });
              }}
              onApprove={async (data, actions) => {
                setErrorMessage(null);
                try {
                  try {
                    const res = await axios.post('/api/payment/paypal/capture-order', {
                      tenantId,
                      orderId: data.orderID,
                    });
                    if (res.data?.success) {
                      await onSuccess(data.orderID, res.data.captureId);
                      return;
                    }
                  } catch (serverCaptureErr) {
                    console.warn('Server capture fallback to client actions:', serverCaptureErr);
                  }

                  const details = await actions.order.capture();
                  await onSuccess(data.orderID, details.id || data.orderID);
                } catch (err: any) {
                  console.error('PayPal capture error:', err);
                  setErrorMessage('Payment capture encountered an issue. Our team is verifying your payment.');
                }
              }}
              onError={(err: any) => {
                console.error('PayPal Error:', err);
                const errStr = String(err?.message || err || '');
                if (errStr.includes('restricted') || errStr.includes('RESTRICTED')) {
                  setErrorMessage(
                    'The merchant PayPal account is currently restricted or pending business verification by PayPal. Please select another payment method.'
                  );
                } else {
                  setErrorMessage('PayPal encountered an issue. Please try another payment method.');
                }
              }}
            />
          </PayPalScriptProvider>
        </div>
      )}
    </div>
  );
};
