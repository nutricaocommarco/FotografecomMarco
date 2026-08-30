// Vercel Serverless Function: recebe o e-mail cadastrado na caixinha "Em Breve"
// e manda um e-mail simples avisando o Marco. Não guarda nada aqui — o cadastro
// no banco (pra ele poder consultar depois) já é feito direto pelo navegador via Supabase.
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  const { email, evento } = req.body || {};

  if (!email || typeof email !== 'string') {
    return res.status(400).json({ error: 'E-mail inválido' });
  }

  const RESEND_API_KEY = process.env.RESEND_API_KEY;
  const NOTIFY_TO = process.env.NOTIFY_EMAIL || 'manjunior007@gmail.com';

  if (!RESEND_API_KEY) {
    // Sem a chave configurada ainda, não falha o cadastro do visitante — só não notifica.
    return res.status(200).json({ ok: true, notified: false });
  }

  try {
    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Fotografe com Marco <avisos@fotografecommarco.com>',
        to: [NOTIFY_TO],
        subject: `Novo cadastro "Me Avise" — ${evento || 'Coberturas'}`,
        html: `<p>Alguém quer ser avisado quando as fotos entrarem no ar.</p>
               <p><strong>E-mail:</strong> ${email}</p>
               <p><strong>Evento:</strong> ${evento || 'não informado'}</p>`,
      }),
    });

    if (!resendResponse.ok) {
      const detail = await resendResponse.text();
      console.error('Falha ao enviar e-mail via Resend:', detail);
      return res.status(200).json({ ok: true, notified: false });
    }

    return res.status(200).json({ ok: true, notified: true });
  } catch (err) {
    console.error('Erro ao notificar cadastro Em Breve:', err);
    return res.status(200).json({ ok: true, notified: false });
  }
}
