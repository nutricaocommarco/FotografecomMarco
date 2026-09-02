// A og:image da Home (foto que aparece ao compartilhar o link no WhatsApp) é
// escolhida em build-time pelo prerender.mjs, a partir da cobertura ativa
// mais recente — então qualquer cobertura criada/editada/removida no admin só
// aparece pro mundo depois de um novo build. Isso dispara esse build na hora,
// via Deploy Hook da Vercel, em vez de esperar o próximo `git push`.
// Best-effort: nunca deve bloquear a escrita da cobertura em si.
export async function dispararRedeploy() {
  const url = process.env.DEPLOY_HOOK_URL;
  if (!url) return;
  try {
    await fetch(url, { method: 'POST' });
  } catch {
    // Silencioso de propósito — falha aqui não pode derrubar a resposta da API.
  }
}
