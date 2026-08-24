import { MemberDetailView } from "./member-detail-view";

type MemberDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function MemberDetailPage({ params }: MemberDetailPageProps) {
  const { id } = await params;
  return <MemberDetailView memberId={id} />;
}
