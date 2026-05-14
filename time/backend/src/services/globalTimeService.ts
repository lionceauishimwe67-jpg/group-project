interface TimeData {
  current_time: Date;
  timezone: string;
  source: 'api' | 'fallback';
  last_sync: Date;
  drift_offset: number; // milliseconds difference from server time
}

interface WorldTimeAPIResponse {
  datetime: string;
  timezone: string;
  day_of_week: number;
  day_number: number;
  week_number: number;
  utc_offset: string;
  unixtime: number;
}

class GlobalTimeService {
  private cachedTime: TimeData | null = null;
  private readonly SYNC_INTERVAL = 5 * 60 * 1000; // 5 minutes
  private readonly TIMEZONE = 'Africa/Kigali';
  private syncTimer: NodeJS.Timeout | null = null;
  private isSyncing = false;

  constructor() {
    this.startPeriodicSync();
  }

  /**
   * Fetch real-world time from external API
   * Uses WorldTimeAPI as primary source
   */
  private async fetchTimeFromAPI(): Promise<Date> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

      const response = await fetch('http://worldtimeapi.org/api/timezone/Africa/Kigali', {
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json() as WorldTimeAPIResponse;

      if (data && data.datetime) {
        return new Date(data.datetime);
      }

      throw new Error('Invalid response from time API');
    } catch (error) {
      console.error('[GlobalTime] API fetch failed:', error);
      throw error;
    }
  }

  /**
   * Get current time with fallback to server time
   */
  public async getCurrentTime(): Promise<TimeData> {
    // Return cached time if available and recent
    if (this.cachedTime && Date.now() - this.cachedTime.last_sync.getTime() < this.SYNC_INTERVAL) {
      // Calculate current time based on cached time + elapsed time
      const now = new Date(this.cachedTime.current_time.getTime() + (Date.now() - this.cachedTime.last_sync.getTime()));
      return {
        ...this.cachedTime,
        current_time: now
      };
    }

    // Sync with external time source
    return await this.syncTime();
  }

  /**
   * Sync time with external source
   */
  public async syncTime(): Promise<TimeData> {
    if (this.isSyncing) {
      // Return cached time if already syncing
      if (this.cachedTime) {
        const now = new Date(this.cachedTime.current_time.getTime() + (Date.now() - this.cachedTime.last_sync.getTime()));
        return {
          ...this.cachedTime,
          current_time: now
        };
      }
    }

    this.isSyncing = true;

    try {
      const apiTime = await this.fetchTimeFromAPI();
      const serverTime = new Date();
      
      // Calculate drift offset
      const driftOffset = apiTime.getTime() - serverTime.getTime();

      this.cachedTime = {
        current_time: apiTime,
        timezone: this.TIMEZONE,
        source: 'api',
        last_sync: serverTime,
        drift_offset: driftOffset
      };

      console.log(`[GlobalTime] Synced with API: ${apiTime.toISOString()}, Drift: ${driftOffset}ms`);
      return this.cachedTime;
    } catch (error) {
      console.warn('[GlobalTime] API sync failed, using fallback');
      
      // Fallback to server time with timezone adjustment
      const serverTime = new Date();
      
      if (!this.cachedTime) {
        // No cached data, use server time
        this.cachedTime = {
          current_time: serverTime,
          timezone: this.TIMEZONE,
          source: 'fallback',
          last_sync: serverTime,
          drift_offset: 0
        };
      } else {
        // Use cached drift offset if available
        const now = new Date(this.cachedTime.current_time.getTime() + (Date.now() - this.cachedTime.last_sync.getTime()));
        this.cachedTime = {
          ...this.cachedTime,
          current_time: now,
          source: 'fallback',
          last_sync: serverTime
        };
      }

      return this.cachedTime;
    } finally {
      this.isSyncing = false;
    }
  }

  /**
   * Get current time in specified timezone
   */
  public getTimeInTimezone(timezone: string): Date {
    if (!this.cachedTime) {
      return new Date();
    }

    // Simple timezone offset calculation
    // For production, use a library like moment-timezone or luxon
    const time = this.cachedTime.current_time;
    
    // Africa/Kigali is UTC+2 (no DST)
    if (timezone === 'Africa/Kigali') {
      return time;
    }

    return time;
  }

  /**
   * Get formatted time string
   */
  public getFormattedTime(format: 'iso' | 'local' = 'iso'): string {
    const time = this.cachedTime?.current_time || new Date();
    
    if (format === 'iso') {
      return time.toISOString();
    }
    
    return time.toLocaleString();
  }

  /**
   * Start periodic time sync
   */
  private startPeriodicSync(): void {
    // Initial sync
    this.syncTime();

    // Periodic sync
    this.syncTimer = setInterval(() => {
      this.syncTime();
    }, this.SYNC_INTERVAL);
  }

  /**
   * Stop periodic sync
   */
  public stopPeriodicSync(): void {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
      this.syncTimer = null;
    }
  }

  /**
   * Get time data for API response
   */
  public getTimeData() {
    const timeData = this.cachedTime || {
      current_time: new Date(),
      timezone: this.TIMEZONE,
      source: 'fallback',
      last_sync: new Date(),
      drift_offset: 0
    };

    return {
      current_time: timeData.current_time.toISOString(),
      timezone: timeData.timezone,
      source: timeData.source,
      last_sync: timeData.last_sync.toISOString(),
      drift_offset: timeData.drift_offset,
      server_time: new Date().toISOString()
    };
  }

  /**
   * Force immediate sync
   */
  public async forceSync(): Promise<TimeData> {
    return await this.syncTime();
  }
}

// Export singleton instance
export const globalTimeService = new GlobalTimeService();
