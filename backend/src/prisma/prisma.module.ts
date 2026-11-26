import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service.js';

// Global : la plupart des modules métier ont besoin de la base.
@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
