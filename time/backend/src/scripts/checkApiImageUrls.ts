import { query } from '../config/database';

const checkApiImageUrls = async () => {
  console.log('Checking API image URL format...\n');

  const announcements = await query<any[]>(`
    SELECT 
      id,
      title,
      image_path,
      image_data IS NOT NULL as has_image_data,
      image_mime_type
    FROM announcements
    WHERE is_active = 1
    ORDER BY display_order ASC
  `);

  console.log(`Found ${announcements.length} active announcements\n`);

  const baseUrl = 'http://localhost:5000';

  announcements.forEach(ann => {
    console.log(`ID: ${ann.id} - ${ann.title}`);
    console.log(`  Has Image Data: ${ann.has_image_data}`);
    console.log(`  Image Path: ${ann.image_path}`);
    
    // Simulate the API logic
    const imageUrl = ann.image_path 
      ? (ann.image_path.startsWith('http://') || ann.image_path.startsWith('https://') 
          ? ann.image_path 
          : (ann.has_image_data 
            ? `${baseUrl}/api/announcements/image/${ann.id}`
            : `${baseUrl}/api/announcements/file/${(ann.image_path || '').split('/').pop()}`))
      : null;
    
    console.log(`  Image URL: ${imageUrl}`);
    console.log('');
  });
};

checkApiImageUrls().catch(console.error);
