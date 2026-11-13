import Link from "next/link";

export function CustomerAccountExportLink({ customerId }: { customerId: string }) {
  return <Link href={`/admin/customers/${customerId}?export=account`} className="rounded-lg border px-2.5 py-1.5 text-xs font-semibold text-primary hover:bg-primary/10">Export account</Link>;
}
