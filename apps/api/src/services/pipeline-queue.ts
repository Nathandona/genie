import { Queue } from 'bullmq';
import { Redis } from 'ioredis';
import type { ProjectSettings } from '@genie/shared';

import { env } from '../env.js';

export interface ProjectPipelineJobData {
  projectId: string;
  userId: string;
  sourceUrl: string;
  settings: ProjectSettings;
}

const redis = new Redis(env.REDIS_URL, {
  maxRetriesPerRequest: null
});

export const pipelineQueue = new Queue<ProjectPipelineJobData>('project-pipeline', {
  connection: redis,
  defaultJobOptions: {
    removeOnComplete: true,
    removeOnFail: false,
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 1_000
    }
  }
});

pipelineQueue.on('error', (error) => {
  if (env.NODE_ENV !== 'test') {
    console.error('Pipeline queue error', error);
  }
});

export const enqueueProjectPipeline = async (data: ProjectPipelineJobData) => {
  await pipelineQueue.add('project-pipeline', data);
};
