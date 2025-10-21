import EditForm from "../EditForm";

export default async function EditBloggerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: idStr } = await params;
  const id = Number(idStr);
  if (!Number.isFinite(id)) {
    return <main className="space-y-4"><h1 className="text-2xl font-semibold">Неверный ID</h1></main>;
  }
  return (
    <main className="space-y-4">
      <h1 className="text-2xl font-semibold">Редактирование блогера</h1>
      <div className="card p-4">
        <EditForm id={id} />
      </div>
    </main>
  );
}
