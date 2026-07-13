import { getMergedVideos, getCreators } from '../../lib/db';
import CreatorClient from './CreatorClient';

export const revalidate = 60;

export default async function Page({ params }: { params: Promise<{ name: string }> }) {
  const { name } = await params;
  const creatorName = decodeURIComponent(name);
  const allVideos = await getMergedVideos();
  const creators = await getCreators();
  
  const creatorVideos = allVideos.filter(v => v.creator === creatorName);
  const creatorObj = creators.find(c => c.name === creatorName);
  
  return <CreatorClient videos={creatorVideos} creatorName={creatorName} bio={creatorObj?.bio} />;
}
