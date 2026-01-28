import { Eye, EyeOff } from 'lucide-react';
import { useTheme, useAmountVisibility } from '../../contexts';
import { themes } from '../../utils/theme';

function VisibilityToggle() {
  const { showAmounts, toggleAmounts } = useAmountVisibility();
  const { theme } = useTheme();
  const t = themes[theme];

  return (
    <button
      onClick={toggleAmounts}
      className={`p-2 rounded-xl ${t.bgTertiary} ${t.bgHover} transition-all`}
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
