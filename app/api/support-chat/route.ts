import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function getSupportSystemPrompt(): Promise<string> {
  try {
    // جلب البيانات الحية من site_settings
    const { data: settings } = await supabase
      .from("site_settings")
      .select("key, value");

    const s: Record<string, string> = {};
    settings?.forEach((r: any) => { s[r.key] = r.value; });

    // جلب System Prompt الخاص بالدعم من الأدمن
    const supportPrompt = s['ai_support_prompt'] || '';

    const liveData = `
## ⚙️ إعدادات المنصة الكاملة (محدّثة الآن من لوحة الأدمن):
${JSON.stringify(s, null, 2)}
`;

    const basePrompt = supportPrompt || `أنت مساعد دعم ذكي لمنصة عقار بروكر العقارية السعودية.
مهمتك مساعدة المستخدمين في حل مشاكلهم المتعلقة بالمنصة.
رد دائماً بالعربية بشكل مختصر وودي.
إذا سألك المستخدم عن عقارات أو بحث ← وجّهه لصفحة Broker AI أو صفحة العقارات.
إذا لم تستطع حل المشكلة بعد محاولتين، أخبر المستخدم بأنك ستحوله لفريق الدعم وأضف في نهاية ردك: [SHOW_TICKET]`;

    return basePrompt + "\n\n" + liveData;

  } catch (error) {
    console.error("Support prompt error:", error);
    return `أنت مساعد دعم ذكي لمنصة عقار بروكر العقارية السعودية.
مهمتك مساعدة المستخدمين في حل مشاكلهم المتعلقة بالمنصة.
رد دائماً بالعربية بشكل مختصر وودي.
إذا لم تستطع حل المشكلة بعد محاولتين، أضف في نهاية ردك: [SHOW_TICKET]`;
  }
}

export async function POST(req: NextRequest) {
  const { message, history } = await req.json();

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json({
      reply: "خدمة الذكاء الاصطناعي غير متاحة حالياً. يمكنك إرسال طلب دعم مباشرة.",
      showTicket: true
    });
  }

  try {
    const systemPrompt = await getSupportSystemPrompt();

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-5",
        max_tokens: 500,
        system: systemPrompt,
        messages: [
          ...history.map((m: any) => ({
            role: m.role === "assistant" ? "assistant" : "user",
            content: m.content
          })),
          { role: "user", content: message }
        ],
      }),
    });

    const data = await response.json();
    const reply = data.content?.[0]?.text || "عذراً، حدث خطأ.";
    const showTicket = reply.includes("[SHOW_TICKET]");

    return NextResponse.json({
      reply: reply.replace("[SHOW_TICKET]", "").trim(),
      showTicket,
    });

  } catch {
    return NextResponse.json({
      reply: "عذراً، حدث خطأ. يمكنك إرسال طلب دعم مباشرة.",
      showTicket: true
    });
  }
}