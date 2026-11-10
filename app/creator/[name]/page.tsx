import { getMergedVideos, getCreators } from '../../lib/db';
import CreatorClient from './CreatorClient';

export const revalidate = 60;

export default async function Page({ params }: { params: Promise<{ name: string }> }) {
  const { name } = await params;
  const creatorName = decodeURIComponent(name);
  const [allVideos, creators] = await Promise.all([
    getMergedVideos(),
    getCreators()
  ]);
  
  const creatorVideos = allVideos.filter(
    v => (v.creator && v.creator.toLowerCase() === creatorName.toLowerCase()) ||
         (v.title && v.title.toLowerCase() === creatorName.toLowerCase())
  );
  const creatorObj = creators.find(
    c => c.name.toLowerCase() === creatorName.toLowerCase()
  );
  
  const finalVideos = creatorVideos.length > 0
    ? creatorVideos
    : (creatorObj?.firstVideo ? [creatorObj.firstVideo] : []);
  
  return (
    <CreatorClient
      videos={finalVideos}
      creatorName={creatorObj?.name || creatorName}
      bio={creatorObj?.bio || finalVideos[0]?.desc}
    />
  );
}
