// Client-only localStorage helpers for the NexDocs AI Business Assistant.
// Threads, business memory, and preferences live here so we can ship the
// full assistant workspace without new backend surface area yet.

import type { ChatMessage } from "./assistant.functions";

export type Conversation = {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  pinned?: boolean;
  favourite?: boolean;
  folder?: string;
  messages: ChatMessage[];
};

export type BusinessMemory = {
  companyName?: string;
  industry?: string;
  address?: string;
  registrationNumber?: string;
  vatNumber?: string;
  employees?: string;
  services?: string;
  brandColours?: string;
  email?: string;
  phone?: string;
  website?: string;
};

const CONV_KEY = "nexdocs.ai.conversations.v1";
const MEM_KEY = "nexdocs.ai.business-memory.v1";

const isBrowser = () => typeof window !== "undefined";

export function loadConversations(): Conversation[] {
  if (!isBrowser()) return [];
  try {
    const raw = window.localStorage.getItem(CONV_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Conversation[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveConversations(list: Conversation[]) {
  if (!isBrowser()) return;
  try {
    window.localStorage.setItem(CONV_KEY, JSON.stringify(list));
  } catch {
    /* quota — ignore */
  }
}

export function loadBusinessMemory(): BusinessMemory {
  if (!isBrowser()) return {};
  try {
    const raw = window.localStorage.getItem(MEM_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as BusinessMemory;
  } catch {
    return {};
  }
}

export function saveBusinessMemory(mem: BusinessMemory) {
  if (!isBrowser()) return;
  try {
    window.localStorage.setItem(MEM_KEY, JSON.stringify(mem));
  } catch {
    /* ignore */
  }
}

export function newConversation(title = "New chat"): Conversation {
  const now = Date.now();
  return {
    id: `c_${now}_${Math.random().toString(36).slice(2, 8)}`,
    title,
    createdAt: now,
    updatedAt: now,
    messages: [],
  };
}

export function titleFromPrompt(prompt: string): string {
  const t = prompt.trim().replace(/\s+/g, " ");
  return t.length > 48 ? `${t.slice(0, 48)}…` : t || "New chat";
}

export function businessMemoryToSystemHint(mem: BusinessMemory): string {
  const parts: string[] = [];
  if (mem.companyName) parts.push(`Company: ${mem.companyName}`);
  if (mem.industry) parts.push(`Industry: ${mem.industry}`);
  if (mem.address) parts.push(`Address: ${mem.address}`);
  if (mem.registrationNumber) parts.push(`Registration No: ${mem.registrationNumber}`);
  if (mem.vatNumber) parts.push(`VAT No: ${mem.vatNumber}`);
  if (mem.employees) parts.push(`Employees: ${mem.employees}`);
  if (mem.services) parts.push(`Services: ${mem.services}`);
  if (mem.brandColours) parts.push(`Brand colours: ${mem.brandColours}`);
  if (mem.email) parts.push(`Email: ${mem.email}`);
  if (mem.phone) parts.push(`Phone: ${mem.phone}`);
  if (mem.website) parts.push(`Website: ${mem.website}`);
  if (parts.length === 0) return "";
  return `The user's business profile (reuse automatically when drafting documents):\n${parts.join("\n")}`;
}
