import { useParams } from 'react-router-dom';
import DashboardLayout from '@/components/DashboardLayout';
import DocumentationViewer from '@/components/documentation/DocumentationViewer';
import { getPlatformDocUrl } from '@/config/platform-documentation';

export default function PlatformDocumentation() {
  const { docId } = useParams<{ docId?: string }>();

  return (
    <DashboardLayout>
      <DocumentationViewer docId={docId} getDocUrl={getPlatformDocUrl} />
    </DashboardLayout>
  );
}
