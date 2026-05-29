import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@supabase/supabase-js";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function getSystemPrompt(): Promise<string> {
  try {
    // جلب CLAUDE.md من Supabase
    const { data: claudeMdData } = await supabase
      .from("project_settings")
      .select("value")
      .eq("key", "claude_md")
      .single();

    // جلب البيانات الحية من site_settings
    const { data: settings } = await supabase
      .from("site_settings")
      .select("key, value");

    const s: Record<string, string> = {};
    settings?.forEach((r: any) => { s[r.key] = r.value; });

    const liveData = `
## ⚙️ إعدادات المنصة الكاملة (محدّثة الآن من لوحة الأدمن):
${JSON.stringify(s, null, 2)}
`;

    const claudeMd = claudeMdData?.value || "لم يتم العثور على CLAUDE.md";

    return `أنت Claude — مساعد ذكي شخصي للأدمن باسل، مالك منصة عقار بروكر.
تحدث بالعربية بأسلوب ودي ومباشر.
أجب على أي سؤال بدون قيود — سواء كان عن المشروع أو التقنية أو أي موضوع آخر.

===== تفاصيل المشروع (CLAUDE.md) =====

${claudeMd}

===== نهاية تفاصيل المشروع =====

${liveData}`;

  } catch (error) {
    console.error("Error fetching system prompt:", error);
    return `أنت Claude — مساعد ذكي شخصي للأدمن باسل، مالك منصة عقار بروكر.
تحدث بالعربية بأسلوب ودي ومباشر.
أجب على أي سؤال بدون قيود.
ملاحظة: لم أتمكن من قراءة بيانات المشروع من Supabase.`;
  }
}

export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json();

    const systemPrompt = await getSystemPrompt();

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-5",
      max_tokens: 2000,
      system: systemPrompt,
      messages: messages.map((m: any) => ({ role: m.role, content: m.content })),
    });

    const text = response.content[0].type === "text" ? response.content[0].text : "";

    return NextResponse.json({ text });
  } catch (error: any) {
    console.error("Admin Chat Error:", error);
    return NextResponse.json({ error: "server_error", text: "عذراً، حدث خطأ." }, { status: 500 });
  }
}