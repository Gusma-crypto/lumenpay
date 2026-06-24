"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { ArrowRight, BadgeDollarSign, MessageSquareText, QrCode, Send, UserRound, X } from "lucide-react";

type PaymentFormProps = {
  isConnected: boolean;
  isSubmitting: boolean;
  onSendPayment: (destinationPublicKey: string, amount: string, memo: string) => Promise<void>;
  onEdit: () => void;
  recipientSuggestion: string | null;
};

type DetectedBarcode = {
  rawValue: string;
};

type BarcodeDetectorInstance = {
  detect: (source: CanvasImageSource) => Promise<DetectedBarcode[]>;
};

type BarcodeDetectorConstructor = new (options?: { formats: string[] }) => BarcodeDetectorInstance;

declare global {
  interface Window {
    BarcodeDetector?: BarcodeDetectorConstructor;
  }
}

function readStellarAddress(value: string) {
  const trimmedValue = value.trim();
  const directAddress = trimmedValue.match(/G[A-Z2-7]{55}/)?.[0];

  if (directAddress) {
    return directAddress;
  }

  try {
    const url = new URL(trimmedValue);
    return (
      url.searchParams.get("destination") ??
      url.searchParams.get("recipient") ??
      url.searchParams.get("address") ??
      ""
    );
  } catch {
    return "";
  }
}

export function PaymentForm(props: PaymentFormProps) {
  const [destination, setDestination] = useState("");
  const [amount, setAmount] = useState("");
  const [memo, setMemo] = useState("");
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const onEditRef = useRef(props.onEdit);
  const invalidQrRef = useRef(false);
  const canSendPayment = props.isConnected && !props.isSubmitting && destination.trim().length > 0 && amount.trim().length > 0;

  useEffect(() => {
    onEditRef.current = props.onEdit;
  }, [props.onEdit]);

  useEffect(() => {
    if (props.recipientSuggestion) {
      setDestination(props.recipientSuggestion);
      onEditRef.current();
    }
  }, [props.recipientSuggestion]);

  useEffect(() => {
    if (!isScannerOpen) {
      return;
    }

    let isActive = true;
    let animationFrame = 0;
    let stream: MediaStream | null = null;
    invalidQrRef.current = false;

    async function startScanner() {
      if (!window.BarcodeDetector) {
        setScanError("QR scanner is not supported in this browser. Paste the Stellar address manually.");
        return;
      }

      if (!navigator.mediaDevices?.getUserMedia) {
        setScanError("Camera access is not available in this browser.");
        return;
      }

      try {
        setScanError(null);
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: "environment" } },
          audio: false
        });

        if (!isActive || !videoRef.current) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        videoRef.current.srcObject = stream;
        await videoRef.current.play();

        const detector = new window.BarcodeDetector({ formats: ["qr_code"] });
        const scanFrame = async () => {
          if (!isActive || !videoRef.current) {
            return;
          }

          try {
            const results = await detector.detect(videoRef.current);
            const scannedAddress = results.map((result) => readStellarAddress(result.rawValue)).find(Boolean);

            if (scannedAddress) {
              setDestination(scannedAddress);
              onEditRef.current();
              setIsScannerOpen(false);
              return;
            }

            if (results.length > 0 && !invalidQrRef.current) {
              invalidQrRef.current = true;
              setScanError("QR detected, but it does not contain a Stellar public key.");
            }
          } catch {
            setScanError("Unable to read the QR code. Keep it centered and try again.");
          }

          animationFrame = window.requestAnimationFrame(scanFrame);
        };

        animationFrame = window.requestAnimationFrame(scanFrame);
      } catch {
        setScanError("Camera permission was denied or no camera was found.");
      }
    }

    void startScanner();

    return () => {
      isActive = false;
      window.cancelAnimationFrame(animationFrame);
      stream?.getTracks().forEach((track) => track.stop());
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    };
  }, [isScannerOpen]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await props.onSendPayment(destination.trim(), amount.trim(), memo.trim());
  }

  return (
    <section className="panel-card-strong">
      <div className="mb-5 flex items-center justify-between gap-4">
        <div>
          <p className="section-eyebrow">Payment</p>
          <h2 className="text-xl font-semibold text-ink">Send XLM Testnet</h2>
        </div>
        <div className="grid h-11 w-11 place-items-center rounded-lg border border-line/50 bg-violet-400/10 text-amber">
          <Send size={21} aria-hidden="true" />
        </div>
      </div>

      <form className="space-y-4" onSubmit={handleSubmit}>
        <label className="block">
          <span className="form-label">Recipient Stellar Address</span>
          <div className="relative">
            <UserRound
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-violet-200/55"
              size={18}
              aria-hidden="true"
            />
            <input
              className="form-input pl-10 pr-12 font-mono text-sm"
              value={destination}
              onChange={(event) => {
                setDestination(event.target.value);
                props.onEdit();
              }}
              placeholder="G..."
              disabled={!props.isConnected || props.isSubmitting}
              required
            />
            <button
              className="icon-button absolute right-1 top-1/2 h-10 w-10 -translate-y-1/2"
              type="button"
              onClick={() => setIsScannerOpen(true)}
              disabled={!props.isConnected || props.isSubmitting}
              aria-label="Scan recipient QR code"
              title="Scan recipient QR code"
            >
              <QrCode size={17} aria-hidden="true" />
            </button>
          </div>
        </label>

        <label className="block">
          <span className="form-label">Memo optional</span>
          <div className="relative">
            <MessageSquareText
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-violet-200/55"
              size={18}
              aria-hidden="true"
            />
            <input
              className="form-input pl-10"
              value={memo}
              onChange={(event) => {
                setMemo(event.target.value.slice(0, 28));
                props.onEdit();
              }}
              placeholder="Invoice, payroll, note..."
              disabled={!props.isConnected || props.isSubmitting}
              maxLength={28}
            />
          </div>
        </label>

        <label className="block">
          <span className="form-label">Amount XLM</span>
          <div className="relative">
            <BadgeDollarSign
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-violet-200/55"
              size={18}
              aria-hidden="true"
            />
            <input
              className="form-input pl-10"
              value={amount}
              onChange={(event) => {
                setAmount(event.target.value);
                props.onEdit();
              }}
              inputMode="decimal"
              placeholder="10"
              disabled={!props.isConnected || props.isSubmitting}
              required
            />
          </div>
        </label>

        <div className="rounded-lg border border-line/55 bg-paper p-3">
          <div className="flex items-center justify-between gap-3 text-sm">
            <span className="font-medium text-violet-200/70">Network</span>
            <span className="font-semibold text-ink">Stellar Testnet</span>
          </div>
          <div className="mt-2 flex items-center justify-between gap-3 text-sm">
            <span className="font-medium text-violet-200/70">Asset</span>
            <span className="font-semibold text-ink">Native XLM</span>
          </div>
        </div>

        <button
          className="button-primary w-full justify-center"
          type="submit"
          disabled={!canSendPayment}
        >
          <Send size={18} aria-hidden="true" />
          {props.isSubmitting ? "Processing Payment" : "Send Payment"}
          <ArrowRight size={18} aria-hidden="true" />
        </button>
      </form>

      {isScannerOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#050611]/75 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-lg border border-line/60 bg-[#121327] p-5 shadow-panel">
            <div className="mb-4 flex items-center justify-between gap-4">
              <div>
                <p className="section-eyebrow">Recipient</p>
                <h3 className="text-lg font-semibold text-ink">Scan QR Code</h3>
              </div>
              <button
                className="icon-button"
                type="button"
                onClick={() => setIsScannerOpen(false)}
                aria-label="Close QR scanner"
              >
                <X size={18} aria-hidden="true" />
              </button>
            </div>

            <div className="overflow-hidden rounded-lg border border-line/60 bg-[#070812]">
              <video ref={videoRef} className="aspect-square w-full object-cover" muted playsInline />
            </div>

            {scanError ? (
              <p className="mt-3 rounded-lg border border-red-400/40 bg-red-950/40 p-3 text-sm text-red-200">
                {scanError}
              </p>
            ) : (
              <p className="mt-3 text-sm text-violet-100/70">
                Point your camera at a Stellar recipient QR code.
              </p>
            )}
          </div>
        </div>
      ) : null}
    </section>
  );
}
