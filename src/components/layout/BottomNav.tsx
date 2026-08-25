'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Users, ScanLine, History } from 'lucide-react';
const items=[{label:'Bosh sahifa',href:'/',icon:Home},{label:'Sinflar',href:'/sinflar',icon:Users},{label:'Tekshirish',href:'/tekshirish',icon:ScanLine,primary:true},{label:'Tarix',href:'/tarix',icon:History}];
export function BottomNav(){const path=usePathname(); return <nav aria-label="Asosiy navigatsiya" className="app-surface fixed inset-x-0 bottom-0 z-40 border-t pb-safe md:hidden"><div className="mx-auto grid max-w-lg grid-cols-4 px-2 pt-1.5">{items.map(item=>{const active=item.href==='/'?path==='/':path.startsWith(item.href);const Icon=item.icon;return <Link key={item.href} href={item.href} className={`relative flex min-h-[58px] flex-col items-center justify-center gap-1 rounded-[10px] text-[10px] font-medium transition ${active?'text-primary':'text-muted'}`}><span className={`flex h-7 w-10 items-center justify-center rounded-[9px] ${item.primary&&active?'bg-primary text-white':''}`}><Icon className="h-[19px] w-[19px]" strokeWidth={active?2.3:1.8}/></span>{item.label}</Link>})}</div></nav>}
