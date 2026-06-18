import { notFound } from "next/navigation"
import { DispatchDetailsView } from "./dispatch-details-view"
import { dispatchApi } from "@/lib/api"
import { mapApiDispatch } from "../types"

export default async function DispatchDetailsPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params
  
  let dispatch = null
  try {
    const apiDispatch = await dispatchApi.getById(params.id)
    if (apiDispatch) {
      dispatch = mapApiDispatch(apiDispatch)
    }
  } catch (err) {
    console.error("Failed to load dispatch details from API:", err)
  }

  if (!dispatch) {
    notFound()
  }

  return <DispatchDetailsView dispatch={dispatch} />
}
