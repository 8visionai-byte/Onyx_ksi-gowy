"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";

interface AiConfig {
  id: string;
  key: string;
  value: string;
}

interface UserRow {
  id: string;
  email: string;
  name: string;
  role: string;
  scope: string;
  createdAt: string;
}

interface EnvStatus {
  [key: string]: boolean;
}

const DEFAULT_PROMPT = `Jestes asystentem do klasyfikacji dokumentow ksiegowych.
Analizuj obraz dokumentu i zwroc dane w formacie JSON.`;

export default function UstawieniaPage() {
  const { data: session } = useSession();
  const isAdmin = (session?.user as { role?: string })?.role === "admin";

  // --- AI Prompt ---
  const [prompt, setPrompt] = useState("");
  const [promptLoading, setPromptLoading] = useState(true);
  const [promptSaving, setPromptSaving] = useState(false);
  const [promptMsg, setPromptMsg] = useState("");

  // --- Users ---
  const [users, setUsers] = useState<UserRow[]>([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newAccountType, setNewAccountType] = useState("viewer_all");
  const [createMsg, setCreateMsg] = useState("");
  const [creating, setCreating] = useState(false);

  // --- Env status ---
  const [envStatus, setEnvStatus] = useState<EnvStatus>({});

  // Load AI config
  useEffect(() => {
    fetch("/api/config")
      .then((r) => r.json())
      .then((configs: AiConfig[]) => {
        const p = configs.find((c) => c.key === "classification_prompt");
        setPrompt(p?.value || DEFAULT_PROMPT);
      })
      .catch(() => setPrompt(DEFAULT_PROMPT))
      .finally(() => setPromptLoading(false));
  }, []);

  // Load env status
  useEffect(() => {
    if (!isAdmin) return;
    fetch("/api/config/env-status")
      .then((r) => r.json())
      .then((d) => setEnvStatus(d))
      .catch(() => setEnvStatus({}));
  }, [isAdmin]);

  // Load users (admin only)
  useEffect(() => {
    if (!isAdmin) {
      setUsersLoading(false);
      return;
    }
    fetch("/api/users")
      .then((r) => r.json())
      .then((d) => setUsers(Array.isArray(d) ? d : []))
      .catch(() => setUsers([]))
      .finally(() => setUsersLoading(false));
  }, [isAdmin]);

  async function savePrompt() {
    setPromptSaving(true);
    setPromptMsg("");
    try {
      const res = await fetch("/api/config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          key: "classification_prompt",
          value: prompt,
        }),
      });
      if (!res.ok) throw new Error("Blad zapisu");
      setPromptMsg("Zapisano");
    } catch {
      setPromptMsg("Blad zapisu");
    } finally {
      setPromptSaving(false);
    }
  }

  function restoreDefault() {
    setPrompt(DEFAULT_PROMPT);
  }

  async function createUser() {
    setCreating(true);
    setCreateMsg("");
    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: newEmail,
          password: newPassword,
          role: newAccountType === "admin" ? "admin" : "viewer",
          scope: newAccountType === "onyx" ? "onyx" : "all",
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Blad");
      setUsers((prev) => [...prev, data]);
      setNewEmail("");
      setNewPassword("");
      setNewAccountType("viewer_all");
      setCreateMsg("Utworzono");
    } catch (e) {
      setCreateMsg(e instanceof Error ? e.message : "Blad");
    } finally {
      setCreating(false);
    }
  }

  async function deleteUser(userId: string) {
    if (!confirm("Na pewno usunac tego uzytkownika?")) return;
    try {
      const res = await fetch(`/api/users/${userId}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Blad");
      }
      setUsers((prev) => prev.filter((u) => u.id !== userId));
    } catch (e) {
      alert(e instanceof Error ? e.message : "Blad usuwania");
    }
  }

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-onyx-text">Ustawienia</h1>

      {/* AI Prompt */}
      <section className="bg-onyx-card rounded-xl border border-onyx-border p-5 space-y-4">
        <h2 className="text-lg font-semibold text-onyx-text">
          Prompt AI (klasyfikacja)
        </h2>
        {promptLoading ? (
          <p className="text-onyx-muted text-sm">Ladowanie...</p>
        ) : (
          <>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={8}
              disabled={!isAdmin}
              className="w-full bg-onyx-bg border border-onyx-border rounded-lg px-3 py-2 text-sm text-onyx-text font-mono resize-y focus:outline-none focus:border-onyx-accent disabled:opacity-60"
            />
            {isAdmin && (
              <div className="flex items-center gap-3">
                <button
                  onClick={savePrompt}
                  disabled={promptSaving}
                  className="px-4 py-1.5 text-sm rounded-lg bg-onyx-accent text-white hover:bg-onyx-accent/80 disabled:opacity-50"
                >
                  {promptSaving ? "Zapisywanie..." : "Zapisz"}
                </button>
                <button
                  onClick={restoreDefault}
                  className="px-4 py-1.5 text-sm rounded-lg border border-onyx-border text-onyx-muted hover:text-onyx-text"
                >
                  Przywroc domyslny
                </button>
                {promptMsg && (
                  <span className="text-sm text-green-400">{promptMsg}</span>
                )}
              </div>
            )}
          </>
        )}
      </section>

      {/* Users */}
      {isAdmin && (
        <section className="bg-onyx-card rounded-xl border border-onyx-border p-5 space-y-4">
          <h2 className="text-lg font-semibold text-onyx-text">Uzytkownicy</h2>

          {usersLoading ? (
            <p className="text-onyx-muted text-sm">Ladowanie...</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-onyx-muted border-b border-onyx-border text-left">
                    <th className="px-3 py-2">Email</th>
                    <th className="px-3 py-2">Imie</th>
                    <th className="px-3 py-2">Typ konta</th>
                    <th className="px-3 py-2">Utworzono</th>
                    <th className="px-3 py-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr
                      key={u.id}
                      className="border-b border-onyx-border/50 hover:bg-onyx-bg/50"
                    >
                      <td className="px-3 py-2 text-onyx-text">{u.email}</td>
                      <td className="px-3 py-2 text-onyx-text">{u.name}</td>
                      <td className="px-3 py-2">
                        <span
                          className={`text-xs px-2 py-0.5 rounded ${
                            u.role === "admin"
                              ? "bg-onyx-accent text-white"
                              : u.scope === "onyx"
                              ? "bg-amber-500/20 text-amber-300"
                              : "bg-onyx-bg text-onyx-muted"
                          }`}
                        >
                          {u.role === "admin"
                            ? "Administrator"
                            : u.scope === "onyx"
                            ? "Pracownik Onyx"
                            : "Podgląd"}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-onyx-muted">
                        {new Date(u.createdAt).toLocaleDateString("pl-PL")}
                      </td>
                      <td className="px-3 py-2">
                        <button
                          onClick={() => deleteUser(u.id)}
                          className="text-xs text-red-400 hover:text-red-300"
                        >
                          Usun
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Create user */}
          <div className="border-t border-onyx-border pt-4 mt-4">
            <h3 className="text-sm font-medium text-onyx-text mb-3">
              Nowy uzytkownik
            </h3>
            <div className="flex flex-wrap gap-3 items-end">
              <div>
                <label className="text-xs text-onyx-muted">Email</label>
                <input
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="block w-56 bg-onyx-bg border border-onyx-border rounded px-2 py-1 text-sm text-onyx-text mt-0.5"
                />
              </div>
              <div>
                <label className="text-xs text-onyx-muted">Haslo</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="block w-40 bg-onyx-bg border border-onyx-border rounded px-2 py-1 text-sm text-onyx-text mt-0.5"
                />
              </div>
              <div>
                <label className="text-xs text-onyx-muted">Typ konta</label>
                <select
                  value={newAccountType}
                  onChange={(e) => setNewAccountType(e.target.value)}
                  className="block bg-onyx-bg border border-onyx-border rounded px-2 py-1 text-sm text-onyx-text mt-0.5"
                >
                  <option value="admin">Administrator (pełny dostęp)</option>
                  <option value="viewer_all">Podgląd — wszystkie kategorie</option>
                  <option value="onyx">Pracownik Onyx — tylko firmowe</option>
                </select>
              </div>
              <button
                onClick={createUser}
                disabled={creating || !newEmail || !newPassword}
                className="px-4 py-1.5 text-sm rounded-lg bg-green-600 text-white hover:bg-green-700 disabled:opacity-50"
              >
                {creating ? "Tworzenie..." : "Utworz"}
              </button>
              {createMsg && (
                <span className="text-sm text-onyx-muted">{createMsg}</span>
              )}
            </div>
          </div>
        </section>
      )}

      {/* API Keys Status */}
      <section className="bg-onyx-card rounded-xl border border-onyx-border p-5 space-y-3">
        <h2 className="text-lg font-semibold text-onyx-text">Klucze API</h2>
        <p className="text-xs text-onyx-muted">
          Status kluczy srodowiskowych (ustawianych w .env)
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <ApiKeyStatus label="OPENAI_API_KEY" isSet={envStatus["OPENAI_API_KEY"]} />
          <ApiKeyStatus label="GOOGLE_CLOUD_VISION" isSet={envStatus["GOOGLE_CLOUD_VISION"]} />
          <ApiKeyStatus label="NEXTAUTH_SECRET" isSet={envStatus["NEXTAUTH_SECRET"]} />
          <ApiKeyStatus label="DATABASE_URL" isSet={envStatus["DATABASE_URL"]} />
        </div>
      </section>
    </div>
  );
}

function ApiKeyStatus({ label, isSet }: { label: string; isSet?: boolean }) {
  return (
    <div className="flex items-center gap-2 bg-onyx-bg rounded-lg px-3 py-2">
      <span className="text-xs font-mono text-onyx-muted">{label}</span>
      <span className="ml-auto">
        {isSet === undefined ? (
          <span className="text-xs text-onyx-muted">...</span>
        ) : isSet ? (
          <span className="text-xs text-green-400">Ustawiony</span>
        ) : (
          <span className="text-xs text-red-400">Brak</span>
        )}
      </span>
    </div>
  );
}
