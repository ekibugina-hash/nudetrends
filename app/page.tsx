import { getCreators } from './lib/db';
import HomeClient from './HomeClient';

// Cache this page at the edge for 60 seconds.
// This means 99% of users get an INSTANT response (blazing fast load) 
// without waiting for Cloudflare R2 on every visit.
export const revalidate = 60;

export default async function Page() {
  const initialCreators = await getCreators();
  return <HomeClient initialCreators={initialCreators} />;
}
