import { BookOpen, Copy, UserRound } from "lucide-react";
import { shortenPublicKey } from "@/lib/explorer";
import type { PaymentHistoryItem } from "@/lib/stellar";

type AddressBookProps = {
  items: PaymentHistoryItem[];
  publicKey: string | null;
  onSelect: (address: string) => void;
};

export function AddressBook(props: AddressBookProps) {
  const addresses = Array.from(
    new Set(
      props.items
        .flatMap((item) => [item.from, item.to])
        .filter((address) => address && address !== props.publicKey)
    )
  ).slice(0, 4);

  return (
    <section className="panel-card">
      <div className="mb-5 flex items-center justify-between gap-4">
        <div>
          <p className="section-eyebrow">Contacts</p>
          <h2 className="text-xl font-semibold text-ink">Address Book</h2>
        </div>
        <div className="grid h-11 w-11 place-items-center rounded-lg border border-line/50 bg-violet-400/10 text-cyan-300">
          <BookOpen size={20} aria-hidden="true" />
        </div>
      </div>

      {addresses.length > 0 ? (
        <div className="space-y-3">
          {addresses.map((address) => (
            <div className="flex items-center justify-between gap-3 rounded-lg border border-line/55 bg-paper p-3" key={address}>
              <button
                className="flex min-w-0 items-center gap-3 text-left"
                type="button"
                onClick={() => props.onSelect(address)}
                title={address}
              >
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-line/45 bg-[#090a18] text-cyan-300">
                  <UserRound size={16} aria-hidden="true" />
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-semibold text-ink">Recent wallet</span>
                  <span className="block truncate font-mono text-xs text-violet-100/60">{shortenPublicKey(address)}</span>
                </span>
              </button>
              <button
                className="icon-button h-9 w-9"
                type="button"
                onClick={() => void navigator.clipboard.writeText(address)}
                aria-label="Copy address"
                title="Copy address"
              >
                <Copy size={15} aria-hidden="true" />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <p className="rounded-lg border border-line/55 bg-paper p-4 text-sm leading-6 text-violet-100/70">
          Recent transaction addresses will appear here.
        </p>
      )}
    </section>
  );
}
