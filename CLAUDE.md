# 🏠 Aqar Broker — CLAUDE.md
> اقرأ هذا الملف كاملاً قبل أي عمل على المشروع

---

## 📌 معلومات المشروع
- **الاسم:** عقار بروكر / Aqar Broker
- **الدومين:** aqarbroker.com
- **المالك:** باسل
- **المسار:** `C:\Users\basse\Projects\aqar-broker`
- **تشغيل السيرفر:** `npm run dev` ← http://localhost:3000
- **حساب الأدمن:** horizon3dmodels@gmail.com
- **لوحة الأدمن:** http://localhost:3000/admin/login

---

## 🛠️ Tech Stack
| التقنية | الحالة |
|---|---|
| Next.js 14 + TypeScript | ✅ يعمل |
| Supabase | ✅ متصل |
| Mapbox GL + Geocoder | ✅ مربوط |
| Cairo Font | ✅ يعمل |
| Claude API (Anthropic) | ✅ مربوط |
| Moyasar | ⏳ لم يُربط |
| Resend | ⏳ يحتاج دومين |
| Vercel | ⏳ لم يُرفع |

---

## ⚠️ قواعد صارمة
1. لا تضف Navbar أو Footer داخل أي صفحة
2. كل الصفحات بالعربي — dir="rtl" + خط Cairo
3. استخدم Link من next/link
4. import { supabase } from "@/lib/supabaseClient"
5. لا تستخدم Tailwind — inline styles فقط
6. الخرائط: Mapbox GL فقط — لا Leaflet
7. الخريطة العربية: استخدم setRTLTextPlugin + فحص getLayer قبل setLayoutProperty
8. جدول notifications — عمود type يقبل: message / like / comment / follow / share

---

## ✅ الصفحات المربوطة بـ Supabase

| الملف | الحالة |
|---|---|
| `app/page.tsx` | ✅ الصفحة الرئيسية مربوطة + بحث + أيقونات |
| `app/add-property/page.tsx` | ✅ MapPicker + geocoder + رفع صور + زر Reel في Step 5 |
| `app/map/page.tsx` | ✅ 4 تابات + markers |
| `app/profile/page.tsx` | ✅ مربوط + مفضلة + رسائل + إشعارات + مشاهدات حقيقية + تقييم حقيقي + تاب إحصائيات + تاب Reels (grid حقيقي) + عداد متابعين/Reels + رفع صورة شخصية |
| `app/profile/[id]/page.tsx` | ✅ ملف شخصي عام — يتكيف حسب الدور (مسوق/مقاول/مهندس) + زر متابعة + Lightbox للصور + فلاتر إعلانات |
| `app/properties/page.tsx` | ✅ مربوط + فلاتر + أزرار مشاركة + فلتر "أخرى" + مستثنى إيجار يومي + نظام مقارنة كامل |
| `app/properties/[id]/page.tsx` | ✅ مربوط + رسائل + مفضلة + مشاهدات حقيقية + تقييم + خريطة Mapbox عربية + Breadcrumb ذكي + زر أضف للمقارنة + رابط الوسيط → profile |
| `app/compare/page.tsx` | ✅ صفحة مقارنة العقارات + جدول كامل + ميداليات |
| `app/daily-rent/page.tsx` | ✅ مربوط بـ Supabase + أزرار مشاركة + grid/list |
| `app/projects/page.tsx` | ✅ مربوط |
| `app/projects/[id]/page.tsx` | ✅ مربوط |
| `app/contractors/page.tsx` | ✅ مربوط بـ profiles role=contractor |
| `app/contractors/[id]/page.tsx` | ✅ مربوط + نظام تقييم target_type=contractor + تاب Reels + زر متابعة + عداد متابعين |
| `app/engineering/page.tsx` | ✅ مربوط بـ profiles role=engineer |
| `app/engineering/[id]/page.tsx` | ✅ مربوط + نظام تقييم target_type=engineer + تاب Reels + زر متابعة + عداد متابعين |
| `app/pricing/page.tsx` | ✅ مربوط بـ site_settings — أسعار حقيقية |
| `app/requests/page.tsx` | ✅ لوحة الطلبات — فلاتر + كاردات قابلة للضغط |
| `app/requests/new/page.tsx` | ✅ نموذج إضافة طلب + رقم تواصل + إشعارات للمختصين |
| `app/requests/[id]/page.tsx` | ✅ تفاصيل الطلب + واتساب + اتصال مباشر |
| `app/messages/page.tsx` | ✅ مربوط + Realtime + علامة تم القراءة |
| `app/notifications/page.tsx` | ✅ مربوط بـ Supabase |
| `app/support/page.tsx` | ✅ نموذج دعم مربوط بـ Supabase |
| `app/blog/page.tsx` | ✅ مربوط بـ Supabase |
| `app/blog/[slug]/page.tsx` | ✅ مربوط بـ Supabase + sidebar + مشاركة |
| `app/edit-property/[id]/page.tsx` | ✅ مربوط + MapPicker |
| `app/auth/register/page.tsx` | ✅ مربوط بـ Supabase + رفع صورة شخصية عند التسجيل |
| `app/reels/page.tsx` | ✅ TikTok style + تابات (الكل/عقار/تصميم وتنفيذ) + لايك + تعليق + حفظ + مشاركة + متابعة + views_count + إعادة التشغيل + إشعارات |
| `app/reels/upload/page.tsx` | ✅ رفع Reels + فئتان + ربط بعقار + حد 50MB/90ث + فحص حد الباقة |
| `app/reels/[id]/page.tsx` | ✅ صفحة Reel مستقل — مشاركة + لايك + تعليق + متابعة + إشعارات |
| `app/broker-ai/page.tsx` | ✅ واجهة دردشة احترافية + بحث Supabase + Web Search + محادثات محفوظة |
| `app/admin/page.tsx` | ✅ مربوط بـ Supabase |
| `app/admin/dashboard/page.tsx` | ✅ مربوط بـ Supabase |
| `app/admin/properties/page.tsx` | ✅ مربوط بـ Supabase |
| `app/admin/users/page.tsx` | ✅ مربوط بـ Supabase |
| `app/admin/contractors/page.tsx` | ✅ مربوط بـ Supabase |
| `app/admin/engineering/page.tsx` | ✅ مربوط بـ Supabase |
| `app/admin/pricing/page.tsx` | ✅ مربوط بـ Supabase — تحكم كامل بالباقات + حقل عدد Reels لكل باقة |
| `app/admin/settings/page.tsx` | ✅ مربوط بـ Supabase |
| `app/admin/discounts/page.tsx` | ✅ مربوط بـ Supabase |
| `app/admin/daily-rent/page.tsx` | ✅ مربوط بـ Supabase |
| `app/admin/licenses/page.tsx` | ✅ مربوط بـ Supabase |
| `app/admin/reports/page.tsx` | ✅ مربوط بـ Supabase |
| `app/admin/notifications/page.tsx` | ✅ مربوط بـ Supabase |
| `app/admin/support/page.tsx` | ✅ مربوط بـ Supabase |
| `app/admin/ai/page.tsx` | ✅ مربوط بـ Supabase — إعدادات كاملة + System Prompts + سجل نشاط حقيقي + زر دردشة الأدمن |
| `app/admin/ai-chat/page.tsx` | ✅ دردشة الأدمن مع Claude بدون قيود — يقرأ CLAUDE.md تلقائياً |
| `app/admin/blog/page.tsx` | ✅ CRUD كامل + رفع صور + محرر محتوى |
| `app/admin/projects/page.tsx` | ✅ CRUD + Mapbox + صور متعددة |
| `app/admin/login/page.tsx` | ✅ تحقق من role=admin |
| `app/admin/layout.tsx` | ✅ عدادات حقيقية من Supabase |
| `app/admin/reels/page.tsx` | ✅ إدارة Reels — عرض + حظر/تفعيل + حذف + فلاتر + إحصائيات |

---

## 🗄️ قاعدة البيانات

### RLS معطل على جميع الجداول ⚠️ — يُفعَّل قبل الإطلاق

### أعمدة جدول properties المهمة:
- `type` — نوع العقار (شقة، فيلا، أرض، مكتب، استراحة، دوبلكس، عمارة، محل تجاري، مستودع، أخرى)
- `purpose` — الغرض (بيع، إيجار، إيجار يومي) — **وليس listing_type**
- `status` — (active, draft, pending)
- `rooms` — عدد الغرف — **وليس bedrooms**
- `baths` — عدد الحمامات
- `city`, `district`, `address`, `lat`, `lng`
- `views` — عداد المشاهدات — يُحدَّث عبر `increment_views` RPC

### الجداول الموجودة:
- `profiles` — المستخدمون (role: owner/broker/contractor/engineer/admin)
- `properties` — العقارات
- `projects` — المشاريع الكبرى
- `messages` — الرسائل
- `notifications` — الإشعارات (type يقبل: message/like/comment/follow/share ✅)
- `favorites` — المفضلة
- `site_settings` — إعدادات الموقع + الأسعار + AI + إعدادات Reels
- `discount_codes` — أكواد الخصم
- `support_tickets` — تذاكر الدعم
- `support_replies` — ردود الدعم
- `notification_templates` — قوالب الإشعارات
- `blog_posts` — المدونة
- `reviews` — التقييمات (reviewer_id, target_id, target_type, rating, comment)
- `property_views` — سجل المشاهدات (موجود لكن غير مستخدم — نستخدم عمود views)
- `requests` — لوحة الطلبات (id, user_id, type, title, description, budget, city, phone, status, created_at)
- `reels` — الريلز (user_id, title, description, video_url, thumbnail_url, category, property_id, city, views_count, likes_count, comments_count, status)
- `reel_likes` — لايكات الريلز (user_id, reel_id) — unique constraint
- `reel_comments` — تعليقات الريلز (user_id, reel_id, content)
- `reel_saves` — محفوظات الريلز (user_id, reel_id) — unique constraint
- `follows` — المتابعة (follower_id, following_id) — unique constraint
- `ai_conversations` — محادثات Broker AI (user_id, title, messages, updated_at)
- `ai_activity_log` — سجل نشاط AI (action, status, details, created_at)

### requests — ملاحظات مهمة:
- `type` — قيم ممكنة: `عقار` / `مقاول` / `مكتب هندسي`
- `phone` — رقم التواصل الخاص بالطلب
- الإشعارات تُرسل لـ: broker (عقار) / contractor (مقاول) / engineer (مكتب هندسي)

### reviews — ملاحظات مهمة:
- `target_type` — قيم ممكنة: `broker` / `contractor` / `engineer`
- unique constraint على (reviewer_id, target_id, target_type) ✅ مضاف
- upsert لتحديث التقييم السابق

### site_settings — مفاتيح AI:
- `ai_enabled` — تفعيل/إيقاف المساعد
- `ai_model` — النموذج المستخدم
- `ai_max_tokens` — الحد الأقصى للرد
- `ai_temperature` — مستوى الإبداع
- `ai_search_enabled` — تفعيل البحث على الإنترنت
- `ai_auto_reply` — الرد التلقائي
- `ai_system_prompt` — توجيهات Broker AI
- `ai_support_prompt` — توجيهات مساعد الدعم
- `ai_language` — لغة الردود
- `ai_guest_limit` — حد رسائل الزوار (افتراضي: 5)

### site_settings — مفاتيح Reels:
- `free_reels` — عدد Reels للمستخدم المجاني (افتراضي: 3)
- `pkg1_reels` — عدد Reels للباقة الأساسية (افتراضي: 10)
- `pkg2_reels` — عدد Reels للباقة المتوسطة (افتراضي: 25)
- `pkg3_reels` — عدد Reels للباقة المتقدمة (افتراضي: 50)
- `pkg4_reels` — عدد Reels للباقة البريميم (افتراضي: 999)

### SQL Functions:
- `increment_views(property_id uuid)` — تزيد عمود views بمقدار 1 ✅

---

## 🤖 خطة الذكاء الاصطناعي الكاملة

### 🌟 صفحة بروكر AI — الميزة الرئيسية ✅ مكتملة
- صفحة مستقلة `app/broker-ai/page.tsx` تفتح في تاب جديد
- شكلها مثل Claude.ai — واجهة دردشة احترافية
- **زائر غير مسجل:** 5 رسائل مجانية ثم طلب تسجيل
- **مسجل:** دردشة كاملة بلا حدود — مجاناً
- يجلب العقارات الحقيقية من Supabase داخل الدردشة
- يعرض بطاقات العقارات مباشرة في المحادثة
- يفتح روابط مباشرة للعقارات والوسطاء

### داخل صفحة بروكر AI يستطيع:
- بحث ذكي بالوصف الطبيعي وعرض العقارات داخل الدردشة
- تقرير كامل لأي عقار (السعر، الإيجابيات، السلبيات، القيمة المستقبلية)
- مقارنة بين عقارين أو أكثر
- تنبيه فوري عند توفر عقار يناسب المستخدم
- تحليل السعر مقارنة بالسوق
- حساب القسط الشهري للتمويل العقاري
- تقدير العائد الاستثماري
- مخطط البناء الذكي (مساحة + ميزانية → تصميم + تكلفة + قائمة مقاولين)
- تحليل عقد الإيجار وكشف البنود الخطرة
- إجابة على أسئلة رخصة REGA وفال والعقود
- كتابة وصف احترافي للإعلان (للوسطاء)
- Web Search لأسعار البناء والتشطيب المحدثة

### أمثلة على المحادثة:
- العميل: أبحث عن شقة في الرياض → AI: يعرض بطاقات عقارات حقيقية من Supabase
- العميل: أرخص منها → AI: يفلتر ويعرض نتائج جديدة
- العميل: كم تكلفة التحويل؟ → AI: يشرح بالتفصيل
- العميل: أبي أتواصل مع الوسيط → AI: يفتح صفحة التواصل مباشرة

### 🚀 AI Agent للأدمن (المرحلة الثانية — بعد الإطلاق):

**إدارة الإعلانات:**
- مراجعة وموافقة تلقائية على الإعلانات الجديدة
- كشف الإعلانات المزيفة (سعر شاذ، صور مكررة، معلومات متناقضة)
- تجديد الإعلانات المنتهية تلقائياً
- كتابة وصف احترافي للإعلانات الناقصة

**إدارة المستخدمين:**
- رسائل ترحيب تلقائية لكل مستخدم جديد
- تنبيه قبل 7 أيام من انتهاء الباقة
- كشف الحسابات الوهمية
- تصنيف الوسطاء حسب النشاط والأداء

**التقارير الذكية:**
- تقرير يومي/أسبوعي/شهري على إيميل الأدمن
- أكثر الأحياء طلباً + أكثر الوسطاء نشاطاً
- مقارنة أداء الموقع بالفترة السابقة
- تنبيه فوري لأي نشاط غير طبيعي

**إدارة الحملات الإعلانية:**
- يحلل بيانات الموقع ويحدد الجمهور المستهدف
- يكتب نسخ إعلانية لكل منصة (سناب، تويتر، انستغرام، جوجل)
- يصمم بوسترات عبر Canva API
- يجهّز الحملة كاملة — أنت تضغط "موافق" فقط
- يراقب الأداء ويرسل تقارير أسبوعية
- يربط مع Meta Pixel و Google Analytics للاستهداف الدقيق

**السوشيال ميديا:**
- نشر تلقائي على تويتر وانستغرام
- كتابة كابشن احترافي مع هاشتاقات مناسبة
- اختيار أفضل وقت للنشر

**الدعم الذكي:**
- الرد التلقائي على التذاكر البسيطة
- تصنيف التذاكر حسب الأولوية 🔴🟡🟢
- تلخيص المشاكل المتكررة أسبوعياً

### 📊 التكلفة التقديرية:
- النموذج المستخدم: Claude Sonnet 4.5
- تكلفة محادثة 20 رسالة: أقل من 0.20 ر.س
- AI للمستخدمين: أقل من $5 شهرياً
- AI Agent للأدمن: $10-50 شهرياً
- إجمالي AI شهرياً: أقل من 35 ر.س

---

## 🤖 نظام الذكاء الاصطناعي — مكتمل ✅

### الصفحات:
- `app/broker-ai/page.tsx` ✅ — واجهة دردشة احترافية
- `app/api/broker-ai/route.ts` ✅ — API مع Supabase + Web Search
- `app/api/support-chat/route.ts` ✅ — API مساعد الدعم
- `app/api/admin-chat/route.ts` ✅ — API دردشة الأدمن (يقرأ CLAUDE.md تلقائياً)
- `app/admin/ai/page.tsx` ✅ — إعدادات كاملة من الأدمن
- `app/admin/ai-chat/page.tsx` ✅ — دردشة الأدمن بدون قيود
- `components/SupportWidget.tsx` ✅ — زر ✨ يفتح Broker AI

### Broker AI — المميزات:
- واجهة دردشة مثل Claude.ai
- بحث في Supabase — يجلب العقارات الحقيقية
- Web Search — يبحث عن أسعار السوق الحديثة
- محادثات محفوظة في Supabase للمستخدمين المسجلين
- 5 رسائل مجانية للزوار ثم طلب تسجيل
- مجاني بالكامل للمستخدمين المسجلين
- بطاقات عقارات تظهر داخل المحادثة
- اقتراحات سريعة (احسب القسط / قارن حيين / حلل عقد)

### مساعد الدعم (SupportWidget):
- زر ✨ أزرق في الزاوية اليسرى السفلى
- يفتح صفحة broker-ai في تاب جديد

### دردشة الأدمن:
- صفحة `/admin/ai-chat` للأدمن فقط
- Claude بدون قيود أو System Prompt مقيد
- يقرأ CLAUDE.md تلقائياً من مجلد المشروع
- كل تحديث في CLAUDE.md → Claude يعرفه فوراً

### لوحة الأدمن — admin/ai:
- تفعيل/إيقاف المساعد
- تفعيل البحث على الإنترنت
- اختيار النموذج (Sonnet/Opus/Haiku)
- حد رسائل الزوار قابل للتعديل
- System Prompt منفصل لكل مساعد (Broker AI + الدعم)
- سجل نشاط حقيقي من ai_activity_log يتحدث كل 30 ثانية
- إحصائيات حقيقية (نشاط اليوم + الإجمالي)
- زر "دردشة الأدمن" يفتح /admin/ai-chat

### نموذج الاشتراك:
- **زائر غير مسجل:** 5 رسائل مجانية
- **مسجل:** مجاني بالكامل بلا حدود

---

## 🎬 نظام Reels — مكتمل ✅

### الصفحات:
- `app/reels/page.tsx` ✅
- `app/reels/upload/page.tsx` ✅
- `app/reels/[id]/page.tsx` ✅
- `app/admin/reels/page.tsx` ✅

### المميزات المكتملة:
- تابات: الكل / عقار / تصميم وتنفيذ (فئتان فقط)
- بحث بالعنوان والوصف
- لايك + تعليق + حفظ + مشاركة واتساب + نسخ رابط
- زر تابع / متابَع
- ربط Reel بعقار موجود
- درج تعليقات من الأسفل
- كتم/تشغيل الصوت
- scroll snap عمودي
- أيقونة Reels في النافبار (دائرية خضراء في المنتصف)
- views_count يتحدث عند المشاهدة (localStorage dedup)
- إعادة التشغيل من الأول + رسالة عند انتهاء الريلز
- إشعارات: لايك / تعليق / متابعة
- فحص حد الباقة عند الرفع
- تاب Reels في البروفايل (grid حقيقي)
- تاب Reels في صفحة المقاول
- تاب Reels في صفحة المهندس
- زر "هل تريد إضافة Reel؟" في Step 5 من add-property
- إدارة Reels في الأدمن (عرض + حظر + حذف)
- الأدمن يتحكم بعدد Reels لكل باقة

### الفئات:
- `عقار` — عقارات للبيع والإيجار السنوي واليومي
- `تصميم وتنفيذ` — مقاولات وتشطيب + تصميم هندسي وديكور داخلي

### حدود الفيديو:
- الحجم: 50MB
- المدة: 90 ثانية

---

## 👤 نظام البروفايل العام — مكتمل ✅

### الصفحة:
- `app/profile/[id]/page.tsx` ✅

### المميزات:
- يتكيف حسب الدور تلقائياً:
  - **broker/owner** → يعرض الإعلانات + فلاتر (بيع/إيجار/إيجار يومي)
  - **contractor/engineer** → يعرض المشاريع + Lightbox للصور
- زر متابعة + إشعار
- Stats Bar: إعلانات / متابعين / تقييم / Reels
- تاب Reels grid
- Header بنر داكن مع اسم + دور + مدينة

### رفع الصورة الشخصية:
- في `app/profile/page.tsx` — hover على الصورة → 📷
- في تاب الإعدادات — زر "تغيير الصورة"
- في `app/auth/register/page.tsx` — دائرة في Step 1

---

## 🔄 نظام المقارنة ✅
- زر "قارن" على كل كارد في `/properties`
- عند أول إضافة تظهر toast توجيهية 3 ثواني
- عند الضغط على كارد (والشريط نشط) يُضاف للمقارنة مباشرة
- شريط عائم في الأسفل مع صور العقارات
- زر "أضف للمقارنة" في صفحة التفاصيل
- حد أقصى 4 عقارات
- الانتقال لـ `/compare?ids=...`
- صفحة `/compare` بجدول كامل + ميداليات ذهبية/فضية/برونزية

---

## 💰 الباقات الأربع
| # | الاسم | السعر | الإعلانات | Reels |
|---|---|---|---|---|
| 1 | الأساسية | 199 ر.س/شهر | 10 | 10 |
| 2 | المتوسطة | 399 ر.س/شهر | 25 | 25 |
| 3 | المتقدمة | 699 ر.س/شهر | 50 | 50 |
| 4 | البريميم | 999 ر.س/شهر | 100 | غير محدود |
| - | مجاني | 0 | - | 3 |

---

## ⏳ المهام المتبقية

### أولوية عالية:
1. ~~ANTHROPIC_API_KEY + بناء broker-ai~~ ✅ مكتمل
2. ربط Moyasar للدفع

### قبل الإطلاق:
3. نقل الدومين من Hostinger إلى Vercel
4. توثيق الدومين في Resend
5. تفعيل RLS على جميع الجداول
6. رفع على GitHub ← Vercel
7. تفعيل تأكيد الإيميل
8. تغيير روابط localhost للدومين
9. إضافة إشعارات تذاكر الدعم (داخل الموقع + إيميل)
10. ربط Meta Pixel + Google Analytics

### بعد الإطلاق:
11. AI Agent للأدمن (تقارير + إدارة إعلانات + حملات + سوشيال ميديا)
12. ربط Canva API لتصميم البوسترات تلقائياً
13. ربط Meta Ads + Google Ads + Snapchat API للحملات الإعلانية

### أولوية جداً جداً عالية:
14. نقل CLAUDE.md إلى Supabase (جدول project_settings) حتى يتحدث Claude تلقائياً بدون رفع جديد على Vercel

---

## 🔧 متغيرات البيئة (.env.local)
```
NEXT_PUBLIC_SUPABASE_URL ✅
NEXT_PUBLIC_SUPABASE_ANON_KEY ✅
NEXT_PUBLIC_MAPBOX_TOKEN ✅
RESEND_API_KEY ✅ في Supabase SMTP
ANTHROPIC_API_KEY ✅
MOYASAR_API_KEY ⏳
SUPABASE_MANAGEMENT_TOKEN ⏳
```

---

## 🔐 نظام التفعيل والتوثيق

| الفئة | التفعيل | شرط النشر |
|---|---|---|
| باحث عن عقار | تلقائي فوري | لا ينشر إعلانات |
| مالك عقار | تلقائي فوري | صك ملكية + رخصة REGA |
| مسوق عقاري | تلقائي فوري | رخصة فال + باقة |
| مقاول | تلقائي فوري | باقة إعلانية |
| مكتب هندسي | تلقائي فوري | باقة إعلانية |

---

## 👁️ نظام المشاهدات
- عمود `views` في جدول `properties`
- يُحدَّث عبر RPC: `supabase.rpc('increment_views', { property_id })`
- مرة واحدة لكل زيارة عبر localStorage
- تاب الإحصائيات يعرض أشرطة مقارنة بصرية

---

## 💬 نظام الإشعارات
- جدول `notifications`
- عمود `type` يقبل: `message` / `like` / `comment` / `follow` / `share`
- constraint تم تحديثه بـ SQL ✅
- الإشعارات تُرسل عند: لايك Reel / تعليق / متابعة / رسالة جديدة / طلب جديد

---

## 🗺️ نظام الخرائط
- Mapbox GL فقط
- RTL Text Plugin مضاف
- MapPicker مكوّن مستقل في add-property و edit-property
- Geocoder مقيد بالسعودية (countries: 'sa')
- Bounding Box لكل مدينة لتقييد البحث

---

## ⭐ نظام التقييمات
- جدول `reviews`: reviewer_id, target_id, target_type, rating, comment
- `target_type` — قيم ممكنة: `broker` / `contractor` / `engineer`
- unique constraint على (reviewer_id, target_id, target_type) ✅ مضاف
- upsert لتحديث التقييم السابق

---

## 📋 لوحة الطلبات
- `requests` جدول: id, user_id, type, title, description, budget, city, phone, status, created_at
- `type` — قيم ممكنة: `عقار` / `مقاول` / `مكتب هندسي`
- `phone` — رقم التواصل الخاص بالطلب
- الإشعارات تُرسل لـ: broker (عقار) / contractor (مقاول) / engineer (مكتب هندسي)


## 📱 خطة التطبيق الموبايل — بعد رفع الموقع على Vercel

### المرحلة الأولى — التطبيق الأساسي:
- نفس ميزات الموقع في تطبيق موبايل (iOS + Android)
- React Native أو Expo للتطوير السريع
- إشعارات Push Notifications
- تجربة أسرع وأسهل من الموقع

### المرحلة الثانية — ميزات حصرية للتطبيق:
- **AR View** — توجيه الكاميرا نحو المباني لرؤية العقارات المتاحة فوراً
- **AI Staging** — تصوير الشقة وإعادة تأثيثها افتراضياً بطرازات مختلفة
- **محاكي الإضاءة** — رؤية كيف تدخل الشمس للعقار في أوقات مختلفة
- **فلتر تقييم الغرف** — مسح الغرفة بالكاميرا للحصول على تقييم

### ميزات مستقبلية للموقع والتطبيق معاً:
- **كم يسوى بيتي؟** — تتبع دوري لقيمة عقار المستخدم
- **متى تشتري؟ (AI Prediction)** — تنبؤ باتجاه الأسعار
- **البحث المشترك (Shared Wishlist)** — قائمة مشتركة للزوجين مع تصويت
- **المزاد العكسي (48 ساعة)** — عقارات ينخفض سعرها كل ساعة
- **البث المباشر للمعاينة** — بث حي من داخل العقار
- **جدولة المعاينات الفورية** — حجز موعد مباشرة من جدول الوسيط
- **شارة العقارات الموثقة** — علامة توثيق للعقارات المفحوصة
- **مؤشر أسعار الأحياء** — رسوم بيانية تفاعلية على Mapbox
- **تقييم مستوى المعيشة** — قرب العقار من المساجد والمدارس والخدمات
- **آلة الزمن العقارية** — صور تاريخية للأحياء ومستقبلها التخيلي
- **لعبة الثروة العقارية** — ميزانية وهمية للتداول بعقارات حقيقية
- **اسأل سكان الحي (Community Q&A)** — مجتمع يسأل ويجيب عن الأحياء
- **طلب فاحص مستقل** — فاحص هندسي يزور العقار ويرفع تقريراً
- **حاسبة تأجر ولا تشتري؟** — نصائح مالية بناءً على راتب المستخدم
- **ربط Meta Pixel + Google Analytics** — استهداف دقيق للحملات
- **إدارة الحملات الإعلانية بـ AI** — كتابة + تصميم + جدولة + تحليل
- **ربط Canva API** — تصميم بوسترات إعلانية تلقائياً