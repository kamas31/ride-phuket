// Reads a per-user email notification toggle, defaulting to ENABLED whenever
// it can't get a definitive `false`. This is deliberate: if migration 053
// hasn't been applied yet (column missing → query errors) or the read fails for
// any reason, notifications degrade to "on" (the default state) rather than
// silently going dark. Only an explicit stored `false` disables an email.

export async function isEmailNotifEnabled(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  admin: any,
  userId: string,
  column: 'email_notif_messages' | 'email_notif_whatsapp_leads',
): Promise<boolean> {
  try {
    const { data, error } = await admin.from('profiles').select(column).eq('id', userId).single()
    if (error) return true
    return data?.[column] === false ? false : true
  } catch {
    return true
  }
}
