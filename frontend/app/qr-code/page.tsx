import { redirect } from 'next/navigation';

/** Legacy demo route — redirects to real QR page */
export default function QrCodeLegacyPage() {
  redirect('/qr');
}
