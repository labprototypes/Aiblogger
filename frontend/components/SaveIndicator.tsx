type SaveIndicatorProps = {
  status: 'idle' | 'pending' | 'saving' | 'saved' | 'error';
};

export default function SaveIndicator({ status }: SaveIndicatorProps) {
  if (status === 'idle') return null;

  const config = {
    pending: {
      text: 'Есть изменения...',
      icon: '●',
      className: 'text-gray-400'
    },
    saving: {
      text: 'Сохранение...',
      icon: '⟳',
      className: 'text-blue-400 animate-spin'
    },
    saved: {
      text: 'Сохранено',
      icon: '✓',
      className: 'text-green-400'
    },
    error: {
      text: 'Ошибка сохранения',
      icon: '⚠',
      className: 'text-red-400'
    }
  };

  const current = config[status];

  return (
    <div className="flex items-center gap-2 text-sm">
      <span className={current.className}>{current.icon}</span>
      <span className={current.className}>{current.text}</span>
    </div>
  );
}
