const Anthropic = require('@anthropic-ai/sdk');

let client = null;

function getClient() {
  if (!client && process.env.ANTHROPIC_API_KEY) {
    client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  }
  return client;
}

async function generateConsultantSummary(reg) {
  if (process.env.AI_SUMMARY_ENABLED !== 'true') return null;
  const c = getClient();
  if (!c) return null;

  const skills    = safeJsonArray(reg.skills).join('، ') || 'غير محدد';
  const languages = safeJsonArray(reg.languages).join('، ') || 'العربية';

  const prompt = `اكتب ملخصاً احترافياً موجزاً (3-4 جمل) بالعربية الفصحى للمستشار التالي، مناسباً للنشر العام على منصة استشارات جامعة الطائف:

الاسم: ${reg.first_name} ${reg.last_name}
الكلية: ${reg.college_name || 'غير محددة'}
نوع العمل: ${reg.work_type || ''}
الخبرة الإدارية: ${reg.admin_exp || 'غير محددة'}
الخبرة التدريبية: ${reg.training_exp || 'غير محددة'}
الخبرة البحثية: ${reg.research_exp || 'غير محددة'}
المهارات: ${skills}
اللغات: ${languages}

اكتب الملخص فقط دون أي مقدمات أو تعليقات.`;

  try {
    const msg = await c.messages.create({
      model: 'claude-opus-4-8',
      max_tokens: 600,
      thinking: { type: 'adaptive' },
      messages: [{ role: 'user', content: prompt }]
    });

    const textBlock = msg.content.find(b => b.type === 'text');
    return textBlock ? textBlock.text.trim() : null;
  } catch (err) {
    console.error('[AI] فشل توليد الملخص:', err.message);
    return null;
  }
}

function safeJsonArray(val) {
  if (!val) return [];
  try {
    const parsed = typeof val === 'string' ? JSON.parse(val) : val;
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

module.exports = { generateConsultantSummary };
