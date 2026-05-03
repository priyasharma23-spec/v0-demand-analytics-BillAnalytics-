// ── 2. RIGHT SIDEBAR — matches Payment Status / Action Required style exactly ─
// Drop this as a new sidebar section, between or after existing sidebar cards:

export function PrepaidBalanceSidebar({
  creditAmount,   // number in lakhs e.g. 34.1
  creditCount,    // number of meters
  arrearAmount,   // number in lakhs e.g. 20.2
  arrearCount,    // number of meters
  onViewAll,      // () => void
}: {
  creditAmount: number;
  creditCount: number;
  arrearAmount: number;
  arrearCount: number;
  onViewAll?: () => void;
}) {
  const total = creditAmount + arrearAmount;
  const creditPct = total > 0 ? (creditAmount / total) * 100 : 50;

  return (
    <div style={{
      background: '#ffffff',
      border: '1px solid #f0f1f5',
      borderRadius: 6,
      boxShadow: '0 1px 3px rgba(25,39,68,.04)',
      overflow: 'hidden',
    }}>

      {/* Header — identical to "PAYMENT STATUS" label style */}
      <div style={{
        padding: '10px 14px 8px',
        borderBottom: '1px solid #f0f1f5',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <span style={{
          fontSize: 10, fontWeight: 600, color: '#858ea2',
          textTransform: 'uppercase', letterSpacing: '0.07em',
        }}>
          Prepaid balance
        </span>
        {onViewAll && (
          <button onClick={onViewAll} style={{
            fontSize: 10, fontWeight: 500, color: '#1c5af4',
            background: 'transparent', border: 'none',
            padding: 0, cursor: 'pointer', fontFamily: 'inherit',
          }}>
            View all →
          </button>
        )}
      </div>

      {/* Split bar — full width, height 3px, green|red proportional */}
      <div style={{ display: 'flex', height: 3 }}>
        <div style={{
          width: `${creditPct}%`,
          background: '#36b37e',
          transition: 'width .4s ease',
        }} />
        <div style={{
          width: `${100 - creditPct}%`,
          background: '#e53935',
          transition: 'width .4s ease',
        }} />
      </div>

      {/* Credit row — matches "Paid · 96 · 80%" row style */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        padding: '9px 14px',
        borderBottom: '1px solid #f0f1f5',
        gap: 8,
      }}>
        <div style={{
          width: 7, height: 7, borderRadius: '50%',
          background: '#36b37e', flexShrink: 0,
        }} />
        <span style={{ fontSize: 12, color: '#192744', flex: 1 }}>In credit</span>
        <span style={{
          fontSize: 12, fontWeight: 700, color: '#36b37e',
          minWidth: 36, textAlign: 'right',
        }}>
          ₹{creditAmount.toFixed(1)}L
        </span>
        <span style={{
          fontSize: 11, color: '#858ea2',
          minWidth: 28, textAlign: 'right',
        }}>
          {creditCount}
        </span>
      </div>

      {/* Arrear row */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        padding: '9px 14px',
        gap: 8,
      }}>
        <div style={{
          width: 7, height: 7, borderRadius: '50%',
          background: '#e53935', flexShrink: 0,
        }} />
        <span style={{ fontSize: 12, color: '#192744', flex: 1 }}>In arrear</span>
        <span style={{
          fontSize: 12, fontWeight: 700, color: '#e53935',
          minWidth: 36, textAlign: 'right',
        }}>
          ₹{arrearAmount.toFixed(1)}L
        </span>
        <span style={{
          fontSize: 11, color: '#858ea2',
          minWidth: 28, textAlign: 'right',
        }}>
          {arrearCount}
        </span>
      </div>

      {/* Footer alert — only shown if arrears exist */}
      {arrearCount > 0 && (
        <div style={{
          margin: '0 10px 10px',
          padding: '7px 10px',
          borderRadius: 4,
          background: '#fef2f2',
          border: '1px solid #fecaca',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, color: '#e53935', marginBottom: 1 }}>
              {arrearCount} meter{arrearCount !== 1 ? 's' : ''} need recharge
            </div>
            <div style={{ fontSize: 10, color: '#858ea2' }}>
              Disconnect risk
            </div>
          </div>
          <span style={{
            fontSize: 16, fontWeight: 700, color: '#e53935',
          }}>
            {arrearCount}
          </span>
        </div>
      )}
    </div>
  );
}
