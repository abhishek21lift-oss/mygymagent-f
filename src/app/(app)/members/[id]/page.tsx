import { MemberDetailView } from "./member-detail-view";

type MemberDetailPageProps = {
 params: Promise<{ id: string }>;
};

export default async function MemberDetailPage({ params }: MemberDetailPageProps) {
 const { id } = await params;
 return (
 <div className="pb-4">
 <div className="flex flex-col gap-5">
 <MemberDetailView memberId={id} />
 </div>
 </div>
 );
}
