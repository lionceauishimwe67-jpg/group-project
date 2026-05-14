import { Request, Response } from 'express';
import { globalTimeService } from '../services/globalTimeService';

/**
 * Get current global time
 */
export const getCurrentTime = async (req: Request, res: Response) => {
  try {
    const timeData = globalTimeService.getTimeData();
    
    return res.json({
      success: true,
      data: timeData
    });
  } catch (error) {
    console.error('[TimeController] Error getting current time:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to get current time'
    });
  }
};

/**
 * Force time sync
 */
export const syncTime = async (req: Request, res: Response) => {
  try {
    const syncedData = await globalTimeService.forceSync();
    
    return res.json({
      success: true,
      data: {
        current_time: syncedData.current_time.toISOString(),
        timezone: syncedData.timezone,
        source: syncedData.source,
        last_sync: syncedData.last_sync.toISOString(),
        drift_offset: syncedData.drift_offset
      },
      message: 'Time synced successfully'
    });
  } catch (error) {
    console.error('[TimeController] Error syncing time:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to sync time'
    });
  }
};

/**
 * Get time status
 */
export const getTimeStatus = async (req: Request, res: Response) => {
  try {
    const timeData = globalTimeService.getTimeData();
    
    return res.json({
      success: true,
      data: {
        ...timeData,
        sync_interval: 300000, // 5 minutes in milliseconds
        is_syncing: false
      }
    });
  } catch (error) {
    console.error('[TimeController] Error getting time status:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to get time status'
    });
  }
};
