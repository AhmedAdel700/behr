import { EditRequestPageView } from "./EditRequestPage";

export default async function EditRequestRoute({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <EditRequestPageView id={id} />;
}
