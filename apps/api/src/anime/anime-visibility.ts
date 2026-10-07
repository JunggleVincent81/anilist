import {
  AnimeCatalogStatus,
} from '@prisma/client';

import type {
  Prisma,
} from '@prisma/client';

const PUBLIC_ANIME_WHERE = {
  catalogStatus:
    AnimeCatalogStatus.INCLUDED,
} satisfies Prisma.AnimeWhereInput;

export {
  PUBLIC_ANIME_WHERE,
};