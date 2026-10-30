import React, { useState, useEffect } from 'react';
import { logisticsService } from '../services/logisticsService';
import { PincodeLogisticsInfo } from '../types';
import { Truck, CheckCircle2, ShieldCheck, Clock, MapPin, AlertCircle, ArrowRight } from 'lucide-react';

interface PincodeEstimatorProps {
  className?: string;
  onPincodeSelected?: (info: PincodeLogisticsInfo) => void;
  compact?: boolean;
}

export const PincodeEstimator: React.FC<PincodeEstimatorProps> = ({
  className = '',
  onPincodeSelected,
  compact = false
}) => {
  const [pincode, setPincode] = useState<string>(() => logisticsService.getStoredPincode());
  const [info, setInfo] = useState<PincodeLogisticsInfo | null>(null);
  const [error, setError] = useState<string | null>(null);

  const evaluatePincode = (inputPin: string) => {
    const clean = inputPin.replace(/\D/g, '').slice(0, 6);
    setPincode(clean);
    setError(null);

    if (clean.length === 6) {
      if (logisticsService.isValidIndianPincode(clean)) {
        const result = logisticsService.lookupPincode(clean);
        setInfo(result);
        logisticsService.saveStoredPincode(clean);
        if (onPincodeSelected) {
          onPincodeSelected(result);
        }
      } else {
        setError('Please enter a valid 6-digit Indian postal PIN code.');
        setInfo(null);
      }
    } else if (clean.length > 0 && clean.length < 6) {
      setInfo(null);
    }
  };

  useEffect(() => {
    if (pincode && pincode.length === 6 && logisticsService.isValidIndianPincode(pincode)) {
      evaluatePincode(pincode);
    }
  }, []);

  const handleQuickSelect = (pin: string) => {
    evaluatePincode(pin);
  };

  return (
    <div className={`rounded-xl border border-[#24140D]/15 bg-[#FAF7F2] overflow-hidden ${className}`}>
      {/* Header */}
      <div className="px-4 py-3 bg-[#EFE9DF]/70 border-b border-[#24140D]/10 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Truck className="w-4 h-4 text-[#783A1D]" />
          <span className="text-xs font-serif font-bold text-[#24140D] tracking-wide">
            Delivery & Pincode Checker
          </span>
        </div>
        <span className="text-[10px] text-[#783A1D] uppercase tracking-wider font-semibold">
          Pan-India Air Logistics
        </span>
      </div>

      <div className="p-4 space-y-3">
        {/* Input Field */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <MapPin className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#24140D]/50" />
            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={pincode}
              onChange={(e) => evaluatePincode(e.target.value)}
              placeholder="Enter 6-digit PIN (e.g. 400001)"
              className="w-full pl-9 pr-3 py-2 text-xs font-mono font-medium tracking-wider bg-white border border-[#24140D]/20 rounded-lg focus:outline-none focus:border-[#783A1D] text-[#24140D] placeholder:font-sans placeholder:tracking-normal placeholder:text-[#24140D]/40"
            />
          </div>
          <button
            type="button"
            onClick={() => evaluatePincode(pincode)}
            className="px-3.5 py-2 rounded-lg bg-[#24140D] hover:bg-[#3D2013] text-[#FAF7F2] text-xs font-semibold tracking-wider uppercase transition-colors cursor-pointer shrink-0"
          >
            Check
          </button>
        </div>

        {/* Quick Hub Chips */}
        <div className="flex items-center gap-1.5 flex-wrap text-[11px] text-[#24140D]/70">
          <span className="text-[10px] uppercase font-semibold text-[#783A1D] tracking-wider">Quick Select:</span>
          {[
            { label: 'Mumbai', pin: '400001' },
            { label: 'Delhi NCR', pin: '110001' },
            { label: 'Bengaluru', pin: '560001' },
            { label: 'Jaipur', pin: '302001' },
            { label: 'Kolkata', pin: '700001' }
          ].map((hub) => (
            <button
              key={hub.pin}
              type="button"
              onClick={() => handleQuickSelect(hub.pin)}
              className={`px-2 py-0.5 rounded border text-[10px] font-mono transition-colors cursor-pointer ${
                pincode === hub.pin
                  ? 'border-[#783A1D] bg-[#783A1D] text-[#FAF7F2]'
                  : 'border-[#24140D]/15 bg-white text-[#24140D] hover:border-[#783A1D]'
              }`}
            >
              {hub.label}
            </button>
          ))}
        </div>

        {/* Error State */}
        {error && (
          <div className="p-2.5 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Detailed Logistics Result */}
        {info && (
          <div className="mt-3 space-y-2.5 pt-2 border-t border-[#24140D]/10">
            {/* Main Delivery ETA Box */}
            <div className="p-3 rounded-lg bg-white border border-[#24140D]/10 shadow-2xs space-y-1.5">
              <div className="flex items-baseline justify-between">
                <span className="text-[11px] font-semibold text-[#783A1D] uppercase tracking-wider">
                  Estimated Delivery by
                </span>
                <span className="text-xs font-mono font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  {info.transitDays <= 2 ? 'Express 48H Transit' : `${info.transitDays} Business Days`}
                </span>
              </div>
              
              <div className="font-serif text-lg font-bold text-[#24140D] flex items-center gap-2">
                <span>{info.estimatedDeliveryDate}</span>
                <span className="text-xs font-sans font-normal text-[#24140D]/60">
                  to {info.city}, {info.state} ({info.pincode})
                </span>
              </div>

              <div className="pt-1.5 border-t border-[#24140D]/5 flex items-center justify-between text-[11px] text-[#24140D]/80">
                <span className="flex items-center gap-1.5 font-medium">
                  <span className="w-2 h-2 rounded-full bg-[#783A1D]" />
                  Partner: <strong className="text-[#24140D]">{info.courierPartner}</strong>
                </span>
                <span className="text-emerald-700 font-semibold">
                  Free Insured Express
                </span>
              </div>
            </div>

            {/* Logistics Assurance Points */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-[#24140D]/80">
              <div className="p-2 rounded-lg bg-[#EFE9DF]/50 border border-[#24140D]/10 flex items-start gap-2">
                <Clock className="w-3.5 h-3.5 text-[#783A1D] shrink-0 mt-0.5" />
                <span>{info.dispatchTimeNotice}</span>
              </div>

              <div className="p-2 rounded-lg bg-[#EFE9DF]/50 border border-[#24140D]/10 flex items-start gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700 shrink-0 mt-0.5" />
                <span>
                  {info.codAvailable
                    ? `Cash on Delivery (COD) eligible up to ₹${info.maxCodAmount.toLocaleString('en-IN')}`
                    : 'Prepaid orders only for this PIN region'}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 text-[10px] text-[#24140D]/60 px-1">
              <ShieldCheck className="w-3.5 h-3.5 text-[#C29B38] shrink-0" />
              <span>Ships in tamper-evident sealed luxury transit sleeve with transit insurance.</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
