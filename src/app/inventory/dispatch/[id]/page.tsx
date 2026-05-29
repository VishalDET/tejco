import { notFound } from "next/navigation"
import { getMockDispatch } from "../mock-data"
import { DispatchDetailsView } from "./dispatch-details-view"

export default async function DispatchDetailsPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params
  const dispatch = getMockDispatch(params.id)

  if (!dispatch) {
    notFound()
  }

  return <DispatchDetailsView dispatch={dispatch} />
}
