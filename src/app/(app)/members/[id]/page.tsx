import { MemberDetailView } from "./member-detail-view";

export default async function MemberDetailPage(props: PageProps<"/members/[id]">) {
  const { id } = await props.params;
  return <MemberDetailView memberId={id} />;
}
