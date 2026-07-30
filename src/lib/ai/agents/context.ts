// ==================================================
// Conversation Context — DB helpers for AI recruiter agent
// ==================================================
// Loads and saves per-candidate interview state from conversation_contexts.
// Each candidate has exactly one context row (upserted on first message).
// ==================================================

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DB = any; // Supabase admin client — typed at runtime

export type ContextMetadata = {
  greeting_sent?:      boolean;
  rejection_triggered?: boolean;
  rejection_reason?:   string;
  wrap_up_sent?:       boolean;
};

export type ConversationContext = {
  id:                     string;
  candidate_id:           string;
  organization_id:        string;
  current_question_index: number;
  is_complete:            boolean;
  metadata:               ContextMetadata;
};

// ── Load or create context for a candidate ────────────────────────────────────
export async function loadContext(
  supabase: DB,
  candidateId: string,
  organizationId: string
): Promise<ConversationContext> {
  const { data } = await supabase
    .from("conversation_contexts")
    .select("*")
    .eq("candidate_id", candidateId)
    .maybeSingle();

  if (data) return data as unknown as ConversationContext;

  const { data: created, error } = await supabase
    .from("conversation_contexts")
    .insert({
      candidate_id:           candidateId,
      organization_id:        organizationId,
      current_question_index: 0,
      is_complete:            false,
      metadata:               {},
    })
    .select()
    .single();

  if (error || !created) throw new Error(`Failed to create context: ${error?.message}`);
  return created as unknown as ConversationContext;
}

// ── Persist updated context state ─────────────────────────────────────────────
export async function saveContext(
  supabase: DB,
  candidateId: string,
  updates: Partial<Pick<ConversationContext, "current_question_index" | "is_complete" | "metadata">>
): Promise<void> {
  await supabase
    .from("conversation_contexts")
    .update(updates as Record<string, unknown>)
    .eq("candidate_id", candidateId);
}

// ── Append a message to whatsapp_messages ──────────────────────────────────────
export async function appendMessage(
  supabase: DB,
  params: {
    candidateId:    string;
    organizationId: string;
    direction:      "inbound" | "outbound";
    sender:         "candidate" | "ai" | "recruiter";
    content:        string;
    mediaUrl?:      string;
    providerId?:    string;  // dedup key
  }
): Promise<void> {
  await supabase.from("whatsapp_messages").insert({
    candidate_id:        params.candidateId,
    organization_id:     params.organizationId,
    direction:           params.direction,
    sender:              params.sender,
    content:             params.content,
    media_url:           params.mediaUrl ?? null,
    whatsapp_message_id: params.providerId ?? null,
  });
}

// ── Load last N messages as chat transcript ────────────────────────────────────
export async function loadTranscript(
  supabase: DB,
  candidateId: string,
  limit = 20
): Promise<Array<{ role: "user" | "assistant"; content: string }>> {
  const { data } = await supabase
    .from("whatsapp_messages")
    .select("direction, sender, content")
    .eq("candidate_id", candidateId)
    .order("sent_at", { ascending: false })
    .limit(limit);

  if (!data) return [];

  return data
    .reverse()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .map((m: any) => ({
      role:    m.direction === "inbound" ? "user" : "assistant",
      content: m.content,
    }));
}
