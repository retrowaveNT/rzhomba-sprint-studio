import { useEffect, useState } from "react";

import { Modal } from "@/components/rz";
import { PRIORITY_LABELS, useStore, type Priority } from "@/lib/store";

const POINTS = [1, 2, 3, 5, 8, 13];

export function CreateTaskDialog() {
  const { createOpen, setCreateOpen, addTask, columns, members, epics, activeSprint, mode } = useStore();
  const [title, setTitle] = useState("");
  const [status, setStatus] = useState("");
  const [assignee, setAssignee] = useState("ak");
  const [points, setPoints] = useState(3);
  const [priority, setPriority] = useState<Priority>("medium");
  const [epicId, setEpicId] = useState("");
  const [inSprint, setInSprint] = useState(true);
  const [err, setErr] = useState(false);

  useEffect(() => {
    if (createOpen) {
      setTitle("");
      setErr(false);
      setStatus(createOpen.status ?? columns[0]?.id ?? "todo");
      setInSprint(true);
    }
  }, [createOpen, columns]);

  const close = () => setCreateOpen(null);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setErr(true);
      return;
    }
    addTask({
      title,
      status,
      assigneeId: assignee,
      points,
      priority,
      epicId: epicId || null,
      sprintId: mode === "scrum" && inSprint && activeSprint ? activeSprint.id : null,
    });
    close();
  };

  return (
    <Modal open={createOpen !== null} onClose={close} title="Новая задача" width="30rem">
      <form onSubmit={submit} noValidate className="space-y-4">
        <div>
          <label htmlFor="ct-title" className="mb-1.5 block text-[13px] font-medium">
            Название
          </label>
          <input
            id="ct-title"
            autoFocus
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              setErr(false);
            }}
            placeholder="Например, Добавить экспорт задач"
            aria-invalid={err}
            className="field"
          />
          {err && <p className="mt-1 text-xs text-destructive">Введите название задачи</p>}
        </div>
        <div className="grid grid-cols-2 gap-3">
          <label className="block text-[13px] font-medium">
            <span className="mb-1.5 block">Статус</span>
            <select value={status} onChange={(e) => setStatus(e.target.value)} className="field">
              {columns.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-[13px] font-medium">
            <span className="mb-1.5 block">Исполнитель</span>
            <select value={assignee} onChange={(e) => setAssignee(e.target.value)} className="field">
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-[13px] font-medium">
            <span className="mb-1.5 block">Оценка, SP</span>
            <select
              value={points}
              onChange={(e) => setPoints(Number(e.target.value))}
              className="field"
            >
              {POINTS.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-[13px] font-medium">
            <span className="mb-1.5 block">Приоритет</span>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as Priority)}
              className="field"
            >
              {(Object.keys(PRIORITY_LABELS) as Priority[]).map((p) => (
                <option key={p} value={p}>
                  {PRIORITY_LABELS[p]}
                </option>
              ))}
            </select>
          </label>
        </div>
        <label className="block text-[13px] font-medium">
          <span className="mb-1.5 block">Эпик</span>
          <select value={epicId} onChange={(e) => setEpicId(e.target.value)} className="field">
            <option value="">Без эпика</option>
            {epics.map((e) => (
              <option key={e.id} value={e.id}>
                {e.name}
              </option>
            ))}
          </select>
        </label>
        {mode === "scrum" && activeSprint && (
          <label className="flex items-center gap-2 text-[13px] text-muted-foreground">
            <input
              type="checkbox"
              checked={inSprint}
              onChange={(e) => setInSprint(e.target.checked)}
              className="accent-[var(--primary)]"
            />
            Добавить в {activeSprint.name}
          </label>
        )}
        <div className="flex justify-end gap-2 pt-1">
          <button type="button" className="btn btn-secondary" onClick={close}>
            Отмена
          </button>
          <button type="submit" className="btn btn-primary">
            Создать задачу
          </button>
        </div>
      </form>
    </Modal>
  );
}
