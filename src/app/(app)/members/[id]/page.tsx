import { MemberDetailView } from "./member-detail-view";

type MemberDetailPageProps = {
 params: Promise<{ id: string }>;
};

export default async function MemberDetailPage({ params }: MemberDetailPageProps) {
 const { id } = await params;
 return (
 <div className="relative -mx-2 min-h-full overflow-hidden pb-12 sm:-mx-3 lg:-mx-5">
 <div className="mx-auto flex max-w-[1680px] flex-col gap-8 px-2 sm:px-4 lg:px-6">
 <MemberDetailView memberId={id} />
 </div>
 </div>
 );
}
