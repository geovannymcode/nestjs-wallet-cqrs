import { Module } from '@nestjs/common';
import { DisbursementModule } from './modules/disbursement/disbursement.module';

@Module({
  imports: [DisbursementModule],
  controllers: [],
  providers: [],
})
export class AppModule {}