const nodemailer = require('nodemailer');

let transporter = null;

function getTransporter() {
  if (!transporter && process.env.SMTP_HOST) {
    transporter = nodemailer.createTransport({
      host:   process.env.SMTP_HOST,
      port:   parseInt(process.env.SMTP_PORT) || 587,
      secure: false,
      auth:   { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
    });
  }
  return transporter;
}

async function sendEmail({ to, subject, html }) {
  const t = getTransporter();
  if (!t) return;
  try {
    await t.sendMail({ from: process.env.SMTP_FROM, to, subject, html });
  } catch (err) {
    console.error('[Email]', err.message);
  }
}

function tplWrap(body) {
  return `<div dir="rtl" style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;border:1px solid #ddd;border-radius:12px;overflow:hidden">
    <div style="background:#006633;padding:20px 24px;display:flex;align-items:center;gap:12px">
      <div style="width:40px;height:40px;background:rgba(255,255,255,.15);border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:1.2rem;font-weight:900;color:#fff">م</div>
      <div><div style="color:#fff;font-weight:800;font-size:1.1rem">مُستشار – جامعة الطائف</div>
      <div style="color:rgba(255,255,255,.7);font-size:.78rem">مركز البحوث والاستشارات</div></div>
    </div>
    <div style="padding:28px 24px">${body}</div>
    <div style="background:#f5f5f5;padding:14px 24px;text-align:center;font-size:.75rem;color:#888">
      مركز البحوث والاستشارات – جامعة الطائف | turcc@tu.edu.sa | 0127270020
    </div>
  </div>`;
}

async function sendApprovalEmail(reg) {
  await sendEmail({
    to:      reg.email,
    subject: 'تهانينا! تم قبول طلبك في منصة مستشار',
    html: tplWrap(`
      <h2 style="color:#006633;margin-bottom:12px">تهانينا ${reg.first_name}! 🎉</h2>
      <p style="line-height:1.75;color:#333">يسعدنا إعلامك بأن طلب انضمامك إلى <strong>منصة مستشار</strong> بجامعة الطائف قد تمت الموافقة عليه.</p>
      <div style="background:#f0f9f4;border-right:4px solid #006633;border-radius:8px;padding:16px;margin:18px 0">
        <div style="margin-bottom:6px"><strong>رقم الطلب:</strong> ${reg.req_number}</div>
        <div><strong>الاسم:</strong> ${reg.first_name} ${reg.last_name}</div>
      </div>
      <p style="line-height:1.75;color:#333">يمكنك الآن <strong>تسجيل الدخول</strong> إلى بوابة المنسوب باستخدام:</p>
      <ul style="padding-right:20px;line-height:2;color:#333">
        <li>رقم المنسوب: <strong style="color:#006633">${reg.emp_id}</strong></li>
        <li>البريد الإلكتروني: <strong style="color:#006633">${reg.email}</strong></li>
      </ul>
      <p style="font-size:.8rem;color:#666;margin-top:16px">للاستفسار: <a href="mailto:turcc@tu.edu.sa" style="color:#006633">turcc@tu.edu.sa</a></p>`)
  });
}

async function sendRejectionEmail(reg, note) {
  await sendEmail({
    to:      reg.email,
    subject: 'بشأن طلبك في منصة مستشار – جامعة الطائف',
    html: tplWrap(`
      <h2 style="color:#333;margin-bottom:12px">عزيزي ${reg.first_name}</h2>
      <p style="line-height:1.75;color:#333">نشكرك على اهتمامك بالانضمام إلى منصة مستشار. بعد مراجعة طلبك (${reg.req_number})، نأسف لإعلامك بعدم إمكانية قبوله في الوقت الراهن.</p>
      ${note ? `<div style="background:#fff8f0;border-right:4px solid #e67e22;border-radius:8px;padding:16px;margin:18px 0"><strong>ملاحظة المراجع:</strong><p style="margin:8px 0 0;color:#555">${note}</p></div>` : ''}
      <p style="line-height:1.75;color:#333">يمكنك التواصل مع مركز البحوث والاستشارات للاستفسار أو إعادة التقديم:
        <br><a href="mailto:turcc@tu.edu.sa" style="color:#006633">turcc@tu.edu.sa</a> | 0127270020
      </p>`)
  });
}

module.exports = { sendApprovalEmail, sendRejectionEmail };
