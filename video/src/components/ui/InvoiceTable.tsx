import React from 'react';
import { colors, radius } from '../../design/tokens';
import { StatusBadge } from './StatusBadge';

interface Invoice {
  amount: string;
  status: 'draft' | 'sent' | 'paid';
  due:    string;
  title?: string;
}

interface Props {
  invoices: Invoice[];
}

export const InvoiceTable: React.FC<Props> = ({ invoices }) => {
  return (
    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
      <thead>
        <tr style={{ borderBottom: `1px solid ${colors.border}` }}>
          {['Invoice', 'Amount', 'Due', 'Status'].map((h) => (
            <th key={h} style={{
              textAlign:   'left',
              fontSize:    11,
              fontWeight:  600,
              color:       colors.textTertiary,
              padding:     '0 0 10px',
              textTransform:'uppercase',
              letterSpacing:'0.06em',
            }}>
              {h}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {invoices.map((inv, i) => (
          <tr key={i} style={{ borderBottom: `1px solid ${colors.border}` }}>
            <td style={{ padding: '12px 0', fontSize: 14, color: colors.textPrimary, fontWeight: 500 }}>
              {inv.title ?? `Invoice #${String(i + 1).padStart(3, '0')}`}
            </td>
            <td style={{ padding: '12px 0', fontSize: 14, color: colors.textPrimary, fontWeight: 600 }}>
              {inv.amount}
            </td>
            <td style={{ padding: '12px 0', fontSize: 13, color: colors.textSecondary }}>
              {inv.due}
            </td>
            <td style={{ padding: '12px 0' }}>
              <StatusBadge status={inv.status} />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};
