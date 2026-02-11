import { Eye, EyeOff } from 'lucide-react';
import { useTheme, useAmountVisibility } from '../../contexts';
import { themes } from '../../utils/theme';

function VisibilityToggle({ className = '' }) {
  const { showAmounts, toggleAmounts } = useAmountVisibility();
  const { theme } = useTheme();
  const t = themes[theme];

  return (
    <button
      onClick={toggleAmounts}
      className={`w-11 h-11 inline-flex items-center justify-center rounded-xl ${t.bgTertiary} ${t.bgHover} transition-all ${className}`}
      title={showAmounts ? 'Masquer les montants' : 'Afficher les montants'}
    >
      {showAmounts
        ? <Eye className={`w-5 h-5 ${t.textSecondary}`} />
        : <EyeOff className={`w-5 h-5 ${t.textSecondary}`} />
      }
    </button>
  );
}

export default VisibilityToggle;
