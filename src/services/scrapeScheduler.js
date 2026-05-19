const cron = require('node-cron');
const config = require('../config/config');
const webScraperService = require('./webScraperService');
const apiSyncService = require('./apiSyncService');

class ScrapeScheduler {
  constructor() {
    this.task = null;
    this.isRunning = false;
    this.lastRun = null;
    this.lastResult = null;
  }

  start() {
    if (!config.webScraper.enabled) {
      console.log('⏹️  Knowledge sync scheduler is disabled (WEB_SCRAPER_ENABLED=false)');
      return;
    }

    const schedule = config.webScraper.schedule;

    // Validate cron expression
    if (!cron.validate(schedule)) {
      console.error(`❌ Invalid cron schedule: ${schedule}`);
      return;
    }

    const method = config.cmsApi.syncMethod.toUpperCase();

    console.log('🕷️  ═══════════════════════════════════════════');
    console.log(`🕷️  Knowledge Sync Scheduler Started (${method} Mode)`);
    console.log(`📅 Schedule: ${schedule}`);
    if (config.cmsApi.syncMethod === 'api') {
      console.log(`🔗 API Base: ${config.cmsApi.baseUrl}`);
      console.log(`🔑 Bot User: ${config.cmsApi.botUsername}`);
    } else {
      console.log(`🔗 Target:  ${config.webScraper.baseUrl}`);
      console.log(`📄 Pages:   ${config.webScraper.pages.length}`);
    }
    console.log('🕷️  ═══════════════════════════════════════════\n');

    this.task = cron.schedule(schedule, async () => {
      if (this.isRunning) {
        console.log('⚠️  Sync/Scraping already in progress, skipping this run');
        return;
      }

      console.log(`\n🕷️  [SCHEDULED] Starting periodic knowledge sync (${method})...`);
      this.isRunning = true;

      try {
        let result;
        if (config.cmsApi.syncMethod === 'api') {
          result = await apiSyncService.syncAll(true); // Force sync to cleanly overwrite Pinecone weekly
        } else {
          result = await webScraperService.scrapeAllPages();
        }
        this.lastRun = new Date();
        this.lastResult = result;
        console.log('✅ [SCHEDULED] Knowledge sync completed successfully');
      } catch (error) {
        console.error('❌ [SCHEDULED] Knowledge sync failed:', error.message);
        this.lastResult = { success: false, error: error.message };
      } finally {
        this.isRunning = false;
      }
    });

    console.log('✅ Knowledge sync scheduler is active and waiting for next scheduled run');
  }

  stop() {
    if (this.task) {
      this.task.stop();
      this.task = null;
      console.log('⏹️  Knowledge sync scheduler stopped');
    }
  }

  getStatus() {
    return {
      enabled: config.webScraper.enabled,
      schedule: config.webScraper.schedule,
      syncMethod: config.cmsApi.syncMethod,
      isRunning: this.isRunning,
      lastRun: this.lastRun,
      lastResult: this.lastResult
    };
  }
}

module.exports = new ScrapeScheduler();
