import { MemberDetailView } from "./member-detail-view";

type MemberDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function MemberDetailPage({ params }: MemberDetailPageProps) {
  const { id } = await params;
  return (
    <div className="flex flex-col gap-6">
      <MemberDetailView memberId={id} />
    </div>
  );
}
