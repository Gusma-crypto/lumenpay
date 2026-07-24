"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  BadgeDollarSign,
  CheckCircle2,
  ClipboardPaste,
  Info,
  MessageSquareText,
  QrCode,
  RotateCcw,
  Send,
  UserRound,
  X
} from "lucide-react";
import { validateAmount, validateRecipientAddress } from "@/lib/validation";

type PaymentFormProps = {
  isConnected: boolean;
  isSubmitting: boolean;
  balance: string | null;
  onSendPayment: (destinationPublicKey: string, amount: string, memo: string) => Promise<void>;
  onEdit: () => void;
  recipientSuggestion: string | null;
  resetSignal: number;
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
  const [pasteError, setPasteError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const onEditRef = useRef(props.onEdit);
  const invalidQrRef = useRef(false);
  const canSendPayment = props.isConnected && !props.isSubmitting && destination.trim().length > 0 && amount.trim().length > 0;
  const recipientError = destination.trim() ? validateRecipientAddress(destination) : null;
  const amountError = amount.trim() ? validateAmount(amount, props.balance) : null;
  const isRecipientValid = destination.trim().length > 0 && !recipientError;
  const isAmountValid = amount.trim().length > 0 && !amountError;
  const isMemoValid = new TextEncoder().encode(memo.trim()).length <= 28;
  const quickAmounts = ["1", "5", "10", "50", "100"];

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
    if (props.resetSignal === 0) {
      return;
    }

    setDestination("");
    setAmount("");
    setMemo("");
    setPasteError(null);
    setScanError(null);
    setIsScannerOpen(false);
  }, [props.resetSignal]);

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
    };
  }, [isScannerOpen]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await props.onSendPayment(destination.trim(), amount.trim(), memo.trim());
  }

  async function pasteRecipient() {
    try {
      setPasteError(null);
      const value = await navigator.clipboard.readText();
      const address = readStellarAddress(value) || value.trim();
      setDestination(address);
      props.onEdit();
    } catch {
      setPasteError("Clipboard access was blocked. Paste the address manually.");
    }
  }

  function resetForm() {
    setDestination("");
    setAmount("");
    setMemo("");
    setPasteError(null);
    setScanError(null);
    props.onEdit();
  }

  return (
    <section className="send-form-card">
      <div className="send-card-heading">
        <div className="send-card-icon">
          <Send size={25} aria-hidden="true" />
        </div>
        <div>
          <h2>Payment Details</h2>
          <p>Fill in the recipient address and amount to send.</p>
        </div>
      </div>

      <form className="send-payment-form" onSubmit={handleSubmit}>
        <label className="send-field">
          <span>
            Recipient Address <b>*</b>
            <button className="paste-button" type="button" onClick={() => void pasteRecipient()} disabled={!props.isConnected || props.isSubmitting}>
              <ClipboardPaste size={15} aria-hidden="true" />
              Paste
            </button>
          </span>
          <div className={`send-input-wrap ${isRecipientValid ? "valid" : ""}`}>
            <UserRound
              className="send-input-icon"
              size={18}
              aria-hidden="true"
            />
            <input
              className="send-input mono"
              value={destination}
              onChange={(event) => {
                setDestination(event.target.value);
                setPasteError(null);
                props.onEdit();
              }}
              placeholder="G..."
              disabled={!props.isConnected || props.isSubmitting}
              required
            />
            {isRecipientValid ? <CheckCircle2 className="send-valid-icon" size={20} aria-hidden="true" /> : null}
            <button
              className="scan-button"
              type="button"
              onClick={() => setIsScannerOpen(true)}
              disabled={!props.isConnected || props.isSubmitting}
              aria-label="Scan recipient QR code"
              title="Scan recipient QR code"
            >
              <QrCode size={17} aria-hidden="true" />
            </button>
          </div>
          <small className={recipientError || pasteError ? "field-error" : "field-help"}>
            {recipientError ?? pasteError ?? (isRecipientValid ? "Valid Stellar address format" : "Paste or scan a Stellar Testnet recipient address.")}
          </small>
        </label>

        <label className="send-field">
          <span>
            Amount (XLM) <b>*</b>
            <em>Balance: {props.balance ? `${Number(props.balance).toFixed(4)} XLM` : "Connect wallet"}</em>
          </span>
          <div className={`send-input-wrap amount ${isAmountValid ? "valid" : ""}`}>
            <BadgeDollarSign className="send-input-icon" size={18} aria-hidden="true" />
            <input
              className="send-input"
              value={amount}
              onChange={(event) => {
                setAmount(event.target.value);
                props.onEdit();
              }}
              inputMode="decimal"
              placeholder="10.5"
              disabled={!props.isConnected || props.isSubmitting}
              required
            />
            <strong>XLM</strong>
          </div>
          <div className="quick-amounts">
            {quickAmounts.map((quickAmount) => (
              <button
                className={amount === quickAmount ? "active" : ""}
                type="button"
                key={quickAmount}
                onClick={() => {
                  setAmount(quickAmount);
                  props.onEdit();
                }}
                disabled={!props.isConnected || props.isSubmitting}
              >
                {quickAmount}
              </button>
            ))}
          </div>
          {amountError ? <small className="field-error">{amountError}</small> : null}
        </label>

        <label className="send-field">
          <span>
            Memo (Optional) <Info size={15} aria-hidden="true" />
            <em>{new TextEncoder().encode(memo.trim()).length}/28</em>
          </span>
          <div className={`send-textarea-wrap ${memo.trim() && isMemoValid ? "valid" : ""}`}>
            <MessageSquareText className="send-input-icon top" size={18} aria-hidden="true" />
            <textarea
              className="send-textarea"
              value={memo}
              onChange={(event) => {
                setMemo(event.target.value);
                props.onEdit();
              }}
              placeholder="Test payment - LumenPay Lite"
              disabled={!props.isConnected || props.isSubmitting}
              maxLength={28}
            />
            {memo.trim() && isMemoValid ? <CheckCircle2 className="send-valid-icon textarea" size={20} aria-hidden="true" /> : null}
          </div>
          {!isMemoValid ? <small className="field-error">Memo can use up to 28 bytes.</small> : null}
        </label>

        <div className="send-note">
          <Info size={18} aria-hidden="true" />
          <p>This payment will be sent on Stellar Testnet and can be recorded to LumenPay Tracker contract after successful transaction.</p>
        </div>

        <div className="send-actions">
          <button className="reset-payment-button" type="button" onClick={resetForm} disabled={props.isSubmitting}>
            <RotateCcw size={19} aria-hidden="true" />
            Reset
          </button>
          <button className="review-payment-button" type="submit" disabled={!canSendPayment}>
            {props.isSubmitting ? "Processing Payment" : "Review Payment"}
            <ArrowRight size={19} aria-hidden="true" />
          </button>
        </div>
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
