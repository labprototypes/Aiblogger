import { api } from "../../../lib/api";
import PodcasterTask from "./PodcasterTask";

export default async function TaskPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const taskId = Number(id);
  const task = await api.tasks.get(taskId);
  const blogger = await api.bloggers.get(task.blogger_id);

  return <PodcasterTask task={task} blogger={blogger} />;
}
