import type { UserProfile } from "./auth-context";
import { supabase } from "./supabase";

export type BusinessMemory = {
  companyName?: string;
  email?: string;
  phone?: string;
  address?: string;
  contactName?: string;
  defaults?: Record<string, unknown>;
};

export type BusinessUnit = {
  id: string;
  name: string;
  slug: string;
};

export type DocumentDraftInput = {
  userId: string;
  profile: UserProfile;
  documentType: string;
  title: string;
  businessUnitId?: string | null;
  formData: Record<string, string>;
  generatedContent: string;
};

function toMemory(row: Record<string, unknown> | null): BusinessMemory {
  if (!row) return {};
  return {
    companyName: typeof row.company_name === "string" ? row.company_name : "",
    email: typeof row.company_email === "string" ? row.company_email : "",
    phone: typeof row.company_phone === "string" ? row.company_phone : "",
    address: typeof row.company_address === "string" ? row.company_address : "",
    contactName:
      typeof row.default_contact_name === "string"
        ? row.default_contact_name
        : "",
    defaults:
      row.defaults && typeof row.defaults === "object"
        ? (row.defaults as Record<string, unknown>)
        : {},
  };
}

export async function loadBusinessMemory(
  userId: string,
): Promise<BusinessMemory> {
  const { data, error } = await supabase
    .from("nexdocs_business_memories")
    .select(
      "company_name, company_email, company_phone, company_address, default_contact_name, defaults",
    )
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throw error;
  return toMemory(data);
}

export async function saveBusinessMemory(
  userId: string,
  profile: UserProfile,
  memory: BusinessMemory,
): Promise<void> {
  const payload = {
    user_id: userId,
    organisation_id: profile.isCossaWorkspace
      ? profile.organisationId
      : null,
    company_name: memory.companyName?.trim() || null,
    company_email: memory.email?.trim() || null,
    company_phone: memory.phone?.trim() || null,
    company_address: memory.address?.trim() || null,
    default_contact_name: memory.contactName?.trim() || null,
    defaults: memory.defaults ?? {},
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabase
    .from("nexdocs_business_memories")
    .upsert(payload, { onConflict: "user_id" });

  if (error) throw error;
}

export async function listWorkspaceBusinessUnits(
  profile: UserProfile,
): Promise<BusinessUnit[]> {
  if (!profile.isCossaWorkspace || !profile.organisationId) return [];

  const { data, error } = await supabase
    .from("business_units")
    .select("id, name, slug")
    .eq("organisation_id", profile.organisationId)
    .eq("status", "active")
    .order("name");

  if (error) throw error;
  return (data ?? []) as BusinessUnit[];
}

export async function saveDocumentDraft(
  input: DocumentDraftInput,
): Promise<string> {
  const organisationId = input.profile.isCossaWorkspace
    ? input.profile.organisationId
    : null;

  const { data, error } = await supabase
    .from("nexdocs_document_drafts")
    .insert({
      user_id: input.userId,
      organisation_id: organisationId,
      business_unit_id: organisationId ? input.businessUnitId ?? null : null,
      document_type: input.documentType,
      title: input.title,
      form_data: input.formData,
      generated_content: input.generatedContent,
      status: "generated",
    })
    .select("id")
    .single();

  if (error) throw error;

  if (organisationId) {
    const { error: activityError } = await supabase
      .from("ops_documents")
      .insert({
        organisation_id: organisationId,
        business_unit_id: input.businessUnitId ?? null,
        nexdocs_document_id: data.id,
        title: input.title,
        category: input.documentType,
        status: "draft",
        notes: "Generated in NexDocs and available in the private NexDocs workspace.",
        created_by: input.userId,
      });

    if (activityError) {
      console.error("Could not add the Growth document activity", activityError);
    }
  }

  return data.id;
}

export function businessMemoryHint(memory: BusinessMemory): string | undefined {
  const lines = [
    memory.companyName ? "Company: " + memory.companyName : "",
    memory.contactName ? "Contact: " + memory.contactName : "",
    memory.email ? "Email: " + memory.email : "",
  ].filter(Boolean);

  return lines.length ? lines.join("\n") : undefined;
}
