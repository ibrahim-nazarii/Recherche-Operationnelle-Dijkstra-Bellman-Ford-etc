import { NextResponse, type NextRequest } from 'next/server';

function randomId(len=24){
  const chars='abcdefghijklmnopqrstuvwxyz0123456789';
  let out=''; for (let i=0;i<len;i++) out+=chars[Math.floor(Math.random()*chars.length)];
  return out;
}

export function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const sid = req.cookies.get('sid')?.value;
  if (!sid) {
    res.cookies.set('sid', randomId(), { httpOnly: true, sameSite: 'lax', path: '/' });
  }
  return res;
}
