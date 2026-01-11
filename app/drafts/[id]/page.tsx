import { redirect } from "next/navigation";

type DraftsRedirectProps = {
  params: { id: string };
};

export default function DraftsIdRedirect({ params }: DraftsRedirectProps) {
  redirect(`/posts/${params.id}`);
}
