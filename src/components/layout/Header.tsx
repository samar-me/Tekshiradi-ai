'use client';
import Link from 'next/link';
import { Search, Settings2, ScanLine } from 'lucide-react';
import { useTelegram } from '../providers/TelegramProvider';

export function Header() {
  const { user } = useTelegram();
  const initials=(user?.full_name||'O‘qituvchi').split(' ').slice(0,2).map(x=>x[0]).join('').toUpperCase();
  return <header className="app-surface sticky top-0 z-30 border-b bg-opacity-95 backdrop-blur-xl"><div className="mx-auto flex h-16 max-w-6xl items-center px-4 sm:px-6"><Link href="/" className="flex items-center gap-2.5" aria-label="Tekshiradi AI bosh sahifa"><span className="flex h-8 w-8 items-center justify-center rounded-[9px] bg-primary text-white"><ScanLine className="h-4.5 w-4.5"/></span><span className="text-[15px] font-semibold tracking-[-.02em]">Tekshiradi AI</span></Link><nav className="ml-10 hidden items-center gap-1 md:flex"><DesktopLink href="/">Bosh sahifa</DesktopLink><DesktopLink href="/sinflar">Sinflar</DesktopLink><DesktopLink href="/tekshirish">Tekshirish</DesktopLink><DesktopLink href="/tarix">Tarix</DesktopLink></nav><div className="ml-auto flex items-center gap-1.5"><button aria-label="Qidirish" className="hidden h-10 w-10 items-center justify-center rounded-[9px] text-muted transition hover:app-muted sm:flex"><Search className="h-[18px] w-[18px]"/></button><button aria-label="Sozlamalar" className="hidden h-10 w-10 items-center justify-center rounded-[9px] text-muted transition hover:app-muted sm:flex"><Settings2 className="h-[18px] w-[18px]"/></button><button aria-label="Profil" className="ml-1 flex h-9 w-9 items-center justify-center rounded-full bg-[#e8e9fb] text-xs font-semibold text-[#3f46c7] dark:bg-[#292a4a] dark:text-[#aeb2ff]">{initials}</button></div></div></header>;
}
function DesktopLink({href,children}:{href:string;children:React.ReactNode}) { return <Link href={href} className="rounded-[8px] px-3 py-2 text-sm text-muted transition hover:app-muted hover:text-[var(--foreground)]">{children}</Link>; }
