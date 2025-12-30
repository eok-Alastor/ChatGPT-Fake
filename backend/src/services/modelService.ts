import db from '../db/schema';
import { Model } from '../types';

export function getAllModels(): Model[] {
  const models = db
    .prepare('SELECT * FROM models WHERE is_active = 1 ORDER BY provider, id')
    .all() as Model[];
  return models;
}

export function getModelById(modelId: string): Model | null {
  const model = db
    .prepare('SELECT * FROM models WHERE id = ? AND is_active = 1')
    .get(modelId) as Model | undefined;
  return model || null;
}

export function getModelsByProvider(provider: string): Model[] {
  const models = db
    .prepare('SELECT * FROM models WHERE provider = ? AND is_active = 1 ORDER BY id')
    .all(provider) as Model[];
  return models;
}
