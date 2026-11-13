import Link from "next/link";

export default function NotFound() {
  return <main className="flex min-h-screen items-center justify-center bg-background p-6"><div className="space-y-4 text-center"><p className="text-sm font-medium text-primary">Payonidhi Dairy</p><h1 className="text-2xl font-semibold">Page not found</h1><Link href="/" className="text-sm text-primary underline">Return home</Link></div></main>;
}
