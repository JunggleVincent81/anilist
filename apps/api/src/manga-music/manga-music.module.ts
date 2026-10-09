import { Module } from '@nestjs/common';
import { MangaMusicResolver } from './manga-music.resolver.js';
import { MangaMusicService } from './manga-music.service.js';

@Module({ providers: [MangaMusicResolver, MangaMusicService] })
export class MangaMusicModule {}
