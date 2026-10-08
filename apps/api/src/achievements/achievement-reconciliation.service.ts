import {
  Injectable,
  Logger,
} from '@nestjs/common';

import {
  AchievementEvaluatorService,
} from './achievement-evaluator.service.js';

@Injectable()
export class AchievementReconciliationService {
  private readonly logger =
    new Logger(
      AchievementReconciliationService.name,
    );

  constructor(
    private readonly evaluator:
      AchievementEvaluatorService,
  ) {}

  async reconcileUser(
    userId: string,
  ): Promise<void> {
    try {
      await this.evaluator
        .evaluateUser(
          userId,
        );
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : String(error);

      this.logger.warn(
        `Achievement reconciliation failed: ${message}`,
      );
    }
  }
}
