"use client";

export default function DeleteButton({ onDelete }: { onDelete: () => Promise<void> }) {
  const handleDelete = async () => {
    if (!confirm('Удалить задачу?')) return;
    await onDelete();
  };

  return (
    <button 
      type="button"
      onClick={handleDelete}
      className="text-red-400 hover:text-red-300 text-sm"
    >
      Удалить задачу
    </button>
  );
}
