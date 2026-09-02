import crypto from 'crypto';

// HMAC-SHA256 com salt secreto — nunca guardamos o CPF em si, só esse hash.
// O salt não pode mudar depois de começar a importar dados: mudar quebraria
// a detecção de recompra entre meses já importados (o mesmo CPF passaria a
// gerar um hash diferente do que já está salvo).
export function hashCpf(cpf) {
  const salt = process.env.BUYER_HASH_SALT;
  if (!salt) throw new Error('BUYER_HASH_SALT não configurado');
  return crypto.createHmac('sha256', salt).update(cpf).digest('hex');
}
