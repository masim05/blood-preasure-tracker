import { Inject, Injectable, Logger, type OnModuleDestroy, type OnModuleInit } from '@nestjs/common';

import { RECOGNITION_TASK_STORE, type RecognitionTaskStorePort } from '../../../application/ports/recognition-task-store.port';
import { ProcessRecognitionTaskUseCase } from '../../../application/use-cases/process-recognition-task.use-case';
import { RecognitionTask } from '../../../domain/entities/recognition-task';
import { ApiConfigService } from '../../../infrastructure/config/api-config';
import { EnvConfigService } from '../../../infrastructure/config/env-config';

@Injectable()
export class RecognitionTaskWorker implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RecognitionTaskWorker.name);
  private timer: NodeJS.Timeout | null = null;
  private isRunning = false;

  /* istanbul ignore next */
  constructor(
    @Inject(RECOGNITION_TASK_STORE) private readonly recognitionTasks: RecognitionTaskStorePort,
    private readonly processRecognitionTask: ProcessRecognitionTaskUseCase,
    private readonly apiConfig: ApiConfigService,
    private readonly envConfig: EnvConfigService,
  ) {}

  onModuleInit(): void {
    const config = this.apiConfig.load();
    const intervalMs = config.recognitionWorkerIntervalSeconds * 1000;
    this.timer = setInterval(() => {
      void this.runCycle();
    }, intervalMs);
  }

  onModuleDestroy(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  async runCycle(now: Date = new Date()): Promise<void> {
    if (this.isRunning) {
      return;
    }

    this.isRunning = true;
    try {
      const config = this.apiConfig.load();
      const env = this.envConfig.load();
      const retryAt = new Date(now.getTime() + config.recognitionWorkerIntervalSeconds * 1000);
      const claimed = await this.recognitionTasks.claimQueued(now, config.recognitionWorkerBatchSize);
      let completed = 0;
      let retried = 0;
      let failed = 0;
      for (const task of claimed) {
        try {
          await this.processRecognitionTask.execute({
            taskId: task.id,
            model: env.model,
            now,
            retryAt,
          });

          const updatedTask = await this.recognitionTasks.findById(task.id);
          if (updatedTask?.status === 'completed') {
            completed += 1;
          } else if (updatedTask?.status === 'queued') {
            retried += 1;
          } else if (updatedTask?.status === 'failed') {
            failed += 1;
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          if (task.attemptCount < 2) {
            await this.recognitionTasks.scheduleRetry(task.id, retryAt, errorMessage, now);
            retried += 1;
          } else {
            await this.recognitionTasks.save(
              new RecognitionTask({
                ...task.toJSON(),
                status: 'failed',
                lastError: errorMessage,
                completedAt: now,
                updatedAt: now,
              }),
            );
            failed += 1;
          }

          this.logger.warn(
            `Background recognition task failed taskId=${task.id}: ${errorMessage}`,
          );
        }
      }

      this.logger.log(
        `Background worker cycle claimed=${claimed.length} completed=${completed} retried=${retried} failed=${failed}`,
      );
    } finally {
      this.isRunning = false;
    }
  }
}
