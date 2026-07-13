import { getMergedVideos } from '../../lib/db';
import CreatorClient from './CreatorClient';

export const revalidate = 60;

export default async function Page({ params }: { params: { name: string } }) {
  const allVideos = await getMergedVideos();
  const creatorName = decodeURIComponent(params.name);
  const creatorVideos = allVideos.filter(v => v.creator === creatorName);
  
  return <CreatorClient videos={creatorVideos} creatorName={creatorName} />;
}
