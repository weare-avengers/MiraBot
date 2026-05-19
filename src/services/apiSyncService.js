const axios = require('axios');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const config = require('../config/config');
const documentService = require('./documentService');
const openaiService = require('./openaiService');
const pineconeService = require('./pineconeService');
const documentDownloadService = require('./documentDownloadService');
function getTranslation(field) {
  if (!field) return '';
  if (typeof field === 'string') return field;
  return field.en || field.id || JSON.stringify(field);
}

function stripHtml(html) {
  if (!html) return '';
  return html
    .replace(/<[^>]*>/g, ' ') // Strip all HTML tags
    .replace(/\s+/g, ' ')     // Collapse whitespace
    .trim();
}

class ApiSyncService {
  constructor() {
    this.hashFilePath = path.join(__dirname, '../../knowledge/api-hashes.json');
    this.hashes = this.loadHashes();
  }

  loadHashes() {
    try {
      if (fs.existsSync(this.hashFilePath)) {
        const data = fs.readFileSync(this.hashFilePath, 'utf-8');
        return JSON.parse(data);
      }
    } catch (error) {
      console.error('⚠️  Error loading API hashes:', error.message);
    }
    return {};
  }

  saveHashes() {
    try {
      const dir = path.dirname(this.hashFilePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(this.hashFilePath, JSON.stringify(this.hashes, null, 2));
    } catch (error) {
      console.error('❌ Error saving API hashes:', error.message);
    }
  }

  computeHash(text) {
    return crypto.createHash('md5').update(text).digest('hex');
  }

  /**
   * Login to NestJS CMS to get JWT Token
   */
  async login() {
    const { baseUrl, loginPath, botUsername, botPassword } = config.cmsApi;
    const cleanBase = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
    const cleanPath = loginPath.startsWith('/') ? loginPath : `/${loginPath}`;
    const loginUrl = `${cleanBase}${cleanPath}`;
    
    console.log(`🔑 Attempting to login to CMS: ${loginUrl}`);
    
    try {
      // Mengirimkan email dan username agar kompatibel dengan berbagai skema backend
      const loginPayload = {
        username: botUsername,
        password: botPassword
      };

      const response = await axios.post(loginUrl, loginPayload, {
        headers: {
          'Content-Type': 'application/json',
          'X-Tunnel-Skip-AntiSpam-Page': 'true' // Bypass DevTunnels warning
        },
        timeout: 60000
      });

      // Ekstraksi token dari berbagai kemungkinan format response backend
      const token = response.data.access_token || 
                    response.data.token || 
                    response.data.accessToken || 
                    (response.data.data && response.data.data.access_token) ||
                    (response.data.data && response.data.data.token) || 
                    (response.data.data && response.data.data.accessToken);

      if (!token) {
        console.error('❌ Login response payload:', response.data);
        throw new Error('JWT Token not found in response body');
      }

      console.log('✅ Successfully authenticated with CMS!');
      return token;
    } catch (error) {
      const errorMsg = error.response && error.response.data 
        ? JSON.stringify(error.response.data) 
        : error.message;
      throw new Error(`Authentication failed: ${errorMsg}`);
    }
  }

  /**
   * Fetch knowledge content from CMS using JWT Token
   */
  async fetchContent(token) {
    const { baseUrl, contentPath } = config.cmsApi;
    const cleanBase = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
    const cleanPath = contentPath.startsWith('/') ? contentPath : `/${contentPath}`;
    const contentUrl = `${cleanBase}${cleanPath}`;
    
    console.log(`📥 Fetching content from CMS: ${contentUrl}`);
    
    try {
      const response = await axios.get(contentUrl, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-Tunnel-Skip-AntiSpam-Page': 'true',
          'Accept': 'application/json'
        },
        timeout: 60000
      });

      // Handle wrapped data (misal { success: true, data: [...] })
      const data = response.data.data || response.data;
      
      if (!Array.isArray(data)) {
        // Jika response bukan array, tapi single object, bungkus jadi array
        if (typeof data === 'object' && data !== null) {
          return [data];
        }
        throw new Error('CMS response content is not a valid array or object');
      }

      return data;
    } catch (error) {
      const errorMsg = error.response && error.response.data 
        ? JSON.stringify(error.response.data) 
        : error.message;
      throw new Error(`Failed to fetch content: ${errorMsg}`);
    }
  }

  /**
   * Main API Sync and Pinecone Upsert
   */
  async syncAll(forceReindex = false) {
    const results = [];
    let updatedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    console.log('\n📥 ═══════════════════════════════════════════');
    console.log('📥 API CMS Content Synchronizer');
    console.log('📥 ═══════════════════════════════════════════');
    console.log(`📅 Timestamp: ${new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })}`);
    console.log(`🔗 API Base: ${config.cmsApi.baseUrl}`);
    console.log(`🔄 Force re-index: ${forceReindex}`);
    console.log('');

    try {
      // 1. Authenticate to get token
      const token = await this.login();

      // 2. Fetch raw content
      const rawData = await this.fetchContent(token);
      let items = [];

      // Deteksi struktur data teragregasi dari NestJS
      const targetObj = Array.isArray(rawData) ? rawData[0] : rawData;

      if (targetObj && (
        targetObj.about || targetObj.news || targetObj.partners || targetObj.products ||
        targetObj.projects || targetObj.services || targetObj.service_types ||
        targetObj.team || targetObj.careers || targetObj.settings
      )) {
        console.log('✨ Aggregated MGI CMS structure detected! Exploding into 11 virtual pages...');
        
        // ── 1. Halaman: About ──────────────────────────────────────────
        if (targetObj.about && Array.isArray(targetObj.about)) {
          let aboutMd = `# About PT. Mitra Graha Integrasi\n\n`;
          aboutMd += `PT. Mitra Graha Integrasi (MGI) is a leading IT & Audio Visual system integrator in Indonesia.\n\n`;
          
          targetObj.about.forEach(item => {
            const title = item.key.replace(/_/g, ' ').toUpperCase();
            const value = getTranslation(item.value);
            aboutMd += `### ${title}\n${value}\n\n`;
          });
          
          items.push({
            pageLabel: 'About',
            path: '/about',
            content: aboutMd
          });
        }

        // ── 2. Halaman: News ───────────────────────────────────────────
        if (targetObj.news && Array.isArray(targetObj.news)) {
          let newsMd = `# News & Press Releases - PT. Mitra Graha Integrasi\n\n`;
          newsMd += `Stay updated with the latest news, events, and releases from MGI.\n\n`;
          
          const activeNews = targetObj.news.filter(n => n.is_active);
          if (activeNews.length === 0) {
            newsMd += `*No news articles available at the moment.*\n`;
          } else {
            activeNews.forEach(n => {
              const title = getTranslation(n.news_title);
              const subtitle = getTranslation(n.news_subtitle);
              const body = stripHtml(getTranslation(n.description));
              const date = n.year ? `Year ${n.year}` : new Date(n.created_at).toLocaleDateString('id-ID');
              
              newsMd += `## ${title}\n`;
              newsMd += `**Date:** ${date} | **Author:** ${n.author || 'PT MGI'}\n`;
              if (subtitle) newsMd += `**Subtitle:** ${subtitle}\n`;
              newsMd += `\n${body}\n\n`;
              newsMd += `---\n\n`;
            });
          }
          
          items.push({
            pageLabel: 'News',
            path: '/news',
            content: newsMd
          });
        }

        // ── 3. Halaman: Partners ───────────────────────────────────────
        if (targetObj.partners && Array.isArray(targetObj.partners)) {
          let partnersMd = `# Our Strategic Partners & Vendors\n\n`;
          partnersMd += `We partner with leading global technology brands to integrate top-tier AV & IT solutions.\n\n`;
          
          partnersMd += `| Partner Name | Technology Domain |\n`;
          partnersMd += `|--------------|-------------------|\n`;
          
          targetObj.partners.forEach(p => {
            const name = p.partners_name || 'Generic Partner';
            const domain = p.partnerType?.type_name || 'IT & AV Integrator';
            partnersMd += `| ${name} | ${domain} |\n`;
          });
          
          items.push({
            pageLabel: 'Partners',
            path: '/partner',
            content: partnersMd
          });
        }

        // ── 4. Halaman: Products ───────────────────────────────────────
        if (targetObj.products && Array.isArray(targetObj.products)) {
          let productsMd = `# Our Products Catalog\n\n`;
          productsMd += `PT. Mitra Graha Integrasi provides a wide selection of premium products to back our integrated solutions.\n\n`;
          
          targetObj.products.forEach(p => {
            const name = p.product_name || '';
            const type = p.productType?.type_name || '';
            const partner = p.partner?.partners_name || '';
            const desc = getTranslation(p.description);
            
            productsMd += `## ${name}\n`;
            if (type) productsMd += `- **Product Type:** ${type}\n`;
            if (partner) productsMd += `- **Manufacturer/Partner:** ${partner}\n`;
            if (desc) productsMd += `- **Description:** ${desc}\n`;
            productsMd += `\n`;
          });
          
          items.push({
            pageLabel: 'Products',
            path: '/product',
            content: productsMd
          });
        }

        // ── 5. Halaman: Projects ───────────────────────────────────────
        if (targetObj.projects && Array.isArray(targetObj.projects)) {
          let projectsMd = `# Successful Projects Portfolio\n\n`;
          projectsMd += `We have implemented robust AV & IT infrastructures for major government agencies and businesses.\n\n`;
          
          const activeProj = targetObj.projects.filter(p => p.is_active);
          activeProj.forEach(p => {
            const title = getTranslation(p.project_title);
            const subtitle = getTranslation(p.project_subtitle);
            const body = stripHtml(getTranslation(p.description));
            const year = p.year || '';
            
            projectsMd += `## ${title} (${year})\n`;
            if (subtitle) projectsMd += `**Subtitle:** ${subtitle}\n`;
            projectsMd += `\n${body}\n\n`;
            projectsMd += `---\n\n`;
          });
          
          items.push({
            pageLabel: 'Projects',
            path: '/projects',
            content: projectsMd
          });
        }

        // ── 6. Halaman: Services ───────────────────────────────────────
        if (targetObj.services && Array.isArray(targetObj.services)) {
          let servicesMd = `# Our AV & IT Services Catalog\n\n`;
          servicesMd += `We deliver comprehensive, end-to-end consulting and implementation services.\n\n`;
          
          targetObj.services.forEach(s => {
            const name = getTranslation(s.service_name);
            const type = s.serviceType?.type_name ? getTranslation(s.serviceType.type_name) : '';
            const desc = getTranslation(s.description);
            
            servicesMd += `## ${name}\n`;
            if (type) servicesMd += `- **Service Category:** ${type}\n`;
            if (desc) servicesMd += `- **Description:** ${desc}\n`;
            servicesMd += `\n`;
          });
          
          items.push({
            pageLabel: 'Services',
            path: '/services',
            content: servicesMd
          });
        }

        // ── 7. Halaman: Service Types ──────────────────────────────────
        if (targetObj.service_types && Array.isArray(targetObj.service_types)) {
          let typesMd = `# Core Service Classifications\n\n`;
          typesMd += `Our professional integration catalog covers key tech domains:\n\n`;
          
          targetObj.service_types.forEach(st => {
            const typeName = getTranslation(st.type_name);
            const desc = st.description ? getTranslation(st.description) : '';
            
            typesMd += `## ${typeName}\n`;
            if (desc) typesMd += `${desc}\n\n`;
          });
          
          items.push({
            pageLabel: 'Service Types',
            path: '/service-types',
            content: typesMd
          });
        }

        // ── 8. Halaman: Team ───────────────────────────────────────────
        if (targetObj.team) {
          let teamMd = `# Our Professional Team Structure\n\n`;
          teamMd += `PT. Mitra Graha Integrasi is driven by an elite group of engineers, consultants, and developers.\n\n`;
          
          if (Array.isArray(targetObj.team) && targetObj.team.length > 0) {
            teamMd += `| Member Name | Professional Role | Department |\n`;
            teamMd += `|-------------|-------------------|------------|\n`;
            targetObj.team.forEach(t => {
              const name = t.name || '';
              const position = t.position || '';
              const dept = t.department || '';
              teamMd += `| ${name} | ${position} | ${dept} |\n`;
            });
          } else {
            teamMd += `Our company is supported by highly competent team members including IT Engineers, Project Managers, UI/UX Designers, and Solution Architects dedicated to service excellence.\n`;
          }
          
          items.push({
            pageLabel: 'Teams',
            path: '/team',
            content: teamMd
          });
        }

        // ── 9. Halaman: Careers ────────────────────────────────────────
        if (targetObj.careers && Array.isArray(targetObj.careers)) {
          let careersMd = `# Job Vacancies & Careers\n\n`;
          careersMd += `Join our competent team. We build systems that drive impact.\n\n`;
          
          const activeJobs = targetObj.careers.filter(j => j.is_active);
          if (activeJobs.length === 0) {
            careersMd += `*There are no open roles at the moment. Please check back later or contact HR.*\n`;
          } else {
            activeJobs.forEach(job => {
              const title = getTranslation(job.job_title);
              const desc = stripHtml(getTranslation(job.job_description));
              const model = job.job_type || 'WFO';
              const cat = job.careerType?.type_name ? getTranslation(job.careerType.type_name) : 'Fulltime';
              
              careersMd += `## ${title}\n`;
              careersMd += `- **Job Type:** ${cat}\n`;
              careersMd += `- **Work Model:** ${model}\n`;
              if (desc) careersMd += `- **Job Description:**\n${desc}\n`;
              careersMd += `\n---\n\n`;
            });
          }
          
          items.push({
            pageLabel: 'Careers',
            path: '/karir',
            content: careersMd
          });
        }

        // ── 10. Halaman: Settings (Hubungi Kami & Homepage Info) ───────
        if (targetObj.settings && Array.isArray(targetObj.settings)) {
          let settingsMd = `# Contact & Company Profile Settings\n\n`;
          let totalClients = '5,000+';
          let totalProjects = '15,000+';
          
          targetObj.settings.forEach(item => {
            let val = item.value;
            if (item.type === 'JSON') {
              try {
                const parsed = JSON.parse(item.value);
                val = parsed.id || parsed.en || item.value;
              } catch(e) {}
            }
            
            if (item.key === 'total_clients' && item.value > 0) totalClients = `${item.value}+`;
            if (item.key === 'total_projects' && item.value > 0) totalProjects = `${item.value}+`;
            
            settingsMd += `**${item.key.replace(/_/g, ' ').toUpperCase()}:** ${val}\n\n`;
          });
          
          // Homepage
          let homeMd = `# Integrated Technology Solutions for Sustainable Transformation\n\n`;
          homeMd += `We help organizations transform through integrated Audio Visual & IT solutions.\n\n`;
          homeMd += `### MGI Statistics\n`;
          homeMd += `- **Satisfied Clients:** ${totalClients}\n`;
          homeMd += `- **Successful Projects:** ${totalProjects}\n\n`;
          homeMd += `### General Company Settings Info\n\n`;
          homeMd += settingsMd;
          
          items.push({
            pageLabel: 'Homepage',
            path: '/',
            content: homeMd
          });
          
          items.push({
            pageLabel: 'Contact',
            path: '/contact',
            content: settingsMd
          });
        }
      } else {
        // Fallback untuk skema standar array biasa
        items = Array.isArray(rawData) ? rawData : [rawData];
      }

      console.log(`📦 Processed ${items.length} virtual page(s) from CMS.`);

      // 3. Process each content item
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        
        // Ekstraksi data secara dinamis & robust
        const pageLabel = item.pageLabel || item.title || item.name || `API Page ${i + 1}`;
        const relativePath = item.path || `/${pageLabel.toLowerCase().replace(/\s+/g, '-')}`;
        const url = item.url || `${config.webScraper.baseUrl}${relativePath}`;
        
        // Pastikan konten teks ada
        let rawContent = item.content || item.body || item.text || '';
        
        // Hapus tag HTML jika terkirim dalam format HTML mentah
        if (/<[a-z][\s\S]*>/i.test(rawContent)) {
          rawContent = rawContent.replace(/<[^>]*>/g, ' '); // Strip HTML tags
        }

        // Clean up whitespace
        let cleanedText = rawContent
          .replace(/\s+/g, ' ')
          .replace(/\n\s*\n/g, '\n')
          .trim();

        if (!cleanedText) {
          console.log(`\n[${i + 1}/${items.length}] ⚠️  Skipping "${pageLabel}": No content text`);
          results.push({ page: pageLabel, url, success: false, reason: 'empty_content' });
          continue;
        }

        // Tambahkan context header jika belum ada
        if (!cleanedText.includes('[Halaman:')) {
          cleanedText = `[Halaman: ${pageLabel} - migrasi.id]\n\n${cleanedText}`;
        }

        console.log(`\n[${i + 1}/${items.length}] 📄 Syncing: ${pageLabel} (${url})`);

        // Check if content has changed
        const newHash = this.computeHash(cleanedText);
        const oldHash = this.hashes[relativePath];

        if (!forceReindex && newHash === oldHash) {
          console.log(`  ⏭️  No changes detected, skipping`);
          skippedCount++;
          results.push({ page: pageLabel, url, success: true, reason: 'no_changes' });
          continue;
        }

        console.log(`  📝 Content: ${cleanedText.length} chars`);
        console.log(`  🔄 ${oldHash ? 'Content changed!' : 'New content!'}`);

        // Overwrite: Hapus vektor lama milik halaman ini dari Pinecone dengan mendaftar ID potensialnya
        try {
          const pathKey = relativePath.replace(/\//g, '-') || 'home';
          const idsToDelete = [];
          for (let j = 0; j < 100; j++) {
            idsToDelete.push(`api-${pathKey}-chunk-${j}`);
          }
          console.log(`  🗑️  Deleting up to 100 potential previous Pinecone vectors for page "${pageLabel}"...`);
          await pineconeService.deleteMany(idsToDelete);
        } catch (delError) {
          console.warn(`  ⚠️  Failed to delete previous vectors for "${pageLabel}":`, delError.message);
        }

        // Chunk text
        const chunks = documentService.splitIntoChunks(
          cleanedText,
          config.embeddings.chunkSize,
          config.embeddings.chunkOverlap
        );

        console.log(`  📦 Split into ${chunks.length} chunks`);

        // Create embeddings
        const vectors = [];
        for (let j = 0; j < chunks.length; j++) {
          const chunk = chunks[j];
          const embedding = await openaiService.createEmbedding(chunk);

          vectors.push({
            id: `api-${relativePath.replace(/\//g, '-') || 'home'}-chunk-${j}`,
            values: embedding,
            metadata: {
              text: chunk,
              source: 'api-sync',
              url: url,
              page: pageLabel,
              chunkIndex: j,
              totalChunks: chunks.length,
              scrapedAt: new Date().toISOString()
            }
          });
        }

        // Index to Pinecone
        if (vectors.length > 0) {
          await pineconeService.upsertVectors(vectors);
          console.log(`  ✅ Indexed ${vectors.length} vectors to Pinecone`);
        }

        // Save local markdown file
        try {
          const saveResult = await documentDownloadService.saveScrapedContent(
            pageLabel,
            url,
            cleanedText,
            'md'
          );
          if (!saveResult.success) {
            console.error(`  ⚠️  Failed to save local document: ${saveResult.error}`);
          }
        } catch (error) {
          console.error(`  ⚠️  Failed to save local document: ${error.message}`);
        }

        // Save hash
        this.hashes[relativePath] = newHash;
        updatedCount++;

        results.push({
          page: pageLabel,
          url,
          success: true,
          reason: 'synchronized',
          chars: cleanedText.length,
          chunks: chunks.length
        });
      }

      // Save updated hashes
      this.saveHashes();

    } catch (error) {
      console.error(`\n❌ API Sync Error:`, error.message);
      errorCount++;
      results.push({ page: 'CMS API Connection', url: config.cmsApi.baseUrl, success: false, reason: 'error', error: error.message });
    }

    // Print summary
    console.log('\n📥 ═══════════════════════════════════════════');
    console.log('📊 SINKRONISASI API SUMMARY');
    console.log('📥 ═══════════════════════════════════════════');
    console.log(`  📄 Total items:     ${results.length}`);
    console.log(`  ✅ Sync/Updated:    ${updatedCount}`);
    console.log(`  ⏭️  Skipped:         ${skippedCount}`);
    console.log(`  ❌ Errors:          ${errorCount}`);
    console.log('📥 ═══════════════════════════════════════════\n');

    return {
      success: errorCount === 0,
      totalItems: results.length,
      updated: updatedCount,
      skipped: skippedCount,
      errors: errorCount,
      results
    };
  }
}

module.exports = new ApiSyncService();
