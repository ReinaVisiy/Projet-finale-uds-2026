import { ShieldCheck } from 'lucide-react';

export default function CertifiedBadge({ isCertified, label, style = {} }) {
  if (!isCertified) return null;

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        fontSize: '11px',
        fontWeight: '800',
        color: '#155eef',
        backgroundColor: '#eaf2ff',
        border: '1px solid #bfd4ff',
        padding: '3px 8px',
        borderRadius: '999px',
        whiteSpace: 'nowrap',
        ...style,
      }}
    >
      <ShieldCheck size={12} />
      {label || 'Certifié'}
    </span>
  );
}
