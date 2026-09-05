// Cérebro central dos posts do blog. Metadados aqui; corpo do texto em cada
// arquivo de página dentro de src/pages/posts/.
export const posts = [
  // --- Fotografia ---
  { slug: 'fotografo-na-prainha', category: 'fotografia', title: 'Fotógrafo na Prainha: Como Encontrar Suas Fotos de Treino', date: '2026-08-31' },
  { slug: 'historia-da-prainha-no-recreio-dos-bandeirantes', category: 'fotografia', title: 'A História da Prainha no Recreio dos Bandeirantes', date: '2026-09-04' },
  { slug: 'qual-tamanho-de-imagem-escolher', oldPath: '/2020/11/11/qual-tamanho-de-imagem-escolher/', category: 'fotografia', title: 'Qual Tamanho de Imagem Escolher?', date: '2020-11-11' },
  { slug: 'como-sair-bem-na-foto', oldPath: '/2020/11/09/como-sair-bem-na-foto/', category: 'fotografia', title: 'Como Sair Bem na Foto?', date: '2020-11-09' },
  { slug: 'validade-da-camera', oldPath: '/2020/11/06/validade-da-camera/', category: 'fotografia', title: 'Validade da Câmera', date: '2020-11-06' },
  { slug: 'pesquisa-de-mercado', oldPath: '/2021/01/08/pesquisa-de-mercado/', category: 'fotografia', title: 'Pesquisa de Mercado', date: '2021-01-08' },

  // --- Ciclismo ---
  { slug: 'o-que-e-cicloturismo', oldPath: '/2021/02/17/o-que-e-cicloturismo-2/', category: 'ciclismo', title: 'O que é Cicloturismo?', date: '2021-02-17' },
  { slug: 'kit-primeiros-socorros-para-bike', oldPath: '/2021/02/15/kit-primeiros-socorros-para-bike-2/', category: 'ciclismo', title: 'Kit Primeiros Socorros para Bike', date: '2021-02-15' },
  { slug: 'como-fazer-isotonico-caseiro', oldPath: '/2021/02/18/como-fazer-isotonico-caseiro-2/', category: 'ciclismo', title: 'Como Fazer Isotônico Caseiro', date: '2021-02-18' },
  { slug: 'pedalar-emagrece', oldPath: '/2021/02/20/pedalar-emagrece-2/', category: 'ciclismo', title: 'Pedalar Emagrece?', date: '2021-02-20' },
  { slug: 'como-prender-a-bike', oldPath: '/2021/02/26/como-prender-a-bike-2/', category: 'ciclismo', title: 'Como Prender a Bike', date: '2021-02-26' },
  { slug: 'como-limpar-a-corrente-da-bike', oldPath: '/2021/03/16/como-limpar-a-corrente-da-bike-2/', category: 'ciclismo', title: 'Como Limpar a Corrente da Bike?', date: '2021-03-16' },
  { slug: 'quem-inventou-a-bicicleta', oldPath: '/2021/03/14/quem-inventou-a-bicicleta-2/', category: 'ciclismo', title: 'Quem Inventou a Bicicleta', date: '2021-03-14' },
  { slug: 'cuidados-ao-andar-de-bicicleta', oldPath: '/2021/03/18/cuidados-ao-andar-de-bicicleta-2/', category: 'ciclismo', title: 'Cuidados ao Andar de Bicicleta', date: '2021-03-18' },
  { slug: 'qual-o-melhor-cadeado-para-bicicleta', oldPath: '/2021/03/22/qual-o-melhor-cadeado-para-bicicleta-2/', category: 'ciclismo', title: 'Qual o Melhor Cadeado para Bicicleta?', date: '2021-03-22' },
  { slug: 'sapatilha-para-ciclismo', oldPath: '/2021/03/24/sapatilha-para-ciclismo-2/', category: 'ciclismo', title: 'Sapatilha para Ciclismo – Devo Usar?', date: '2021-03-24' },
  { slug: 'como-tirar-peso-da-bike', oldPath: '/2021/03/28/como-tirar-peso-da-bike-2/', category: 'ciclismo', title: 'Como Tirar Peso da Bike?', date: '2021-03-28' },
  { slug: 'como-economizar-dinheiro-durante-o-pedal', oldPath: '/2021/04/02/como-economizar-dinheiro-durante-o-pedal-2/', category: 'ciclismo', title: 'Como Economizar Dinheiro Durante o Pedal?', date: '2021-04-02' },
  { slug: 'primeiros-socorros-para-ciclistas', oldPath: '/2021/04/04/primeiros-socorros-para-ciclistas-2/', category: 'ciclismo', title: 'Primeiros Socorros para Ciclistas', date: '2021-04-04' },
  { slug: 'qual-valvula-para-camara-escolher', oldPath: '/2021/04/08/qual-valvula-para-camara-escolher-2/', category: 'ciclismo', title: 'Qual Válvula para Câmara Escolher?', date: '2021-04-08' },
  { slug: 'mulher-ciclista', oldPath: '/2021/04/16/mulher-ciclista-2/', category: 'ciclismo', title: 'Mulher Ciclista', date: '2021-04-16' },
  { slug: 'como-comecar-no-ciclismo', oldPath: '/2021/09/11/como-comecar-no-ciclismo-2/', category: 'ciclismo', title: 'Como Começar no Ciclismo?', date: '2021-09-11' },
  { slug: 'o-que-fazer-em-miguel-pereira-de-bike', oldPath: '/2021/10/06/o-que-fazer-em-miguel-pereira-de-bike/', category: 'ciclismo', title: 'O que Fazer em Miguel Pereira de Bike?', date: '2021-10-06' },
];

export function getPostBySlug(slug) {
  return posts.find((p) => p.slug === slug);
}
