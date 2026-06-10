import { useParams } from 'react-router-dom';
import { LandingBuilder } from '@/components/landing-builder/builder/LandingBuilder';

export default function AdminLandingBuilder() {
  const { pageId } = useParams<{ pageId: string }>();
  if (!pageId) return null;
  return <LandingBuilder pageId={pageId} />;
}
