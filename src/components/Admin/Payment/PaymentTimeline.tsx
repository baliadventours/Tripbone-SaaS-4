import React from 'react';
import { CheckCircle2, Clock, XCircle, ArrowRight, ShieldCheck, CreditCard, ShoppingBag, Send } from 'lucide-react';
import { PaymentTimelineEvent } from '../../../services/payment/types';
import { PaymentService } from '../../../services/payment/PaymentService';

interface Props {
  bookingData: any;
}

export const PaymentTimeline: React.FC<Props> = ({ bookingData }) => {
  const events: PaymentTimelineEvent[] = PaymentService.getPaymentTimeline(bookingData);

  const getStepIcon = (step: string) => {
    switch (step) {
      case 'created':
        return <ShoppingBag className="h-4 w-4" />;
      case 'checkout_created':
        return <CreditCard className="h-4 w-4" />;
      case 'payment_completed':
        return <CheckCircle2 className="h-4 w-4" />;
      case 'webhook_received':
        return <Send className="h-4 w-4" />;
      case 'booking_confirmed':
        return <ShieldCheck className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  return (
    <div className="bg-slate-50/70 border border-slate-200/80 rounded-2xl p-5 my-4">
      <h4 className="text-xs font-black uppercase text-slate-500 tracking-wider mb-4 flex items-center gap-2">
        <CreditCard className="h-4 w-4 text-sky-600" />
        BYOPG Payment Timeline
      </h4>

      <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
        {events.map((evt, idx) => {
          const isCompleted = evt.status === 'completed';
          const isFailed = evt.status === 'failed';

          return (
            <div key={idx} className="relative group">
              {/* Step indicator node */}
              <div
                className={`absolute -left-6 top-0.5 h-5 w-5 rounded-full flex items-center justify-center text-white text-[10px] font-bold shadow-sm ${
                  isCompleted
                    ? 'bg-emerald-500 ring-4 ring-emerald-50'
                    : isFailed
                    ? 'bg-rose-500 ring-4 ring-rose-50'
                    : 'bg-slate-300 ring-4 ring-slate-100'
                }`}
              >
                {getStepIcon(evt.step)}
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                <div>
                  <h5 className={`text-xs font-bold ${isCompleted ? 'text-slate-900' : 'text-slate-500'}`}>
                    {evt.title}
                  </h5>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    {evt.description}
                  </p>
                </div>

                <div className="text-left sm:text-right shrink-0">
                  <span
                    className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                      isCompleted
                        ? 'bg-emerald-100/80 text-emerald-800'
                        : isFailed
                        ? 'bg-rose-100/80 text-rose-800'
                        : 'bg-slate-200/80 text-slate-600'
                    }`}
                  >
                    {evt.status}
                  </span>
                  {evt.timestamp && (
                    <span className="block text-[10px] text-slate-400 font-mono mt-0.5">
                      {new Date(evt.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
