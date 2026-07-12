"use client";

import { useState } from "react";
import {
  Authenticated,
  Unauthenticated,
  useMutation,
  useQuery,
} from "convex/react";
import { SignInButton } from "@clerk/nextjs";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";

function NoteRow({ id, text }: { id: Id<"notes">; text: string }) {
  const update = useMutation(api.notes.update);
  const remove = useMutation(api.notes.remove);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(text);

  if (editing) {
    return (
      <li className="flex flex-col gap-2 border-b border-gray-100 py-2">
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          className="w-full rounded border border-gray-200 p-2 text-sm"
          rows={2}
        />
        <div className="flex gap-2">
          <button
            onClick={async () => {
              await update({ noteId: id, text: draft.trim() });
              setEditing(false);
            }}
            className="rounded-full bg-[#136FD5] px-3 py-1 text-xs font-medium text-white"
          >
            Guardar
          </button>
          <button
            onClick={() => {
              setDraft(text);
              setEditing(false);
            }}
            className="rounded-full border border-gray-300 px-3 py-1 text-xs text-gray-600"
          >
            Cancelar
          </button>
        </div>
      </li>
    );
  }

  return (
    <li className="flex items-start justify-between gap-3 border-b border-gray-100 py-2">
      <p className="whitespace-pre-wrap text-sm">{text}</p>
      <div className="flex shrink-0 gap-2 text-xs">
        <button
          onClick={() => setEditing(true)}
          className="text-[#136FD5] hover:underline"
        >
          Editar
        </button>
        <button
          onClick={() => remove({ noteId: id })}
          className="text-gray-400 hover:text-red-500"
        >
          Apagar
        </button>
      </div>
    </li>
  );
}

function NotesEditor({ mmsi }: { mmsi: number }) {
  const notes = useQuery(api.notes.forVessel, { mmsi });
  const add = useMutation(api.notes.add);
  const [text, setText] = useState("");

  async function submit() {
    const trimmed = text.trim();
    if (!trimmed) return;
    await add({ mmsi, text: trimmed });
    setText("");
  }

  return (
    <div>
      <ul className="mb-3">
        {notes?.map((note) => (
          <NoteRow key={note._id} id={note._id} text={note.text} />
        ))}
      </ul>
      {notes?.length === 0 && (
        <p className="mb-3 text-sm text-gray-400">Ainda sem notas.</p>
      )}
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Escrever uma nota privada…"
        rows={2}
        className="w-full rounded border border-gray-200 p-2 text-sm outline-none focus:border-[#136FD5]"
      />
      <button
        onClick={submit}
        className="mt-2 rounded-full bg-[#136FD5] px-4 py-1.5 text-sm font-medium text-white disabled:opacity-40"
        disabled={!text.trim()}
      >
        Adicionar nota
      </button>
    </div>
  );
}

export function VesselNotes({ mmsi }: { mmsi: number }) {
  return (
    <>
      <Authenticated>
        <NotesEditor mmsi={mmsi} />
      </Authenticated>
      <Unauthenticated>
        <p className="text-sm text-gray-500">
          <SignInButton mode="modal">
            <button className="font-medium text-[#136FD5] hover:underline">
              Inicia sessão
            </button>
          </SignInButton>{" "}
          para escrever notas privadas sobre este navio.
        </p>
      </Unauthenticated>
    </>
  );
}
