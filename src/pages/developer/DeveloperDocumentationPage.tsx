import { useParams } from 'react-router-dom';
import DocumentationViewer from '@/components/documentation/DocumentationViewer';
import { getDeveloperDocUrl } from '@/config/platform-documentation';

export default function DeveloperDocumentationPage() {
  const { docId } = useParams<{ docId?: string }>();

  return <DocumentationViewer docId={docId} getDocUrl={getDeveloperDocUrl} />;
}
