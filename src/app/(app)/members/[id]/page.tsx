import { MemberDetailView } from "./member-detail-view";
import { MembershipLifecycleProfileActions } from "./membership-lifecycle-profile-actions";

type MemberDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function MemberDetailPage({ params }: MemberDetailPageProps) {
  const { id } = await params;
  return (
    <div className="flex flex-col gap-6">
      <MembershipLifecycleProfileActions memberId={id} />
      <MemberDetailView memberId={id} />
    </div>
  );
}
