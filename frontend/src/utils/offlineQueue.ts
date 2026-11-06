import { apiClient } from '../api/client';

export interface QueuedDailyLog {
  id: string;
  order_id: string;
  po_number: string;
  stage_name: string;
  quantity_produced: number;
  defect_count: number;
  photo_url?: string;
  issue_note_tamil?: string;
  is_voice?: boolean;
  queued_at: string;
}

const STORAGE_KEY = 'tiruppur_supervisor_offline_queue';

export function isOnline(): boolean {
  return typeof navigator !== 'undefined' && navigator.onLine;
}

export function getQueuedLogs(): QueuedDailyLog[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error('Failed to parse offline queue', e);
    return [];
  }
}

export function enqueueDailyLog(item: Omit<QueuedDailyLog, 'id' | 'queued_at'>): QueuedDailyLog {
  const queue = getQueuedLogs();
  const queuedItem: QueuedDailyLog = {
    ...item,
    id: `queue_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    queued_at: new Date().toISOString(),
  };
  queue.push(queuedItem);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(queue));
  return queuedItem;
}

export async function processOfflineQueue(onProgress?: (count: number) => void): Promise<{ synced: number; failed: number }> {
  const queue = getQueuedLogs();
  if (queue.length === 0) return { synced: 0, failed: 0 };

  const remaining: QueuedDailyLog[] = [];
  let synced = 0;
  let failed = 0;

  for (const item of queue) {
    try {
      await apiClient.post('/supervisor/daily-log', {
        order_id: item.order_id,
        stage_name: item.stage_name,
        quantity_produced: item.quantity_produced,
        defect_count: item.defect_count,
        photo_url: item.photo_url,
        issue_note_tamil: item.issue_note_tamil,
        is_voice: item.is_voice,
      });
      synced++;
      if (onProgress) onProgress(queue.length - synced);
    } catch (err) {
      console.error('Failed to sync item from queue', err);
      failed++;
      remaining.push(item);
    }
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(remaining));
  return { synced, failed };
}

