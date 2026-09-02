// This utility provides deterministic placeholder images for camera feeds
export function getCameraFeedImage(cameraCode: string, cameraName: string) {
  // Create a simple deterministic hash from the camera code
  const hash = (cameraCode || cameraName || 'DEFAULT').split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  
  // A curated list of high-quality Unsplash image IDs for traffic/CCTV feeds
  const images = [
    'https://images.unsplash.com/photo-1543162744-88484a92c4e5', // Traffic intersection
    'https://images.unsplash.com/photo-1528659553648-5c4d32049e75', // Overpass view
    'https://images.unsplash.com/photo-1520697779777-628d68f6bbaf', // City street
    'https://images.unsplash.com/photo-1528340191595-dfbbbc303bfa', // Busy road
    'https://images.unsplash.com/photo-1449824913935-59a10b8d2000', // Highway traffic
    'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800', // Toll plaza/road
    'https://images.unsplash.com/photo-1517409228969-9f7962451f04', // Generic traffic
    'https://images.unsplash.com/photo-1494522358652-33d562f79f33', // Aerial intersection
  ];
  
  const index = hash % images.length;
  
  return {
    url: `${images[index]}?auto=format&fit=crop&w=1200&q=80`,
  };
}
