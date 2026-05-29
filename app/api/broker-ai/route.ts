import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@supabase/supabase-js";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function getAISettings() {
  const { data } = await supabase.from("site_settings").select("key, value");
  if (!data) return null;
  const m: Record<string, string> = {};
  data.forEach((r: any) => { m[r.key] = r.value; });

  const basePrompt = m['ai_system_prompt'] || `أنت Broker AI — مساعد عقاري ذكي متخصص في السوق السعودي لمنصة عقار بروكر.
تحدث دائماً بالعربية بأسلوب ودي واحترافي.
مهامك الرئيسية:
- مساعدة المستخدمين في البحث عن عقارات مناسبة
- تحليل الأسعار ومقارنتها بالسوق
- حساب الأقساط الشهرية للتمويل العقاري
- مقارنة الأحياء والمناطق
- الإجابة على أسئلة العقود والتراخيص
- تقدير العائد الاستثماري
عند ذكر عقارات من قاعدة البيانات، أضف IDs في: ‹PROPERTIES›["id1","id2"]‹/PROPERTIES›`;

  // إرسال كامل site_settings لـ Claude
  const allSettings = `
## ⚙️ كامل إعدادات وقرارات المنصة (محدّثة الآن من لوحة الأدمن):
${JSON.stringify(m, null, 2)}

## 📖 شرح المفاتيح المهمة:
- ai_enabled: تفعيل/إيقاف المساعد
- ai_guest_limit: حد رسائل الزوار غير المسجلين (${m['ai_guest_limit'] || '5'})
- ai_free_user_limit: حد رسائل المسجلين بدون باقة (${m['ai_free_user_limit'] || 'غير محدود حالياً'})
- packages_enabled: هل الباقات مفعّلة (${m['packages_enabled']})
- payments_enabled: هل الدفع مفعّل (${m['payments_enabled']})
- pkg1_name/price/ads/reels/duration: تفاصيل الباقة الأساسية
- pkg2_name/price/ads/reels/duration: تفاصيل الباقة المتوسطة
- pkg3_name/price/ads/reels/duration: تفاصيل الباقة المتقدمة
- pkg4_name/price/ads/reels/duration: تفاصيل الباقة البريميم
- free_reels: عدد Reels للمستخدم المجاني (${m['free_reels'] || '3'})
- contractor_monthly/yearly: أسعار اشتراك المقاولين
- engineer_monthly/yearly: أسعار اشتراك المهندسين
- boost_price/duration: سعر ومدة تمييز الإعلان
- map_pkg_price/duration: سعر ومدة باقة الخريطة
- broker_requires_fal: هل المسوق يحتاج رخصة فال
- owner_requires_sakk: هل المالك يحتاج صك
- nafath_enabled: هل نفاذ مفعّل (${m['nafath_enabled']})
- auto_activate_*: التفعيل التلقائي لكل دور
`;

  return {
    enabled: m['ai_enabled'] !== 'false',
    model: m['ai_model'] || 'claude-sonnet-4-5',
    maxTokens: Number(m['ai_max_tokens']) || 1000,
    temperature: Number(m['ai_temperature']) || 0.7,
    searchEnabled: m['ai_search_enabled'] !== 'false',
    systemPrompt: basePrompt + "\n\n" + allSettings,
    guestLimit: Number(m['ai_guest_limit']) || 5,
    freeUserLimit: Number(m['ai_free_user_limit']) || 0,
    rawSettings: m,
  };
}

async function checkUserLimit(userId: string, freeUserLimit: number): Promise<boolean> {
  // إذا الحد 0 = مجاني بالكامل
  if (freeUserLimit === 0) return true;

  const today = new Date().toISOString().split('T')[0];

  // جلب أو إنشاء سجل الاستخدام
  const { data: usage } = await supabase
    .from('ai_usage')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (!usage) {
    // مستخدم جديد — أنشئ سجل
    await supabase.from('ai_usage').insert({
      user_id: userId,
      message_count: 1,
      last_reset: today,
    });
    return true;
  }

  // إذا آخر reset كان أمس أو قبل → صفّر العداد
  if (usage.last_reset < today) {
    await supabase.from('ai_usage').update({
      message_count: 1,
      last_reset: today,
      updated_at: new Date().toISOString(),
    }).eq('user_id', userId);
    return true;
  }

  // تحقق من الحد
  if (usage.message_count >= freeUserLimit) return false;

  // زد العداد
  await supabase.from('ai_usage').update({
    message_count: usage.message_count + 1,
    updated_at: new Date().toISOString(),
  }).eq('user_id', userId);

  return true;
}

async function logActivity(action: string, status: string = 'success', details?: string) {
  await supabase.from('ai_activity_log').insert({ action, status, details });
}

async function searchProperties(query: string) {
  let q = supabase
    .from("properties")
    .select("id, title, type, purpose, price, city, district, rooms, baths, area, images")
    .eq("status", "active")
    .limit(6);

  const cities = ["الرياض", "جدة", "مكة", "المدينة", "الدمام", "الخبر", "الطائف", "أبها", "تبوك"];
  for (const city of cities) {
    if (query.includes(city)) { q = q.eq("city", city); break; }
  }

  const types = ["شقة", "فيلا", "أرض", "مكتب", "استراحة", "دوبلكس", "عمارة", "محل تجاري", "مستودع"];
  for (const type of types) {
    if (query.includes(type)) { q = q.eq("type", type); break; }
  }

  if (query.includes("إيجار يومي") || query.includes("يومي")) {
    q = q.eq("purpose", "إيجار يومي");
  } else if (query.includes("إيجار") || query.includes("للإيجار")) {
    q = q.eq("purpose", "إيجار");
  } else if (query.includes("بيع") || query.includes("للبيع") || query.includes("شراء")) {
    q = q.eq("purpose", "بيع");
  }

  const priceMatch = query.match(/(\d[\d,.]*)(\s*)(ألف|مليون|ريال)?/);
  if (priceMatch) {
    let price = parseFloat(priceMatch[1].replace(/,/g, ""));
    if (priceMatch[3] === "مليون") price *= 1000000;
    if (priceMatch[3] === "ألف") price *= 1000;
    if (price > 1000) q = q.lte("price", price * 1.2);
  }

  const { data } = await q.order("created_at", { ascending: false });
  return data || [];
}

export async function POST(req: NextRequest) {
  try {
    const { messages, guestCount, userId } = await req.json();

    const aiSettings = await getAISettings();
    if (!aiSettings) {
      return NextResponse.json({ error: "server_error" }, { status: 500 });
    }

    // تحقق: المساعد مفعّل؟
    if (!aiSettings.enabled) {
      return NextResponse.json({ text: "المساعد غير متاح حالياً. يرجى المحاولة لاحقاً.", properties: [] });
    }

    // تحقق: زائر غير مسجل
    if (!userId && guestCount !== undefined && guestCount >= aiSettings.guestLimit) {
      return NextResponse.json({ error: "limit_reached" }, { status: 429 });
    }

    // تحقق: مستخدم مسجل بدون باقة
    if (userId && aiSettings.freeUserLimit > 0) {
      const allowed = await checkUserLimit(userId, aiSettings.freeUserLimit);
      if (!allowed) {
        return NextResponse.json({ error: "limit_reached" }, { status: 429 });
      }
    }

    const lastUserMessage = messages[messages.length - 1]?.content || "";

    const searchKeywords = ["عقار", "شقة", "فيلا", "أرض", "مكتب", "استراحة", "غرفة", "أبحث", "ابحث", "أريد", "أبي", "ابي", "بيع", "إيجار", "للبيع", "للإيجار", "عندك", "في"];
    const isSearchQuery = searchKeywords.some((k) => lastUserMessage.includes(k));

    let properties: any[] = [];
    let propertiesContext = "";

    if (isSearchQuery) {
      properties = await searchProperties(lastUserMessage);
      await logActivity(`بحث عن عقارات: ${lastUserMessage.slice(0, 50)}`, 'success', `وجد ${properties.length} نتيجة`);
      if (properties.length > 0) {
        propertiesContext = `\n\nالعقارات المتاحة حالياً في منصة عقار بروكر:\n${JSON.stringify(
          properties.map((p) => ({
            id: p.id, title: p.title, type: p.type, purpose: p.purpose,
            price: p.price, city: p.city, district: p.district, rooms: p.rooms, area: p.area,
          })), null, 2
        )}\n\nاستخدم هذه البيانات الحقيقية في ردك. إذا وجدت عقارات مناسبة أضف IDs في: ‹PROPERTIES›["id1","id2"]‹/PROPERTIES›`;
      }
    }

    const systemFull = aiSettings.systemPrompt + propertiesContext;

    const requestBody: any = {
      model: aiSettings.model,
      max_tokens: aiSettings.maxTokens,
      system: systemFull,
      messages: messages.map((m: any) => ({ role: m.role, content: m.content })),
    };

    if (aiSettings.searchEnabled) {
      requestBody.tools = [{ type: "web_search_20250305", name: "web_search" }];
    }

    const response = await anthropic.messages.create(requestBody);

    let aiText = "";
    let webSearchUsed = false;
    for (const block of response.content) {
      if (block.type === "text") aiText += block.text;
      if (block.type === "tool_use" && block.name === "web_search") webSearchUsed = true;
    }

    if (webSearchUsed) {
      await logActivity('بحث على الإنترنت عن أسعار السوق', 'success');
    }

    const propMatch = aiText.match(/‹PROPERTIES›(\[.*?\])‹\/PROPERTIES›/s);
    let propertyIds: string[] = [];
    if (propMatch) {
      try { propertyIds = JSON.parse(propMatch[1]); } catch {}
    }

    let matchedProperties: any[] = [];
    if (propertyIds.length > 0) {
      const { data } = await supabase
        .from("properties")
        .select("id, title, type, purpose, price, city, district, rooms, baths, area, images")
        .in("id", propertyIds);
      matchedProperties = data || [];
    } else if (isSearchQuery && properties.length > 0) {
      matchedProperties = properties.slice(0, 3);
    }

    await logActivity(`رد على استفسار: ${lastUserMessage.slice(0, 50)}`, 'success');

    const cleanText = aiText.replace(/‹PROPERTIES›.*?‹\/PROPERTIES›/s, "").trim();

    return NextResponse.json({ text: cleanText, properties: matchedProperties });

  } catch (error: any) {
    console.error("Broker AI Error:", error);
    await logActivity('خطأ في معالجة الطلب', 'error', error.message);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}